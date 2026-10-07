const { badRequest, ApiError } = require("./errors");

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

// Flash is the right tier here: notes from a transcript are a summarisation
// job, not a reasoning one, and Flash is far cheaper and faster.
//
// Google retires these faster than you would expect -- gemini-2.5-flash
// already answers 404 "no longer available to new users" -- and a busy model
// can answer 503. So the primary has a fallback chain behind it.
const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

const FALLBACK_MODELS = (
  process.env.GEMINI_FALLBACK_MODELS ||
  "gemini-flash-lite-latest,gemini-3.8-flash"
)
  .split(",")
  .map((name) => name.trim())
  .filter(Boolean);

// Flash takes a very large context, so almost every transcript fits in one
// call. Only genuinely long recordings need the chunked path below.
const SINGLE_PASS_CHAR_LIMIT = Number(process.env.GEMINI_SINGLE_PASS_CHARS || 120000);

const CHUNK_CHARS = 60000;

// A 26-minute talk takes around 50s, so leave real headroom for longer ones.
// Per attempt, not per request. A model that hangs should cost one attempt
// and move on, rather than eating the whole budget -- gemini-3.8-flash does
// exactly that under load: no 503, just silence.
const ATTEMPT_TIMEOUT_MS = Number(process.env.GEMINI_ATTEMPT_TIMEOUT_MS || 75000);

const isConfigured = () => Boolean(process.env.GEMINI_API_KEY);

// The shape we want back. Asking for JSON against a schema avoids parsing
// free-form prose, which is where this kind of feature usually breaks.
const NOTES_SCHEMA = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING" },
    summary: { type: "STRING" },
    keyPoints: { type: "ARRAY", items: { type: "STRING" } },
    sections: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          heading: { type: "STRING" },
          points: { type: "ARRAY", items: { type: "STRING" } },
        },
        required: ["heading", "points"],
      },
    },
    terms: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          term: { type: "STRING" },
          definition: { type: "STRING" },
        },
        required: ["term", "definition"],
      },
    },
    takeaways: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["title", "summary", "keyPoints", "sections"],
};

// One attempt against one model. Returns null when the model itself is the
// problem (gone, or overloaded) so the caller can try the next one.
async function tryModel({ model, prompt, schema, temperature }) {
  const controller = new AbortController();

  const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);

  let res;

  try {
    res = await fetch(
      `${ENDPOINT}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
            responseSchema: schema,
          },
        }),
      },
    );
  } catch (err) {
    // Timed out or network blip: treat it like an unavailable model so the
    // chain can try the next one.
    if (err.name === "AbortError") {
      console.warn(`Gemini model ${model} timed out after ${ATTEMPT_TIMEOUT_MS}ms.`);

      return null;
    }

    console.warn(`Gemini model ${model} unreachable: ${err.message}`);

    return null;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text();

    if (res.status === 400 && /API key not valid/i.test(detail)) {
      throw new ApiError(503, "The Gemini API key is not valid. Check server/.env.");
    }

    if (res.status === 429) {
      throw new ApiError(
        429,
        "Gemini is rate limiting this key. Wait a moment and try again.",
      );
    }

    // Model retired, or temporarily overloaded: worth trying the next one.
    if (res.status === 404 || res.status === 503) {
      console.warn(`Gemini model ${model} unavailable (${res.status}).`);

      return null;
    }

    console.error(`Gemini ${res.status} on ${model}: ${detail.slice(0, 300)}`);

    throw new ApiError(502, "The notes service returned an error.");
  }

  const data = await res.json();

  const blocked = data?.promptFeedback?.blockReason;

  if (blocked) {
    throw badRequest("Gemini declined to summarise this transcript.");
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new ApiError(502, "The notes service returned nothing usable.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(502, "The notes service returned malformed JSON.");
  }
}

// Walks the model chain until one answers.
async function callGemini({ prompt, schema, temperature = 0.2 }) {
  if (!isConfigured()) {
    throw new ApiError(
      503,
      "Notes are not configured on this server. Add GEMINI_API_KEY to server/.env.",
    );
  }

  for (const model of [MODEL, ...FALLBACK_MODELS]) {
    const result = await tryModel({ model, prompt, schema, temperature });

    if (result) return { ...result, __model: model };
  }

  throw new ApiError(
    503,
    "The notes model is unavailable right now. Please try again shortly.",
  );
}

const notesPrompt = (title, transcript) => `You are turning a video transcript into study notes.

Video title: ${title}

Rules:
- Use only what the transcript actually says. Do not invent facts, numbers or names.
- Write in clear, plain prose. No filler, no "in this video the speaker...".
- Group related material under meaningful headings that follow the talk's structure.
- "terms" is for jargon the transcript explains; leave it empty if there is none.
- If the transcript is too garbled or short to summarise, say so in "summary".

Transcript:
"""
${transcript}
"""`;

const mergePrompt = (title, partials) => `You are merging notes taken from consecutive parts of one video into a single set of study notes.

Video title: ${title}

Rules:
- Combine overlapping points rather than repeating them.
- Keep the original ordering of the material.
- Do not introduce anything that is not in the parts below.

Parts:
${partials
  .map((part, index) => `--- Part ${index + 1} ---\n${JSON.stringify(part)}`)
  .join("\n\n")}`;

function chunk(text, size) {
  const chunks = [];

  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }

  return chunks;
}

/**
 * Transcript in, structured notes out.
 *
 * Short and medium transcripts go in a single call, which is both cheaper and
 * better: the model sees the whole talk at once. Only very long ones fall back
 * to map-reduce -- notes per chunk, then one merge pass.
 */
async function generateStructuredNotes(transcript, { title }) {
  const clean = String(transcript || "").trim();

  if (clean.length < 200) {
    throw badRequest("This transcript is too short to make notes from.");
  }

  if (clean.length <= SINGLE_PASS_CHAR_LIMIT) {
    const { __model, ...notes } = await callGemini({
      prompt: notesPrompt(title, clean),
      schema: NOTES_SCHEMA,
    });

    return { notes, passes: 1, model: __model };
  }

  const pieces = chunk(clean, CHUNK_CHARS);

  // Map: notes per chunk, in parallel.
  const partials = await Promise.all(
    pieces.map((piece, index) =>
      callGemini({
        prompt: notesPrompt(`${title} (part ${index + 1} of ${pieces.length})`, piece),
        schema: NOTES_SCHEMA,
      }),
    ),
  );

  // Reduce: one merge pass over the partial notes, not the raw text.
  const { __model, ...merged } = await callGemini({
    prompt: mergePrompt(title, partials),
    schema: NOTES_SCHEMA,
    temperature: 0.1,
  });

  return { notes: merged, passes: pieces.length + 1, model: __model };
}

// Renders the structured notes as Markdown for the downloaded file.
function notesToMarkdown(notes, meta) {
  const lines = [`# ${notes.title || meta.title}`, ""];

  if (meta.channel) lines.push(`**Channel:** ${meta.channel}  `);

  lines.push(`**Source:** https://www.youtube.com/watch?v=${meta.videoId}  `);

  lines.push(`**Notes generated:** ${new Date().toLocaleString()}`, "");

  if (notes.summary) lines.push("## Summary", "", notes.summary, "");

  if (notes.keyPoints?.length) {
    lines.push("## Key points", "");

    notes.keyPoints.forEach((point) => lines.push(`- ${point}`));

    lines.push("");
  }

  (notes.sections || []).forEach((section) => {
    lines.push(`## ${section.heading}`, "");

    (section.points || []).forEach((point) => lines.push(`- ${point}`));

    lines.push("");
  });

  if (notes.terms?.length) {
    lines.push("## Terms", "");

    notes.terms.forEach(({ term, definition }) =>
      lines.push(`- **${term}** — ${definition}`),
    );

    lines.push("");
  }

  if (notes.takeaways?.length) {
    lines.push("## Takeaways", "");

    notes.takeaways.forEach((item) => lines.push(`- ${item}`));

    lines.push("");
  }

  return lines.join("\n");
}

module.exports = {
  MODEL,
  isConfigured,
  generateStructuredNotes,
  notesToMarkdown,
  NOTES_SCHEMA,
};

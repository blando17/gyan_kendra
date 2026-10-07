const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

process.env.MONGODB_URI =
  process.env.TEST_MONGODB_URI || "mongodb://127.0.0.1:27017/gyankendra_test";

process.env.JWT_SECRET_KEY = "test-secret";

const app = require("../app");
const { connectDB } = require("../config/db");

let baseUrl;
let server;

// Minimal client that remembers one user's bearer token.
function client() {
  let token = null;

  const call = async (method, path, body) => {
    const headers = {};

    if (token) headers.Authorization = `Bearer ${token}`;

    if (body !== undefined) headers["Content-Type"] = "application/json";

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();

    let json = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    if (json?.token) token = json.token;

    return { status: res.status, body: json };
  };

  call.setToken = (value) => {
    token = value;
  };

  return call;
}

test.before(async () => {
  await connectDB();

  await mongoose.connection.dropDatabase();

  server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

test.after(async () => {
  server?.close();

  await mongoose.connection.close();
});

let alice;
let bob;
let topicId;

test("auth: signup, login, me, and rejection of bad or missing tokens", async () => {
  alice = client();
  bob = client();

  const short = await alice("POST", "/auth/signup", {
    username: "Alice",
    email: "alice@example.com",
    password: "123",
  });
  assert.equal(short.status, 400, "password under 6 chars rejected");

  const signedUp = await alice("POST", "/auth/signup", {
    username: "Alice",
    email: "alice@example.com",
    password: "alicepass",
  });
  assert.equal(signedUp.status, 201);
  assert.ok(signedUp.body.token, "a token is issued");
  assert.ok(!("password" in signedUp.body.user), "no password echoed back");

  const duplicate = await client()("POST", "/auth/signup", {
    username: "Alice2",
    email: "alice@example.com",
    password: "alicepass",
  });
  assert.equal(duplicate.status, 400, "duplicate email rejected");

  const me = await alice("GET", "/auth/me");
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, "alice@example.com");

  const wrongPass = await client()("POST", "/auth/login", {
    email: "alice@example.com",
    password: "nope",
  });
  assert.equal(wrongPass.status, 401);

  const unknownEmail = await client()("POST", "/auth/login", {
    email: "nobody@example.com",
    password: "whatever",
  });
  assert.equal(
    unknownEmail.body.message,
    wrongPass.body.message,
    "same message, so emails cannot be probed",
  );

  const loggedIn = await alice("POST", "/auth/login", {
    email: "alice@example.com",
    password: "alicepass",
  });
  assert.equal(loggedIn.status, 200);

  assert.equal(
    (await client()("GET", "/topics")).status,
    401,
    "missing token rejected",
  );

  const forged = client();
  forged.setToken("not.a.real.jwt");
  assert.equal(
    (await forged("GET", "/topics")).status,
    403,
    "invalid token rejected",
  );

  const bobSignup = await bob("POST", "/auth/signup", {
    username: "Bob",
    email: "bob@example.com",
    password: "bobpass",
  });
  assert.equal(bobSignup.status, 201);
});

test("topics: create, read, update, filter, search, delete", async () => {
  const created = await alice("POST", "/topics", {
    title: "Binary Search",
    description: "Divide and conquer on sorted data",
    category: "DSA / CP",
    tags: ["DSA", "Searching"],
    status: "Learning",
  });
  assert.equal(created.status, 201);
  topicId = created.body.topic._id;
  assert.ok(created.body.topic.nextReviewAt, "a first review is scheduled");
  assert.equal(created.body.topic.reviewCount, 0);

  assert.equal(
    (await alice("POST", "/topics", { description: "no title" })).status,
    400,
  );

  // Categories are free text so users can add their own, but still bounded.
  const custom = await alice("POST", "/topics", {
    title: "Normalization",
    category: "Databases",
  });
  assert.equal(custom.status, 201, "a user may invent a category");
  assert.equal(custom.body.topic.category, "Databases");

  assert.equal(
    (await alice("POST", "/topics", { title: "X", category: "z".repeat(41) }))
      .status,
    400,
    "but a category still has a length limit",
  );

  const categories = await alice("GET", "/topics/categories");
  assert.equal(categories.status, 200);
  assert.ok(
    categories.body.defaults.includes("DSA / CP"),
    "built-ins are offered",
  );
  assert.deepEqual(
    categories.body.custom,
    ["Databases"],
    "and the user's own come back separately",
  );

  await alice("DELETE", `/topics/${custom.body.topic._id}`);

  await alice("POST", "/topics", {
    title: "Dynamic Programming",
    category: "DSA / CP",
    status: "Completed",
    tags: ["DSA"],
  });
  await alice("POST", "/topics", {
    title: "React Server Components",
    category: "Development",
    status: "To Learn",
  });

  const all = await alice("GET", "/topics");
  assert.equal(all.body.topics.length, 3);

  const byCategory = await alice("GET", "/topics?category=Development");
  assert.equal(byCategory.body.topics.length, 1);

  const byStatus = await alice("GET", "/topics?status=Completed");
  assert.equal(byStatus.body.topics.length, 1);

  const bySearch = await alice("GET", "/topics?search=binary");
  assert.equal(bySearch.body.topics.length, 1);
  assert.equal(bySearch.body.topics[0].title, "Binary Search");

  const byTag = await alice("GET", "/topics?tag=Searching");
  assert.equal(byTag.body.topics.length, 1);

  // A regex metacharacter must not match everything.
  const meta = await alice("GET", "/topics?search=.*");
  assert.equal(meta.body.topics.length, 0, "search term is escaped");

  const updated = await alice("PUT", `/topics/${topicId}`, {
    status: "Completed",
    isFavorite: true,
  });
  assert.equal(updated.body.topic.status, "Completed");
  assert.equal(updated.body.topic.isFavorite, true);

  const favourites = await alice("GET", "/topics?favorite=true");
  assert.equal(favourites.body.topics.length, 1);

  assert.equal((await alice("PUT", `/topics/${topicId}`, {})).status, 400);

  assert.equal((await alice("GET", "/topics/not-an-id")).status, 400);
});

test("a client cannot forge ownership or review state", async () => {
  const sneaky = await alice("PUT", `/topics/${topicId}`, {
    userId: "000000000000000000000001",
    reviewCount: 99,
    nextReviewAt: "2099-01-01",
  });
  assert.equal(sneaky.status, 400, "a body with no writable field is rejected");

  const mixed = await alice("PUT", `/topics/${topicId}`, {
    title: "Binary Search",
    reviewCount: 99,
    nextReviewAt: "2099-01-01",
  });
  assert.equal(mixed.status, 200);
  assert.equal(mixed.body.topic.reviewCount, 0, "reviewCount ignored");
  assert.notEqual(
    new Date(mixed.body.topic.nextReviewAt).getFullYear(),
    2099,
    "nextReviewAt ignored",
  );
});

test("resources: add with type detection, edit, delete", async () => {
  const yt = await alice("POST", `/topics/${topicId}/resources`, {
    title: "Explained step by step",
    url: "https://youtube.com/watch?v=s4D228viH18",
  });
  assert.equal(yt.status, 201);
  assert.equal(yt.body.resource.type, "YouTube", "type detected from the host");

  const gh = await alice("POST", `/topics/${topicId}/resources`, {
    title: "Reference implementation",
    url: "https://github.com/someone/repo",
  });
  assert.equal(gh.body.resource.type, "GitHub");

  const lc = await alice("POST", `/topics/${topicId}/resources`, {
    title: "Practice",
    url: "https://leetcode.com/problems/binary-search/",
  });
  assert.equal(lc.body.resource.type, "Problem");

  const pdf = await alice("POST", `/topics/${topicId}/resources`, {
    title: "Paper",
    url: "https://arxiv.org/pdf/1706.03762.pdf",
  });
  assert.equal(pdf.body.resource.type, "PDF");

  const explicit = await alice("POST", `/topics/${topicId}/resources`, {
    title: "Blog",
    url: "https://example.com/post",
    type: "Documentation",
  });
  assert.equal(explicit.body.resource.type, "Documentation", "explicit type wins");

  assert.equal(
    (
      await alice("POST", `/topics/${topicId}/resources`, {
        title: "Bad",
        url: "javascript:alert(1)",
      })
    ).status,
    400,
    "non-http link rejected",
  );

  const resourceId = yt.body.resource._id;

  const edited = await alice(
    "PUT",
    `/topics/${topicId}/resources/${resourceId}`,
    { title: "Renamed video" },
  );
  assert.equal(edited.status, 200);
  assert.equal(
    edited.body.topic.resources.find((r) => r._id === resourceId).title,
    "Renamed video",
  );

  const removed = await alice(
    "DELETE",
    `/topics/${topicId}/resources/${resourceId}`,
  );
  assert.equal(removed.body.topic.resources.length, 4);

  assert.equal(
    (await alice("DELETE", `/topics/${topicId}/resources/${resourceId}`)).status,
    404,
    "deleting twice is a 404",
  );
});

test("checklist: add, tick off, remove", async () => {
  const added = await alice("POST", `/topics/${topicId}/checklist`, {
    text: "Solve 5 problems",
  });
  assert.equal(added.status, 201);

  const itemId = added.body.topic.checklist[0]._id;

  const ticked = await alice(
    "PATCH",
    `/topics/${topicId}/checklist/${itemId}`,
    { completed: true },
  );
  assert.equal(ticked.body.topic.checklist[0].completed, true);

  const removed = await alice(
    "DELETE",
    `/topics/${topicId}/checklist/${itemId}`,
  );
  assert.equal(removed.body.topic.checklist.length, 0);
});

test("notes autosave stores the text exactly", async () => {
  const notes = "# Binary Search\n\n- low / high\n- `mid = low + (high-low)/2`";

  const saved = await alice("PATCH", `/topics/${topicId}/notes`, { notes });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.topic.notes, notes, "line breaks preserved");

  assert.equal(
    (await alice("PATCH", `/topics/${topicId}/notes`, { notes: 42 })).status,
    400,
  );
});

test("revision: intervals grow 3 -> 7 -> 14 -> 30 -> 60 and then hold", async () => {
  const expected = [3, 7, 14, 30, 60, 60];

  for (const [index, days] of expected.entries()) {
    const reviewed = await alice("PATCH", `/topics/${topicId}/review`);

    assert.equal(reviewed.status, 200);
    assert.equal(reviewed.body.intervalDays, days, `review ${index + 1}`);
    assert.equal(reviewed.body.topic.reviewCount, index + 1);

    const gap = Math.round(
      (new Date(reviewed.body.topic.nextReviewAt) -
        new Date(reviewed.body.topic.lastReviewedAt)) /
        86400000,
    );
    assert.equal(gap, days, "the stored date matches the interval");
  }
});

test("due list returns overdue topics and anything flagged for revision", async () => {
  const fresh = await alice("POST", "/topics", { title: "Fresh topic" });

  const notDue = await alice("GET", "/topics/due");
  assert.ok(
    !notDue.body.topics.some((t) => t._id === fresh.body.topic._id),
    "a topic due in 2 days is not in today's list",
  );

  // Back-date it the way time passing would.
  const Topic = require("../models/Topic");
  await Topic.updateOne(
    { _id: fresh.body.topic._id },
    { $set: { nextReviewAt: new Date(Date.now() - 86400000) } },
  );

  const due = await alice("GET", "/topics/due");
  assert.ok(due.body.topics.some((t) => t._id === fresh.body.topic._id));

  await alice("PUT", `/topics/${fresh.body.topic._id}`, {
    status: "Needs Revision",
  });
  const flagged = await alice("GET", "/topics/due");
  assert.ok(flagged.body.topics.some((t) => t._id === fresh.body.topic._id));

  await alice("DELETE", `/topics/${fresh.body.topic._id}`);
});

test("duplicate copies content but resets review state", async () => {
  const copy = await alice("POST", `/topics/${topicId}/duplicate`);
  assert.equal(copy.status, 201);
  assert.equal(copy.body.topic.title, "Binary Search (Copy)");
  assert.equal(copy.body.topic.reviewCount, 0, "review history is not copied");
  assert.equal(copy.body.topic.lastReviewedAt, null);
  assert.equal(copy.body.topic.isFavorite, false);
  assert.equal(
    copy.body.topic.resources.length,
    4,
    "resources come along",
  );

  await alice("DELETE", `/topics/${copy.body.topic._id}`);
});

test("quick notes: create, list, convert to a topic", async () => {
  const note = await alice("POST", "/quick-notes", {
    content: "Compare aggregation pipeline vs map-reduce for stats",
    tags: ["MongoDB"],
  });
  assert.equal(note.status, 201);

  assert.equal((await alice("POST", "/quick-notes", { content: "  " })).status, 400);

  const list = await alice("GET", "/quick-notes");
  assert.equal(list.body.quickNotes.length, 1);

  const converted = await alice(
    "POST",
    `/quick-notes/${note.body.quickNote._id}/convert`,
  );
  assert.equal(converted.status, 201);
  assert.equal(converted.body.topic.tags[0], "MongoDB", "tags carry over");
  assert.ok(converted.body.topic.notes.includes("aggregation"));

  const after = await alice("GET", "/quick-notes");
  assert.equal(after.body.quickNotes.length, 0, "the note leaves the scratchpad");

  await alice("DELETE", `/topics/${converted.body.topic._id}`);
});

test("collections: create, count topics, rename cascades, delete unlabels", async () => {
  const created = await alice("POST", "/collections", {
    name: "DSA Preparation",
  });
  assert.equal(created.status, 201);

  assert.equal(
    (await alice("POST", "/collections", { name: "DSA Preparation" })).status,
    400,
    "duplicate name rejected",
  );

  await alice("PUT", `/topics/${topicId}`, {
    collections: ["DSA Preparation"],
  });

  const listed = await alice("GET", "/collections");
  assert.equal(listed.body.collections[0].topicCount, 1);

  const renamed = await alice(
    "PUT",
    `/collections/${created.body.collection._id}`,
    { name: "Interview Prep" },
  );
  assert.equal(renamed.status, 200);

  const topicAfterRename = await alice("GET", `/topics/${topicId}`);
  assert.deepEqual(
    topicAfterRename.body.topic.collections,
    ["Interview Prep"],
    "the rename follows through to the topics",
  );

  await alice("DELETE", `/collections/${created.body.collection._id}`);

  const topicAfterDelete = await alice("GET", `/topics/${topicId}`);
  assert.deepEqual(
    topicAfterDelete.body.topic.collections,
    [],
    "topics survive, they just lose the label",
  );
});

test("stats and activity reflect only this account", async () => {
  const stats = await alice("GET", "/topics/stats");
  assert.equal(stats.status, 200);
  assert.ok(stats.body.stats.total >= 3);
  assert.equal(stats.body.stats.velocity.length, 7, "seven day buckets");

  const activities = await alice("GET", "/activities");
  assert.ok(activities.body.activities.length > 0);
  assert.ok(
    activities.body.activities.some((a) => a.type === "review"),
    "reviewing was recorded",
  );

  const bobStats = await bob("GET", "/topics/stats");
  assert.equal(bobStats.body.stats.total, 0, "Bob's board is empty");
});

test("user isolation: Bob cannot touch Alice's data", async () => {
  assert.equal((await bob("GET", "/topics")).body.topics.length, 0);

  assert.equal((await bob("GET", `/topics/${topicId}`)).status, 404);

  assert.equal(
    (await bob("PUT", `/topics/${topicId}`, { title: "Hacked" })).status,
    404,
  );

  assert.equal((await bob("DELETE", `/topics/${topicId}`)).status, 404);

  assert.equal(
    (await bob("PATCH", `/topics/${topicId}/notes`, { notes: "mine now" })).status,
    404,
  );

  assert.equal((await bob("PATCH", `/topics/${topicId}/review`)).status, 404);

  assert.equal(
    (await bob("POST", `/topics/${topicId}/duplicate`)).status,
    404,
    "cannot duplicate into his own board",
  );

  assert.equal(
    (
      await bob("POST", `/topics/${topicId}/resources`, {
        title: "x",
        url: "https://example.com",
      })
    ).status,
    404,
  );

  assert.equal((await bob("GET", "/quick-notes")).body.quickNotes.length, 0);

  assert.equal((await bob("GET", "/activities")).body.activities.length, 1, "only his own signup entry");

  // Alice's data came through all of that untouched.
  const mine = await alice("GET", `/topics/${topicId}`);
  assert.equal(mine.body.topic.title, "Binary Search");
  assert.equal(mine.body.topic.notes.startsWith("# Binary Search"), true);
});

test("youtube: link parsing accepts every common shape, rejects the rest", async () => {
  const { parseVideoId } = require("../utils/youtube");

  const accepted = {
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ": "dQw4w9WgXcQ",
    "https://youtu.be/dQw4w9WgXcQ?si=xyz": "dQw4w9WgXcQ",
    "https://www.youtube.com/shorts/dQw4w9WgXcQ": "dQw4w9WgXcQ",
    "https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=30s": "dQw4w9WgXcQ",
    "youtube.com/embed/dQw4w9WgXcQ": "dQw4w9WgXcQ",
    dQw4w9WgXcQ: "dQw4w9WgXcQ",
  };

  for (const [input, expected] of Object.entries(accepted)) {
    assert.equal(parseVideoId(input), expected, input);
  }

  for (const bad of ["https://vimeo.com/123", "not a link", "", "https://www.youtube.com/"]) {
    assert.throws(() => parseVideoId(bad), /Invalid|Could not find|Paste|does not look/i, `should reject: ${bad}`);
  }
});

test("youtube: the .txt is formatted, and never stored on the server", async () => {
  const { formatTranscript, safeFilename } = require("../utils/youtube");

  const segments = [
    { text: "Hello there.", offset: 1000, duration: 900 },
    { text: "This is a &amp;#39;test&amp;#39;.", offset: 2000, duration: 900 },
    { text: "Last line.", offset: 125000, duration: 900 },
  ];

  const meta = { videoId: "abc12345678", title: "A Talk", channel: "Someone" };

  const plain = formatTranscript(segments, meta);
  assert.ok(plain.startsWith("A Talk"), "title heads the file");
  assert.ok(plain.includes("Channel: Someone"));
  assert.ok(plain.includes("https://www.youtube.com/watch?v=abc12345678"));
  assert.ok(plain.includes("'test'"), "html entities are decoded");
  assert.ok(!/\[\d+:\d\d\]/.test(plain), "no timestamps unless asked");

  const stamped = formatTranscript(segments, meta, { withTimestamps: true });
  assert.ok(stamped.includes("[0:01] Hello there."));
  assert.ok(stamped.includes("[2:05] Last line."), "minutes roll over correctly");

  assert.equal(
    safeFilename('My/Talk: "part 1"', "abc12345678"),
    "MyTalk part 1 [abc12345678].txt",
    "filename is filesystem safe",
  );
});

test("transcripts: history is scoped per user and holds no transcript text", async () => {
  const Transcript = require("../models/Transcript");

  // Seed a history row directly, so the test does not depend on YouTube.
  const me = await alice("GET", "/auth/me");

  await Transcript.create({
    userId: me.body.user._id,
    videoId: "abc12345678",
    title: "A Talk",
    channel: "Someone",
    url: "https://www.youtube.com/watch?v=abc12345678",
    segmentCount: 3,
    wordCount: 6,
    charCount: 40,
  });

  const mine = await alice("GET", "/transcripts");
  assert.equal(mine.status, 200);
  assert.equal(mine.body.transcripts.length, 1);

  const entry = mine.body.transcripts[0];
  assert.equal(entry.title, "A Talk");
  assert.ok(!("text" in entry), "the transcript text is not kept");
  assert.ok(!("transcript" in entry), "the transcript text is not kept");

  // Bob sees nothing and cannot delete Alice's row.
  assert.equal((await bob("GET", "/transcripts")).body.transcripts.length, 0);
  assert.equal((await bob("DELETE", `/transcripts/${entry._id}`)).status, 404);

  assert.equal(
    (await client()("GET", "/transcripts")).status,
    401,
    "history needs a token",
  );

  assert.equal((await alice("DELETE", `/transcripts/${entry._id}`)).status, 200);
  assert.equal((await alice("GET", "/transcripts")).body.transcripts.length, 0);
});

test("transcripts: a bad link is rejected before anything is saved", async () => {
  const Transcript = require("../models/Transcript");

  const before = await Transcript.countDocuments();

  const res = await alice("POST", "/transcripts", { url: "https://vimeo.com/123" });
  assert.equal(res.status, 400);
  assert.match(res.body.message, /video id/i);

  assert.equal(
    await Transcript.countDocuments(),
    before,
    "nothing was written for a rejected link",
  );
});

test("rate limiting: the window caps requests, then releases", async () => {
  const rateLimit = require("../middleware/rateLimit");

  rateLimit.reset();

  const limiter = rateLimit({ name: "test", windowMs: 300, max: 3 });

  const run = () =>
    new Promise((resolve) => {
      const headers = {};

      const req = { user: { id: "someone" }, ip: "1.2.3.4" };

      const res = {
        setHeader: (k, v) => {
          headers[k] = v;
        },
        getHeader: (k) => headers[k],
        status(code) {
          this.statusCode = code;

          return this;
        },
        json(body) {
          resolve({ status: this.statusCode, body, headers });
        },
      };

      limiter(req, res, () => resolve({ status: 200, headers }));
    });

  const first = await run();
  assert.equal(first.status, 200);
  assert.equal(first.headers["X-RateLimit-Remaining"], 2, "remaining counts down");

  assert.equal((await run()).status, 200);
  assert.equal((await run()).status, 200);

  const blocked = await run();
  assert.equal(blocked.status, 429, "the fourth call in the window is refused");
  assert.match(blocked.body.message, /too many/i);
  assert.ok(blocked.body.retryAfterSeconds >= 1, "it says when to come back");
  assert.equal(blocked.headers["Retry-After"], blocked.body.retryAfterSeconds);

  // Once the window slides past, the budget returns.
  await new Promise((resolve) => setTimeout(resolve, 350));

  assert.equal((await run()).status, 200, "the window releases");

  rateLimit.reset();
});

test("rate limiting: separate callers get separate budgets", async () => {
  const rateLimit = require("../middleware/rateLimit");

  rateLimit.reset();

  const limiter = rateLimit({ name: "perkey", windowMs: 1000, max: 1 });

  const call = (userId) =>
    new Promise((resolve) => {
      const headers = {};

      const res = {
        setHeader: (k, v) => {
          headers[k] = v;
        },
        getHeader: (k) => headers[k],
        status(code) {
          this.statusCode = code;

          return this;
        },
        json: () => resolve(this?.statusCode || 429),
      };

      limiter({ user: { id: userId }, ip: "9.9.9.9" }, res, () => resolve(200));
    });

  assert.equal(await call("alice"), 200);
  assert.notEqual(await call("alice"), 200, "alice has used her budget");
  assert.equal(await call("bob"), 200, "bob still has his own");

  rateLimit.reset();
});

test("transcripts: generating is rate limited", async () => {
  const rateLimit = require("../middleware/rateLimit");

  rateLimit.reset();

  // The configured burst limit is 6/minute. Fire more than that at an
  // invalid link: rejection happens after the limiter, so the counter moves.
  const codes = [];

  for (let i = 0; i < 8; i += 1) {
    const res = await alice("POST", "/transcripts", { url: "https://vimeo.com/1" });

    codes.push(res.status);
  }

  assert.ok(codes.includes(429), `expected a 429 among ${codes.join(",")}`);
  assert.equal(codes[0], 400, "the first few are ordinary validation errors");

  rateLimit.reset();
});

test("notes: the markdown renderer turns structure into a readable file", () => {
  const { notesToMarkdown } = require("../utils/gemini");

  const notes = {
    title: "Event loop",
    summary: "How JavaScript runs asynchronous work.",
    keyPoints: ["One call stack", "Callbacks wait in a queue"],
    sections: [{ heading: "The stack", points: ["Frames push and pop"] }],
    terms: [{ term: "Call stack", definition: "Where frames live." }],
    takeaways: ["Do not block the stack"],
  };

  const md = notesToMarkdown(notes, {
    videoId: "abc12345678",
    title: "fallback",
    channel: "JSConf",
  });

  assert.ok(md.startsWith("# Event loop"), "title heads the file");
  assert.ok(md.includes("**Channel:** JSConf"));
  assert.ok(md.includes("https://www.youtube.com/watch?v=abc12345678"));
  assert.ok(md.includes("## Summary"));
  assert.ok(md.includes("- One call stack"), "key points become bullets");
  assert.ok(md.includes("## The stack"), "sections become headings");
  assert.ok(md.includes("- **Call stack** — Where frames live."));
  assert.ok(md.includes("## Takeaways"));

  // Optional blocks are skipped rather than left empty.
  const minimal = notesToMarkdown(
    { title: "T", summary: "S", keyPoints: [], sections: [] },
    { videoId: "abc12345678", title: "T" },
  );
  assert.ok(!minimal.includes("## Terms"));
  assert.ok(!minimal.includes("## Takeaways"));
});

test("notes: the feature reports itself unavailable without a key", async () => {
  const previous = process.env.GEMINI_API_KEY;

  delete process.env.GEMINI_API_KEY;

  const caps = await alice("GET", "/transcripts/capabilities");
  assert.equal(caps.status, 200);
  assert.equal(caps.body.notes.available, false);

  const res = await alice("POST", "/transcripts/notes", {
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  });
  assert.equal(res.status, 503, "it explains rather than crashing");
  assert.match(res.body.message, /GEMINI_API_KEY/);

  if (previous) process.env.GEMINI_API_KEY = previous;
});

test("notes: a model that hangs falls through to the next one", async () => {
  // Regression: gemini-3.8-flash stopped answering under load -- no 503, just
  // silence. The chain only moved on for an error *response*, so a hang ate
  // the whole timeout and failed the request instead of trying the next model.
  const { generateStructuredNotes } = require("../utils/gemini");

  const realFetch = globalThis.fetch;

  const tried = [];

  process.env.GEMINI_API_KEY = "test-key";
  process.env.GEMINI_ATTEMPT_TIMEOUT_MS = "150";

  globalThis.fetch = (url, options) => {
    const model = String(url).match(/models\/([^:]+):/)[1];

    tried.push(model);

    // The first model never answers; the signal aborts it.
    if (tried.length === 1) {
      return new Promise((_, reject) => {
        options.signal.addEventListener("abort", () => {
          const err = new Error("aborted");

          err.name = "AbortError";

          reject(err);
        });
      });
    }

    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    title: "T",
                    summary: "S",
                    keyPoints: ["a"],
                    sections: [],
                  }),
                },
              ],
            },
          },
        ],
      }),
    });
  };

  try {
    const result = await generateStructuredNotes("x".repeat(400), {
      title: "Hanging model",
    });

    assert.equal(result.notes.title, "T", "the second model produced the notes");
    assert.ok(tried.length >= 2, `expected a fallback, tried: ${tried.join(", ")}`);
    assert.notEqual(result.model, tried[0], "it reports the model that answered");
  } finally {
    globalThis.fetch = realFetch;

    delete process.env.GEMINI_ATTEMPT_TIMEOUT_MS;

    delete process.env.GEMINI_API_KEY;
  }
});

test("notes: too short a transcript is refused before calling the model", async () => {
  const { generateStructuredNotes } = require("../utils/gemini");

  await assert.rejects(
    () => generateStructuredNotes("hi there", { title: "x" }),
    /too short/i,
  );
});

test("unknown routes answer with JSON, not HTML", async () => {
  const unknown = await alice("GET", "/does-not-exist");
  assert.equal(unknown.status, 404);
  assert.ok(unknown.body.message);
});

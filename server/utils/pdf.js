const PDFDocument = require("pdfkit");

/**
 * Renders structured notes as a PDF.
 *
 * Built from the structured object rather than the Markdown string, so the
 * layout is real typography -- headings, spacing, bullets -- instead of
 * printed markup. Returns a Buffer; nothing touches disk.
 */

const INK = "#111827";

const MUTED = "#6b7280";

const ACCENT = "#6d28d9";

const RULE = "#e5e7eb";

// pdfkit's built-in fonts are WinAnsi, so characters outside that range
// (Devanagari in a title, smart quotes, em dashes) would throw. Normalise
// what we can and drop the rest rather than failing the whole download.
function toWinAnsi(value = "") {
  return String(value)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/ /g, " ")
    // anything still outside Latin-1 cannot be encoded by the base fonts
    .replace(/[^\x00-\xFF]/g, "");
}

function notesToPdf(notes, meta) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      // Required so the page-number pass below can revisit earlier pages.
      bufferPages: true,
      margins: { top: 64, bottom: 64, left: 64, right: 64 },
      info: {
        Title: toWinAnsi(notes.title || meta.title),
        Author: toWinAnsi(meta.channel || "GyanKendra"),
        Subject: "Study notes generated from a video transcript",
        Creator: "GyanKendra",
      },
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.on("error", reject);

    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    const heading = (text) => {
      // Keep a heading with at least a little of its content.
      if (doc.y > doc.page.height - doc.page.margins.bottom - 90) doc.addPage();

      doc
        .moveDown(0.9)
        .font("Helvetica-Bold")
        .fontSize(13)
        .fillColor(ACCENT)
        .text(toWinAnsi(text), { width })
        .moveDown(0.35);
    };

    const bullets = (items = []) => {
      doc.font("Helvetica").fontSize(10.5).fillColor(INK);

      items.forEach((item) => {
        doc.text(`•  ${toWinAnsi(item)}`, {
          width,
          align: "left",
          indent: 4,
          lineGap: 1.5,
        });

        doc.moveDown(0.28);
      });
    };

    // --- title block ---
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor(INK)
      .text(toWinAnsi(notes.title || meta.title), { width });

    doc.moveDown(0.4);

    const meta_lines = [
      meta.channel ? `Channel: ${meta.channel}` : null,
      `Source: https://www.youtube.com/watch?v=${meta.videoId}`,
      `Generated ${new Date().toLocaleString()} by GyanKendra`,
    ].filter(Boolean);

    doc.font("Helvetica").fontSize(9).fillColor(MUTED);

    meta_lines.forEach((line) => doc.text(toWinAnsi(line), { width }));

    doc.moveDown(0.6);

    doc
      .strokeColor(RULE)
      .lineWidth(1)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .stroke();

    // --- body ---
    if (notes.summary) {
      heading("Summary");

      doc
        .font("Helvetica")
        .fontSize(10.5)
        .fillColor(INK)
        .text(toWinAnsi(notes.summary), { width, align: "left", lineGap: 2 });
    }

    if (notes.keyPoints?.length) {
      heading("Key points");

      bullets(notes.keyPoints);
    }

    (notes.sections || []).forEach((section) => {
      heading(section.heading);

      bullets(section.points);
    });

    if (notes.terms?.length) {
      heading("Terms");

      doc.fontSize(10.5);

      notes.terms.forEach(({ term, definition }) => {
        doc
          .font("Helvetica-Bold")
          .fillColor(INK)
          .text(`${toWinAnsi(term)}  `, { continued: true })
          .font("Helvetica")
          .fillColor(INK)
          .text(toWinAnsi(definition), { width, lineGap: 1.5 });

        doc.moveDown(0.28);
      });
    }

    if (notes.takeaways?.length) {
      heading("Takeaways");

      bullets(notes.takeaways);
    }

    // --- page numbers ---
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);

      // The footer sits below the bottom margin. pdfkit treats that as
      // "does not fit" and helpfully adds a blank page, so drop the margin
      // for the duration of the write.
      const bottomMargin = doc.page.margins.bottom;

      doc.page.margins.bottom = 0;

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED)
        .text(
          `${i + 1} / ${range.count}`,
          doc.page.margins.left,
          doc.page.height - 40,
          { width, align: "center", lineBreak: false },
        );

      doc.page.margins.bottom = bottomMargin;
    }

    doc.end();
  });
}

module.exports = { notesToPdf, toWinAnsi };

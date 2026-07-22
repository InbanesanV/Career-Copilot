const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract plain text from an uploaded resume file.
 * Supports PDF and DOCX (detected by MIME type).
 *
 * @param {Buffer} buffer      - File buffer from multer (memStorage)
 * @param {string} mimetype    - MIME type reported by multer
 * @returns {Promise<string>}  - Extracted plain text
 */
async function parseResume(buffer, mimetype) {
  if (mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Old binary .doc format — mammoth cannot parse it reliably.
  // Return a clear, user-facing error rather than silently producing garbage.
  if (mimetype === "application/msword") {
    throw new Error(
      "Old .doc format is not supported. Please open your resume in Microsoft Word, " +
        'go to File → Save As, choose "Word Document (.docx)", and re-upload.'
    );
  }

  throw new Error(`Unsupported file type: ${mimetype}`);
}

module.exports = { parseResume };

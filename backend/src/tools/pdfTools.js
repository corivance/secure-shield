import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// pdf_text_extractor — pulls raw text from a PDF buffer (pdf-parse).
export const pdfTextExtractor = async (buffer) => {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return { text: data.text || '', pages: data.numpages || 0 };
  } catch (err) {
    // Degrade gracefully if pdf-parse is unavailable or the buffer is odd.
    return { text: '', pages: 0, error: err.message };
  }
}

// pdf_table_extractor — heuristically pulls table-like rows (premium plans,
// limits, sub-limits). A pragmatic line/columns heuristic rather than a heavy
// table-parsing dependency.
export const pdfTableExtractor = (text) => {
  const rows = [];
  for (const line of String(text || '').split(/\r?\n/)) {
    const cells = line.split(/\s{2,}|\t|\|/).map((c) => c.trim()).filter(Boolean);
    // Keep rows that look tabular and contain a number (a limit/amount).
    if (cells.length >= 2 && cells.some((c) => /[₹0-9]/.test(c))) {
      rows.push(cells);
    }
  }
  return { rows: rows.slice(0, 200) };
}

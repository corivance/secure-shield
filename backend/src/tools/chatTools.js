import { createRequire } from 'node:module';
import { resolveKey } from '../services/keyService.js';
import axios from 'axios';

const require = createRequire(import.meta.url);
const faq = require('../data/faq.json');

// faq_lookup — instant keyword search in faq.json (FREE, no LLM).
export const faqLookup = (question) => {
  const q = String(question || '').toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const item of faq) {
    const score = item.keywords.reduce((s, kw) => (q.includes(kw.toLowerCase()) ? s + kw.length : s), 0);
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }
  if (best && bestScore > 0) return { matched: true, question: best.question, answer: best.answer };
  return { matched: false };
}

// google_vision_ocr — OCR for uploaded medical documents/photos. Calls Google
// Vision when a key is configured; otherwise degrades cleanly.
export const googleVisionOcr = async (base64Image) => {
  const key = await resolveKey('GOOGLE_VISION_API_KEY');
  if (!key) return { text: '', degraded: true };
  try {
    const { data } = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${key}`,
      {
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
          },
        ],
      },
      { timeout: 20000 }
    );
    const text = data?.responses?.[0]?.fullTextAnnotation?.text || '';
    return { text, degraded: false };
  } catch (err) {
    return { text: '', degraded: true, error: err.message };
  }
}

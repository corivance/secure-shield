// Agent 5 — Medical Chat Assistant. 3-tier resolution: faq → LLM → OCR.
import { faqLookup, googleVisionOcr } from '../tools/chatTools.js';
import { complete } from '../services/llmService.js';
import { sanitizeForLlm } from '../utils/sanitize.js';

export const runChatAgent = async ({ question, imageBase64, audit, userId }) => {
  // Tier 1: FAQ (free, no LLM).
  let started = Date.now();
  const faq = faqLookup(question);
  await audit.log({ agent: 'ChatAgent', tool: 'faq_lookup', input: question, output: { matched: faq.matched }, startedAt: started });
  if (faq.matched) {
    return { answer: faq.answer, source: 'faq', model: '' };
  }

  // Tier 3 (if image present): OCR the document, then answer about it.
  let ocrText = '';
  if (imageBase64) {
    started = Date.now();
    const ocr = await googleVisionOcr(imageBase64);
    ocrText = ocr.text;
    await audit.log({ agent: 'ChatAgent', tool: 'google_vision_ocr', input: 'image', output: { chars: ocrText.length, degraded: ocr.degraded }, startedAt: started });
  }

  // Tier 2: LLM fallback (multi-provider).
  const system = 'You are SecureShield, a helpful assistant for Indian health-insurance policy and medical questions. Be concise, accurate, and neutral.';
  const prompt = ocrText
    ? `The user uploaded a document. OCR text:\n"""${sanitizeForLlm(ocrText)}"""\n\nQuestion: ${sanitizeForLlm(question)}`
    : sanitizeForLlm(question);

  started = Date.now();
  const { text, degraded, model, provider } = await complete({ prompt, system, temperature: 0.3, userId });
  await audit.log({ agent: 'ChatAgent', tool: 'llm_fallback', input: 'question', output: { provider, model, degraded }, startedAt: started });

  if (degraded || !text) {
    return {
      answer: "I couldn't find this in our FAQ, and the AI assistant is not available right now. Please try rephrasing, or check the How It Works page for guidance.",
      source: 'faq',
      model: '',
    };
  }
  return { answer: text, source: ocrText ? 'ocr' : 'llm', model: `${provider}:${model}` };
}

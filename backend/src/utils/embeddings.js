// Lightweight deterministic embeddings for in-app semantic search. MongoDB has
// no pgvector, and CLAUDE.MD mandates Mongo — so we hash tokens into a fixed
// vector and rank by cosine similarity. Good enough for precedent retrieval over
// a small, curated corpus; swap for a real embedding API by populating
// Precedent.embedding at seed time.
const DIM = 128;

const tokenize = (text) => {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

const hashToken = (token) => {
  let h = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % DIM;
}

export const embed = (text) => {
  const vec = new Array(DIM).fill(0);
  for (const tok of tokenize(text)) vec[hashToken(tok)] += 1;
  // L2 normalize.
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

export const cosine = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += a[i] * b[i];
  return dot;
}

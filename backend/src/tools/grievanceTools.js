import { precedentRepository } from '../repositories/precedentRepository.js';
import { embed, cosine } from '../utils/embeddings.js';
import { complete } from '../services/llmService.js';
import { regulationService } from '../services/regulationService.js';

// search_irdai_precedents — semantic search over the rulings corpus (in-app
// cosine similarity over hashed embeddings; see utils/embeddings.js).
export const searchIrdaiPrecedents = async (query, topK = 5) => {
  const all = await precedentRepository.all();
  const qVec = embed(query);
  const scored = all
    .map((p) => {
      const vec = p.embedding?.length ? p.embedding : embed(`${p.summary} ${p.holding} ${p.tags.join(' ')}`);
      return { precedent: p, score: cosine(qVec, vec) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map(({ precedent, score }) => ({
    citation: precedent.citation,
    forum: precedent.forum,
    year: precedent.year,
    summary: precedent.summary,
    holding: precedent.holding,
    relevance: Math.round(score * 1000) / 1000,
  }));
}

// draft_grievance_letter — LLM drafts a formal letter; deterministic template
// fallback when no LLM key is configured.
export const draftGrievanceLetter = async ({ user, policy, check, precedents }) => {
  const regs = regulationService
    .all()
    .slice(0, 3)
    .map((r) => `${r.title}${r.ref ? ` (${r.ref})` : ''}`)
    .join('; ');
  const cites = (precedents || []).map((p) => `${p.citation}: ${p.holding}`).join('\n');

  const system =
    'You draft formal, respectful insurance grievance letters for Indian policyholders. Cite IRDAI regulations and precedents precisely. Keep it professional and persuasive.';
  const prompt = `Draft a grievance letter for ${user.fullName} disputing the claim verdict "${check.verdict}" on policy ${policy.planName} (${policy.insurer}).
Claimed: ₹${check.claimedAmount}. Eligible determined: ₹${check.eligibleAmount}.
Relevant IRDAI regulations: ${regs}.
Supporting precedents:\n${cites}\n
Write the full letter addressed to the insurer's grievance officer.`;

  const { text, degraded } = await complete({ prompt, system, temperature: 0.35, userId: user?._id?.toString?.() });
  if (!degraded && text) return { letter: text, degraded: false };

  // Deterministic fallback letter.
  const letter = `To,
The Grievance Redressal Officer,
${policy.insurer}

Subject: Grievance regarding claim under policy "${policy.planName}"

Respected Sir/Madam,

I, ${user.fullName}, am writing to formally dispute the assessment of my recent claim, which was marked "${check.verdict.toUpperCase()}" with an eligible amount of ₹${check.eligibleAmount} against a claimed amount of ₹${check.claimedAmount}.

I respectfully submit that this assessment is inconsistent with the following IRDAI regulations: ${regs}.

The following precedents support my position:
${cites || '- (See attached report)'}

I request a reconsideration of my claim in light of the above. Should this grievance remain unresolved, I reserve the right to approach the Insurance Ombudsman and the IRDAI Bima Bharosa portal.

Yours faithfully,
${user.fullName}`;
  return { letter, degraded: true };
}

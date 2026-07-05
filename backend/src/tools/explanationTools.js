import { complete } from '../services/llmService.js';
import { analyzeWhatIf } from '../engine/whatIf.js';

// clause_explainer — explain each triggered rule in plain language. Uses the LLM
// when available, with a deterministic template fallback (degraded mode).
export const clauseExplainer = async ({ verdict, breakdown, policy, caseInput, userId }) => {
  const triggered = (breakdown || []).filter((b) => b.triggered);
  const facts = triggered
    .map((b) => `- ${b.label || b.phase}: ${b.message}${b.clauseRef ? ` (clause ${b.clauseRef})` : ''}`)
    .join('\n');

  const system =
    'You are an insurance claims explainer for Indian health policies. Explain clearly and neutrally in plain English. Do NOT perform or change any calculations — the numbers are already final.';
  const prompt = `Policy: ${policy.planName} (${policy.insurer}).
Verdict: ${verdict.toUpperCase()}.
Triggered rules:\n${facts || '- None'}\n
Write a short, friendly explanation (3-5 sentences) of why the claim got this verdict, referencing the rules above.`;

  const { text, degraded, model, provider } = await complete({ prompt, system, temperature: 0.3, userId });
  if (!degraded && text) return { explanation: text, source: `${provider}:${model}`, degraded: false };

  // Deterministic fallback.
  const intro = {
    approved: 'Your claim is fully approved.',
    partial: 'Your claim is partially approved — some amounts were capped or deducted.',
    denied: 'Unfortunately, your claim was denied.',
  }[verdict];
  const body = triggered.length
    ? ` The following policy rules applied:\n${facts}`
    : ' No deductions or exclusions were triggered.';
  return { explanation: `${intro}${body}`, source: 'deterministic', degraded: true };
}

// savings_calculator — total of all avoidable shortfalls in the breakdown.
export const savingsCalculator = (breakdown = []) => {
  const avoidable = breakdown
    .filter((b) => b.triggered && (b.phase === 'room_rent' || b.phase === 'sub_limits'))
    .reduce((sum, b) => sum + (b.shortfall || 0), 0);
  return { potentialSavings: Math.round(avoidable * 100) / 100 };
}

// what_if_analyzer — re-run the engine with modified parameters.
export const whatIfAnalyzer = (args) => {
  return analyzeWhatIf(args);
}

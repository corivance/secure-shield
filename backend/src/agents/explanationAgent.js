// Agent 3 — Explanation Agent. Turns the engine output into plain language +
// savings suggestions. Never touches the money math (already final).
import { clauseExplainer, savingsCalculator, whatIfAnalyzer } from '../tools/explanationTools.js';

export const runExplanationAgent = async ({ policy, caseInput, enriched, decision, audit, userId }) => {
  let started = Date.now();
  const { explanation, source } = await clauseExplainer({ verdict: decision.verdict, breakdown: decision.breakdown, policy, caseInput, userId });
  await audit.log({ agent: 'ExplanationAgent', tool: 'clause_explainer', input: { verdict: decision.verdict }, output: { source }, startedAt: started });

  started = Date.now();
  const savings = savingsCalculator(decision.breakdown);
  await audit.log({ agent: 'ExplanationAgent', tool: 'savings_calculator', input: 'breakdown', output: savings, startedAt: started });

  started = Date.now();
  const whatIf = whatIfAnalyzer({ policy, caseInput, enriched, base: decision });
  await audit.log({ agent: 'ExplanationAgent', tool: 'what_if_analyzer', input: 'base decision', output: { maxSavings: whatIf.maxSavings }, startedAt: started });

  return { explanation, savings: { ...savings, ...whatIf } };
}

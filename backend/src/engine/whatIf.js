import { runDecisionEngine } from './decisionEngine.js';

// Re-run the engine with modified parameters to surface maximum savings.
// Pure deterministic exploration — no LLM.
export const analyzeWhatIf = ({ policy, caseInput, enriched, base }) => {
  const scenarios = [];

  // Scenario A: downgrade room to meet the cap exactly.
  const roomRule = (policy.rules || []).find((r) => r.type === 'room_rent');
  if (roomRule && Number(caseInput.roomCostPerDay) > 0) {
    let capPerDay;
    if (roomRule.params?.percentOfSumInsured != null) {
      capPerDay = (roomRule.params.percentOfSumInsured / 100) * Number(policy.sumInsured || 0);
    } else {
      capPerDay = Number(roomRule.params?.absolutePerDay || 0);
    }
    if (capPerDay && Number(caseInput.roomCostPerDay) > capPerDay) {
      const altInput = { ...caseInput, roomCostPerDay: Math.floor(capPerDay) };
      const alt = runDecisionEngine({ policy, caseInput: altInput, enriched });
      scenarios.push({
        title: 'Choose a room within the rent cap',
        change: `Pick a room at ₹${Math.floor(capPerDay)}/day instead of ₹${caseInput.roomCostPerDay}/day`,
        newEligible: alt.eligibleAmount,
        extraSavings: Math.max(0, alt.eligibleAmount - base.eligibleAmount),
      });
    }
  }

  const best = scenarios.reduce(
    (acc, s) => (s.extraSavings > acc.extraSavings ? s : acc),
    { extraSavings: 0 }
  );

  return {
    scenarios,
    maxSavings: best.extraSavings || 0,
    recommendation: best.change || 'No additional savings opportunities found for this case.',
  };
}

// Agent 2 — Case Agent. Enriches raw case input before the deterministic engine.
import { medicalTermNormalizer, icdProcedureLookup, cityTierClassifier, hospitalCostEstimator } from '../tools/caseTools.js';

export const runCaseAgent = async ({ caseInput, audit }) => {
  let started = Date.now();
  const norm = medicalTermNormalizer(caseInput.procedure);
  await audit.log({ agent: 'CaseAgent', tool: 'medical_term_normalizer', input: caseInput.procedure, output: norm, startedAt: started });

  started = Date.now();
  const icd = icdProcedureLookup(norm.normalized);
  await audit.log({ agent: 'CaseAgent', tool: 'icd_procedure_lookup', input: norm.normalized, output: icd, startedAt: started });

  started = Date.now();
  const tier = cityTierClassifier(caseInput.city);
  await audit.log({ agent: 'CaseAgent', tool: 'city_tier_classifier', input: caseInput.city, output: tier, startedAt: started });

  started = Date.now();
  const costBenchmark = hospitalCostEstimator({ procedureCost: caseInput.procedureCost, category: icd.category, tier: tier.tier });
  await audit.log({ agent: 'CaseAgent', tool: 'hospital_cost_estimator', input: { cost: caseInput.procedureCost, category: icd.category, tier: tier.tier }, output: costBenchmark, startedAt: started });

  return {
    procedureNormalized: norm.normalized,
    icdCode: icd.code,
    procedureCategory: icd.category,
    waitingMonthsRequired: icd.waitingMonths,
    cityTier: tier.tier,
    cityTierLabel: tier.label,
    costBenchmark,
  };
}

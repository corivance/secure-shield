import { icdCodes, medicalAbbreviations } from '../data/icdCodes.js';
import { classifyCity, tierCostMultiplier } from '../data/cityTiers.js';

// medical_term_normalizer — expand abbreviations (CABG → Coronary Artery Bypass Graft).
export const medicalTermNormalizer = (term) => {
  const raw = String(term || '').trim();
  const lower = raw.toLowerCase();
  if (medicalAbbreviations[lower]) {
    return { input: raw, normalized: medicalAbbreviations[lower], expanded: true };
  }
  // Expand any embedded abbreviations word-by-word.
  const normalized = raw
    .split(/\s+/)
    .map((w) => medicalAbbreviations[w.toLowerCase()] || w)
    .join(' ');
  return { input: raw, normalized: normalized || raw, expanded: normalized.toLowerCase() !== lower };
}

// icd_procedure_lookup — map a procedure to its ICD-10-PCS code + waiting months.
export const icdProcedureLookup = (procedure) => {
  const p = String(procedure || '').toLowerCase();
  let match = icdCodes.find((c) => p.includes(c.procedure));
  if (!match) match = icdCodes.find((c) => c.procedure.split(' ').some((w) => p.includes(w) && w.length > 4));
  if (!match) return { procedure, code: null, category: 'unknown', waitingMonths: 0 };
  return { procedure, code: match.code, category: match.category, waitingMonths: match.waitingMonths };
}

// city_tier_classifier — IRDAI Tier 1/2/3.
export const cityTierClassifier = (city) => {
  return classifyCity(city);
}

// hospital_cost_estimator — benchmark a claimed cost against regional rates.
export const hospitalCostEstimator = ({ procedureCost, category, tier }) => {
  const cost = Number(procedureCost || 0);
  // Crude category benchmarks (₹) at Tier 1; scaled down for lower tiers.
  const baseByCategory = {
    cardiac: 250000,
    orthopedic: 200000,
    ophthalmology: 45000,
    'general surgery': 90000,
    oncology: 180000,
    maternity: 75000,
    nephrology: 30000,
    default: 100000,
  };
  const base = (baseByCategory[category] || baseByCategory.default) * (tierCostMultiplier[tier] || 0.65);
  const ratio = base > 0 ? cost / base : 1;
  let assessment = 'within market range';
  if (ratio > 1.4) assessment = 'above market range';
  else if (ratio < 0.6) assessment = 'below market range';
  return { claimed: cost, benchmark: Math.round(base), ratio: Math.round(ratio * 100) / 100, assessment };
}

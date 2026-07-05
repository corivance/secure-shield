import { regulationService } from '../services/regulationService.js';

// irdai_regulation_lookup — cross-reference a rule type (or free text) against
// the (DB-backed, admin-editable) IRDAI regulation knowledge base.
export const irdaiRegulationLookup = ({ ruleType, text } = {}) => {
  if (ruleType) return regulationService.lookup(ruleType);
  if (text) return regulationService.search(text);
  return [];
}

// rule_validator — validate the extracted rule set and FREEZE it (mark immutable
// shape). Returns { valid, rules, issues }. Pure, deterministic.
const VALID_TYPES = ['room_rent', 'sub_limit', 'waiting_period', 'co_pay', 'deductible', 'exclusion'];

export const ruleValidator = (rules = []) => {
  const issues = [];
  const cleaned = [];
  for (const [i, rule] of rules.entries()) {
    if (!VALID_TYPES.includes(rule.type)) {
      issues.push(`rule[${i}] has invalid type "${rule.type}"`);
      continue;
    }
    if (!rule.label) issues.push(`rule[${i}] missing label`);
    // Type-specific shape checks.
    if (rule.type === 'room_rent' && rule.params?.percentOfSumInsured == null && rule.params?.absolutePerDay == null) {
      issues.push(`rule[${i}] room_rent needs percentOfSumInsured or absolutePerDay`);
    }
    if (rule.type === 'sub_limit' && rule.params?.cap == null) {
      issues.push(`rule[${i}] sub_limit needs a cap`);
    }
    // Skip zero-value rules that have no effect on claims.
    if (rule.type === 'co_pay' && Number(rule.params?.percent || 0) === 0) continue;
    if (rule.type === 'deductible' && Number(rule.params?.amount || 0) === 0) continue;
    cleaned.push({
      type: rule.type,
      label: rule.label || rule.type,
      params: rule.params || {},
      clauseRef: rule.clauseRef || '',
    });
  }
  return { valid: issues.length === 0, rules: cleaned, issues };
}

const RULE_TYPES = ['room_rent', 'sub_limit', 'waiting_period', 'co_pay', 'deductible', 'exclusion'];

const rulesByType = (policy, type) => {
  return (policy.rules || []).filter((r) => r.type === type);
};

const formatRoomRent = (rule) => {
  const p = rule.params || {};
  if (p.percentOfSumInsured != null) return `${p.percentOfSumInsured}% of sum insured / day`;
  if (p.absolutePerDay != null) return `₹${p.absolutePerDay.toLocaleString('en-IN')} / day`;
  return '—';
};

const formatSubLimit = (rule) => {
  const p = rule.params || {};
  return `₹${(p.cap || 0).toLocaleString('en-IN')} on ${p.procedure || rule.label}`;
};

const formatWaitingPeriod = (rule) => {
  const p = rule.params || {};
  return `${p.months || 0} months for ${p.procedure || rule.label}`;
};

const formatCoPay = (rule) => {
  const p = rule.params || {};
  return `${p.percent || 0}%`;
};

const formatDeductible = (rule) => {
  const p = rule.params || {};
  return `₹${(p.amount || 0).toLocaleString('en-IN')}`;
};

const formatExclusion = (rule) => {
  const p = rule.params || {};
  return p.match || rule.label;
};

const formatters = {
  room_rent: formatRoomRent,
  sub_limit: formatSubLimit,
  waiting_period: formatWaitingPeriod,
  co_pay: formatCoPay,
  deductible: formatDeductible,
  exclusion: formatExclusion,
};

export const buildRuleMatrix = (policies) => {
  const matrix = RULE_TYPES.map((type) => {
    const row = { type, policies: policies.map((p) => {
      const rules = rulesByType(p, type);
      const formatter = formatters[type];
      return {
        count: rules.length,
        values: rules.map((r) => formatter(r)),
        ruleRef: rules,
      };
    })};
    return row;
  });
  return matrix;
};

const scorePolicy = (policy) => {
  let score = 0;
  const notes = [];

  // Sum insured — higher is better.
  const si = policy.sumInsured || 0;
  if (si > 0) {
    score += Math.min(si / 100000, 10);
    notes.push(`Sum insured: ₹${si.toLocaleString('en-IN')}`);
  }

  // Room rent — lower % or no cap is better.
  const roomRules = rulesByType(policy, 'room_rent');
  if (roomRules.length === 0) {
    score += 5;
    notes.push('No room rent cap');
  } else {
    const r = roomRules[0];
    const pct = r.params?.percentOfSumInsured || 0;
    if (pct > 0 && pct <= 1) { score += 4; notes.push(`Room rent: ${pct}% of SI — generous`); }
    else if (pct > 1 && pct <= 2) { score += 3; notes.push(`Room rent: ${pct}% of SI — moderate`); }
    else if (pct > 2) { score += 1; notes.push(`Room rent: ${pct}% of SI — restrictive`); }
    else if (r.params?.absolutePerDay) {
      const amt = r.params.absolutePerDay;
      if (amt >= 10000) { score += 4; notes.push(`Room rent: ₹${amt}/day — generous`); }
      else if (amt >= 5000) { score += 3; notes.push(`Room rent: ₹${amt}/day — moderate`); }
      else { score += 1; notes.push(`Room rent: ₹${amt}/day — low cap`); }
    }
  }

  // Co-pay — lower is better.
  const coPayRules = rulesByType(policy, 'co_pay');
  if (coPayRules.length === 0) {
    score += 4;
    notes.push('No co-payment');
  } else {
    const pct = coPayRules[0].params?.percent || 0;
    if (pct <= 10) { score += 3; notes.push(`Co-pay: ${pct}%`); }
    else if (pct <= 20) { score += 2; notes.push(`Co-pay: ${pct}%`); }
    else { score += 0; notes.push(`Co-pay: ${pct}% — high`); }
  }

  // Deductible — lower is better.
  const dedRules = rulesByType(policy, 'deductible');
  if (dedRules.length === 0) {
    score += 3;
    notes.push('No deductible');
  } else {
    const amt = dedRules[0].params?.amount || 0;
    if (amt === 0) { score += 3; }
    else if (amt <= 5000) { score += 2; notes.push(`Deductible: ₹${amt.toLocaleString('en-IN')}`); }
    else { score += 0; notes.push(`Deductible: ₹${amt.toLocaleString('en-IN')} — high`); }
  }

  // Sub-limits — fewer is better.
  const subLimitRules = rulesByType(policy, 'sub_limit');
  if (subLimitRules.length === 0) {
    score += 3;
    notes.push('No sub-limits');
  } else if (subLimitRules.length <= 3) {
    score += 2;
    notes.push(`${subLimitRules.length} sub-limits`);
  } else {
    score += 0;
    notes.push(`${subLimitRules.length} sub-limits — many restrictions`);
  }

  // Waiting periods — shorter is better.
  const waitRules = rulesByType(policy, 'waiting_period');
  if (waitRules.length === 0) {
    score += 3;
    notes.push('No specific waiting periods');
  } else {
    const maxMonths = Math.max(...waitRules.map((r) => r.params?.months || 0));
    if (maxMonths <= 12) { score += 3; notes.push(`Max waiting: ${maxMonths} months`); }
    else if (maxMonths <= 24) { score += 2; notes.push(`Max waiting: ${maxMonths} months`); }
    else { score += 1; notes.push(`Max waiting: ${maxMonths} months — long`); }
  }

  // Exclusions — fewer is better.
  const exclRules = rulesByType(policy, 'exclusion');
  if (exclRules.length <= 3) {
    score += 2;
    notes.push(`${exclRules.length} exclusion(s)`);
  } else {
    score += 0;
    notes.push(`${exclRules.length} exclusions — many`);
  }

  return { score, notes };
};

export const generateRecommendation = (policies) => {
  if (policies.length < 2) return '';

  const scored = policies.map((p) => ({ policy: p, ...scorePolicy(p) }));
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const runner = scored[1];
  const diff = best.score - runner.score;

  const parts = [`Based on the extracted rules, <strong>${best.policy.planName}</strong> scores highest.`];
  if (diff > 5) parts.push('The lead is significant.');
  else if (diff > 2) parts.push('The difference is moderate — your choice may depend on specific needs.');
  else parts.push('The policies are closely matched — consider which sub-limits and waiting periods matter most to you.');

  if (best.notes.length) parts.push(`Strengths: ${best.notes.slice(0, 3).join('; ')}.`);

  return parts.join(' ');
};

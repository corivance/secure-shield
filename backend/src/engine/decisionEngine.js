// ─────────────────────────────────────────────────────────────────────────────
//  The "Symbolic Shield" — a deterministic, zero-LLM decision engine.
//
//  The AI agents extract parameters (rules, ICD codes, city tier, costs), but the
//  VERDICT and all MONEY MATH happen here in pure code. Same inputs → same output,
//  always. No hallucination is possible because no LLM touches the arithmetic.
//
//  6 phases, applied in order:
//    1. Exclusions      → hard deny if procedure excluded
//    2. Room rent       → per-day cap, proportionate-safe shortfall
//    3. Sub-limits      → procedure-specific cap
//    4. Waiting periods → deny if policy age < required waiting
//    5. Deductibles     → subtract policy deductible
//    6. Co-pays         → apply policy co-payment (+ a conservative senior-citizen estimate)
// ─────────────────────────────────────────────────────────────────────────────

const round = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const clampMoney = (n) => Math.max(0, round(n));

const rulesOf = (policy, type) => {
  return (policy.rules || []).filter((r) => r.type === type);
}

// ── Phase 1: Exclusions ──────────────────────────────────────────────────────
const phaseExclusions = (ctx) => {
  const procedure = String(ctx.enriched.procedureNormalized || ctx.caseInput.procedure || '').toLowerCase();
  for (const rule of rulesOf(ctx.policy, 'exclusion')) {
    const term = String(rule.params?.match || rule.label || '').toLowerCase();
    if (term && procedure.includes(term)) {
      return {
        phase: 'exclusions',
        triggered: true,
        hardDeny: true,
        clauseRef: rule.clauseRef,
        label: rule.label,
        message: `Procedure "${ctx.caseInput.procedure}" is excluded under "${rule.label}".`,
      };
    }
  }
  return { phase: 'exclusions', triggered: false };
}

// ── Phase 2: Room rent ───────────────────────────────────────────────────────
const phaseRoomRent = (ctx) => {
  const rule = rulesOf(ctx.policy, 'room_rent')[0];
  const roomCost = Number(ctx.caseInput.roomCostPerDay || 0);
  const days = Number(ctx.caseInput.stayDays || 0);
  if (!rule || !roomCost || !days) return { phase: 'room_rent', triggered: false };

  // Cap may be % of sum insured, or an absolute ₹/day, possibly tier-scaled.
  let capPerDay;
  if (rule.params?.percentOfSumInsured != null) {
    capPerDay = (Number(rule.params.percentOfSumInsured) / 100) * Number(ctx.policy.sumInsured || 0);
  } else {
    capPerDay = Number(rule.params?.absolutePerDay || 0);
  }
  // Tier 1 cities may allow a higher cap if the rule says so.
  if (rule.params?.tierMultiplier && ctx.enriched.cityTier) {
    capPerDay *= Number(rule.params.tierMultiplier[ctx.enriched.cityTier] || 1);
  }

  const claimedRoom = roomCost * days;
  const allowedRoom = Math.min(roomCost, capPerDay) * days;
  const shortfall = clampMoney(claimedRoom - allowedRoom);

  return {
    phase: 'room_rent',
    triggered: shortfall > 0,
    clauseRef: rule.clauseRef,
    label: rule.label,
    capPerDay: round(capPerDay),
    claimed: round(claimedRoom),
    allowed: round(allowedRoom),
    shortfall,
    message: shortfall > 0
      ? `Room cost ₹${roomCost}/day exceeds the cap of ₹${round(capPerDay)}/day — ₹${shortfall} deducted over ${days} day(s).`
      : `Room cost within the ₹${round(capPerDay)}/day cap.`,
  };
}

// ── Phase 3: Sub-limits ──────────────────────────────────────────────────────
const phaseSubLimits = (ctx) => {
  const procedure = String(ctx.enriched.procedureNormalized || ctx.caseInput.procedure || '').toLowerCase();
  const procedureCost = Number(ctx.caseInput.procedureCost || 0);
  for (const rule of rulesOf(ctx.policy, 'sub_limit')) {
    const term = String(rule.params?.procedure || rule.label || '').toLowerCase();
    if (term && procedure.includes(term)) {
      const cap = Number(rule.params?.cap || 0);
      const base = procedureCost || cap;
      const shortfall = clampMoney(base - cap);
      return {
        phase: 'sub_limits',
        triggered: shortfall > 0,
        clauseRef: rule.clauseRef,
        label: rule.label,
        cap,
        claimed: round(base),
        allowed: round(Math.min(base, cap)),
        shortfall,
        message: shortfall > 0
          ? `Sub-limit of ₹${cap} applies to ${rule.label}; ₹${shortfall} above the cap is not payable.`
          : `Within the ₹${cap} sub-limit for ${rule.label}.`,
      };
    }
  }
  return { phase: 'sub_limits', triggered: false };
}

// ── Phase 4: Waiting periods ─────────────────────────────────────────────────
const phaseWaitingPeriods = (ctx) => {
  const requiredMonths = Number(ctx.enriched.waitingMonthsRequired || 0);
  const policyAgeMonths = Number(ctx.caseInput.policyAgeMonths ?? 999); // assume seasoned if unknown
  if (!requiredMonths) return { phase: 'waiting_periods', triggered: false };

  // IRDAI moratorium (Master Circular 2024): after 60 continuous months of
  // coverage no claim is contestable except for established fraud — this
  // overrides any waiting-period denial.
  if (policyAgeMonths >= 60) {
    return {
      phase: 'waiting_periods',
      triggered: false,
      moratorium: true,
      message: 'Beyond the IRDAI 5-year (60-month) moratorium — waiting-period denial not permitted.',
    };
  }

  const rule = rulesOf(ctx.policy, 'waiting_period').find((r) => {
    const term = String(r.params?.procedure || '').toLowerCase();
    return term && String(ctx.enriched.procedureNormalized || '').toLowerCase().includes(term);
  });
  // IRDAI caps PED and specific-disease/procedure waiting periods at 36 months;
  // any longer policy waiting period is not enforceable.
  const ruleMonths = Math.min(36, Number(rule?.params?.months || requiredMonths));

  if (policyAgeMonths < ruleMonths) {
    return {
      phase: 'waiting_periods',
      triggered: true,
      hardDeny: true,
      clauseRef: rule?.clauseRef || '',
      label: rule?.label || 'Procedure waiting period',
      requiredMonths: ruleMonths,
      policyAgeMonths,
      message: `Policy age ${policyAgeMonths} month(s) is below the ${ruleMonths}-month waiting period for this procedure.`,
    };
  }
  return { phase: 'waiting_periods', triggered: false };
}

// ── Phase 5: Deductibles ─────────────────────────────────────────────────────
const phaseDeductible = (ctx, runningEligible) => {
  const rule = rulesOf(ctx.policy, 'deductible')[0];
  if (!rule) return { phase: 'deductible', triggered: false, deducted: 0 };
  const amount = Math.min(Number(rule.params?.amount || 0), runningEligible);
  return {
    phase: 'deductible',
    triggered: amount > 0,
    clauseRef: rule.clauseRef,
    label: rule.label,
    deducted: clampMoney(amount),
    message: amount > 0 ? `Policy deductible of ₹${clampMoney(amount)} subtracted.` : 'No deductible applies.',
  };
}

// ── Phase 6: Co-pays ─────────────────────────────────────────────────────────
const phaseCoPay = (ctx, runningEligible) => {
  let percent = 0;
  let label = 'Co-payment';
  let clauseRef = '';
  const rule = rulesOf(ctx.policy, 'co_pay')[0];
  if (rule) {
    percent = Number(rule.params?.percent || 0);
    label = rule.label;
    clauseRef = rule.clauseRef;
  }
  // IRDAI does NOT mandate a senior co-pay — co-payment is policy-specific and
  // must be disclosed in the schedule. When the policy specifies none, we apply
  // a conservative 20% senior-citizen estimate (common in senior plans) so the
  // payout isn't over-stated; the breakdown flags it as an estimate.
  const age = Number(ctx.caseInput.patientAge || 0);
  if (age >= 60) {
    percent = Math.max(percent, 20);
    label = `${label} (senior-citizen estimate; verify in policy)`;
  }
  const deducted = clampMoney((percent / 100) * runningEligible);
  return {
    phase: 'co_pay',
    triggered: deducted > 0,
    clauseRef,
    label,
    percent,
    deducted,
    message: deducted > 0 ? `Co-payment of ${percent}% (₹${deducted}) applies.` : 'No co-payment applies.',
  };
}

// ── Orchestrator ─────────────────────────────────────────────────────────────
export const runDecisionEngine = ({ policy, caseInput, enriched }) => {
  const ctx = { policy, caseInput, enriched: enriched || {} };
  const claimed = Number(caseInput.claimedAmount || 0);
  const breakdown = [];

  // Phase 1 — exclusions (hard deny)
  const excl = phaseExclusions(ctx);
  breakdown.push(excl);
  if (excl.hardDeny) {
    return finalize({ claimed, eligible: 0, verdict: 'denied', breakdown, reason: excl.message });
  }

  // Phase 4 — waiting periods (hard deny). Checked before money math.
  const wait = phaseWaitingPeriods(ctx);

  // Phase 2 — room rent
  const room = phaseRoomRent(ctx);
  breakdown.push(room);

  // Phase 3 — sub-limits
  const sub = phaseSubLimits(ctx);
  breakdown.push(sub);

  // Insert waiting-period result in declared order (after sub-limits surfacing).
  breakdown.push(wait);
  if (wait.hardDeny) {
    return finalize({ claimed, eligible: 0, verdict: 'denied', breakdown, reason: wait.message });
  }

  // Eligible starts from claimed minus capping shortfalls.
  let eligible = clampMoney(claimed - (room.shortfall || 0) - (sub.shortfall || 0));

  // Phase 5 — deductible
  const ded = phaseDeductible(ctx, eligible);
  breakdown.push(ded);
  eligible = clampMoney(eligible - (ded.deducted || 0));

  // Phase 6 — co-pay
  const cop = phaseCoPay(ctx, eligible);
  breakdown.push(cop);
  eligible = clampMoney(eligible - (cop.deducted || 0));

  let verdict = 'approved';
  if (eligible <= 0) verdict = 'denied';
  else if (eligible < claimed) verdict = 'partial';

  return finalize({ claimed, eligible, verdict, breakdown });
}

const finalize = ({ claimed, eligible, verdict, breakdown, reason }) => {
  const coveragePercent = claimed > 0 ? round((eligible / claimed) * 100) : 0;
  return {
    verdict,
    claimedAmount: round(claimed),
    eligibleAmount: round(eligible),
    coveragePercent,
    breakdown: breakdown.filter(Boolean),
    reason: reason || '',
  };
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runDecisionEngine } from '../src/engine/decisionEngine.js';

const policy = {
  planName: 'Test Gold',
  insurer: 'Star Health',
  sumInsured: 500000,
  rules: [
    { type: 'room_rent', label: 'Room rent cap', params: { percentOfSumInsured: 1 }, clauseRef: 'R1' },
    { type: 'sub_limit', label: 'Cataract sub-limit', params: { procedure: 'cataract', cap: 40000 }, clauseRef: 'S1' },
    { type: 'co_pay', label: 'Co-payment', params: { percent: 10 }, clauseRef: 'C1' },
    { type: 'deductible', label: 'Deductible', params: { amount: 5000 }, clauseRef: 'D1' },
    { type: 'exclusion', label: 'Cosmetic surgery excluded', params: { match: 'cosmetic' }, clauseRef: 'E1' },
  ],
};

test('hard-denies excluded procedures', () => {
  const res = runDecisionEngine({
    policy,
    caseInput: { procedure: 'cosmetic rhinoplasty', claimedAmount: 50000 },
    enriched: { procedureNormalized: 'cosmetic rhinoplasty' },
  });
  assert.equal(res.verdict, 'denied');
  assert.equal(res.eligibleAmount, 0);
});

test('applies room-rent cap, sub-limit, deductible and co-pay deterministically', () => {
  const res = runDecisionEngine({
    policy,
    caseInput: {
      procedure: 'cataract surgery',
      claimedAmount: 85000,
      roomCostPerDay: 8000, // cap is 1% of 5L = 5000/day
      stayDays: 2,
      procedureCost: 60000, // sub-limit 40000
      patientAge: 45,
    },
    enriched: { procedureNormalized: 'cataract surgery' },
  });
  // room shortfall = (8000-5000)*2 = 6000; sub shortfall = 60000-40000 = 20000
  // eligible = 85000 - 6000 - 20000 = 59000; - 5000 deductible = 54000; - 10% co-pay = 48600
  assert.equal(res.verdict, 'partial');
  assert.equal(res.eligibleAmount, 48600);
});

test('is reproducible — same input, same output', () => {
  const input = {
    policy,
    caseInput: { procedure: 'cataract surgery', claimedAmount: 50000, patientAge: 65 },
    enriched: { procedureNormalized: 'cataract surgery' },
  };
  const a = runDecisionEngine(input);
  const b = runDecisionEngine(input);
  assert.deepEqual(a, b);
});

test('age 60+ enforces a 20% co-pay floor', () => {
  const res = runDecisionEngine({
    policy,
    caseInput: { procedure: 'dialysis', claimedAmount: 10000, patientAge: 70 },
    enriched: { procedureNormalized: 'dialysis' },
  });
  // no room/sub; deductible 5000 → 5000; 20% co-pay → 4000
  assert.equal(res.eligibleAmount, 4000);
});

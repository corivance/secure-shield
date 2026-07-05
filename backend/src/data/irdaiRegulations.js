// IRDAI health-insurance provisions SecureShield reasons over. Sourced from the
// consolidated Master Circular on Health Insurance Business (2024) and the
// 2025–26 supplementary measures. See complianceFramework.js for the framework
// metadata and review date. `appliesTo` maps a provision to the deterministic
// engine's rule types; informational-only provisions use `category: 'info'`.
//
// `ref` is the authoritative citation (the IRDAI circular reference). `code` is
// an OPTIONAL internal label, intentionally left blank here — fill it with an
// exact clause number from the official PDF via Admin → Regulations if needed.
//
// NOTE: provision text is paraphrased for plain-language use, not verbatim legal
// wording. Verify against irdai.gov.in before relying on it.
const MASTER_CIRCULAR = 'IRDAI/HLT/CIR/MISC/77/05/2024';
// Direct link to the Master Circular PDF, so "Open circular" lands on the actual
// document rather than a generic landing page.
const IRDAI_SOURCE =
  'https://irdai.gov.in/documents/37343/365525/Master+Circular++on+Health++Insurance+Business++29052024.pdf/5e707a91-b5de-1ec1-cf18-b66273a6839d?t=1716962621002&version=1.0';

export const irdaiRegulations = [
  {
    ref: MASTER_CIRCULAR,
    title: 'Five-year (60-month) moratorium',
    text: 'After 60 continuous months of coverage (including portability/migration), no policy or claim shall be contestable on grounds of non-disclosure or misrepresentation, except on grounds of established fraud.',
    appliesTo: ['waiting_period', 'exclusion'],
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  {
    ref: MASTER_CIRCULAR,
    title: 'Pre-existing disease waiting period capped at 36 months',
    text: 'The waiting period for pre-existing diseases shall not exceed 36 months. After this period (or after the moratorium), PED-related claims cannot be denied on PED grounds.',
    appliesTo: ['waiting_period'],
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  {
    ref: MASTER_CIRCULAR,
    title: 'Specific disease/procedure waiting period capped at 36 months',
    text: 'Specified diseases and procedures may carry a waiting period not exceeding 36 months from policy commencement; insurers may not impose longer specific waiting periods.',
    appliesTo: ['waiting_period'],
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  {
    ref: MASTER_CIRCULAR,
    title: 'Room-rent / category limits and proportionate deduction',
    text: 'Where a room-rent or room-category limit applies, any proportionate deduction must be applied transparently and disclosed; deductions tied to room category must be clearly stated in the policy.',
    appliesTo: ['room_rent'],
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  {
    ref: MASTER_CIRCULAR,
    title: 'Sub-limits must be disclosed',
    text: 'Procedure or disease sub-limits, if any, shall be clearly enumerated in the policy; insurers shall not apply undisclosed sub-limits to reduce an otherwise admissible claim.',
    appliesTo: ['sub_limit'],
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  {
    ref: MASTER_CIRCULAR,
    title: 'Co-payment must be disclosed in the policy schedule',
    text: 'Any co-payment (including for senior citizens) must be explicitly stated in the policy schedule and applied uniformly. IRDAI does not mandate a fixed co-payment percentage; it is policy-specific.',
    appliesTo: ['co_pay'],
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  {
    ref: MASTER_CIRCULAR,
    title: 'Deductible application & disclosure',
    text: 'A policy-level deductible, where applicable, shall be disclosed in the policy schedule and applied consistently per the policy terms.',
    appliesTo: ['deductible'],
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  {
    ref: MASTER_CIRCULAR,
    title: 'Time-bound cashless authorisation',
    text: 'Insurers shall grant cashless authorisation within 1 hour of request and final authorisation at discharge within 3 hours; genuine emergencies shall not be denied cashless for want of pre-authorisation.',
    appliesTo: [],
    category: 'info',
    effective: '2024-07-31',
    source: IRDAI_SOURCE,
  },
  {
    ref: MASTER_CIRCULAR,
    title: 'Standardised exclusions',
    text: 'Exclusions are standardised; insurers cannot introduce additional, non-standard exclusions to deny otherwise admissible claims.',
    appliesTo: ['exclusion'],
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  // ── 2025–26 supplementary measures (informational) ──────────────────────────
  {
    ref: MASTER_CIRCULAR,
    title: 'No maximum entry age',
    text: 'Insurers may not set an upper age limit for buying a new health policy and must offer suitable products across age groups.',
    appliesTo: [],
    category: 'info',
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  {
    ref: MASTER_CIRCULAR,
    title: 'Senior-citizen premium-hike cap',
    text: 'For policyholders aged 60 and above, annual premium increases are limited (around 10% per year); larger increases require prior IRDAI consultation.',
    appliesTo: [],
    category: 'info',
    effective: '2024-04-01',
    source: IRDAI_SOURCE,
  },
  {
    ref: 'IRDAI Bima-ASBA (2025)',
    title: 'Bima-ASBA — funds blocked, not debited',
    text: 'Under Bima-ASBA, premium funds are blocked in the applicant’s bank account at proposal and debited only on acceptance; if the proposal is rejected the block is released.',
    appliesTo: [],
    category: 'info',
    effective: '2025-03-01',
    source: 'https://irdai.gov.in',
  },
  {
    ref: 'GST Council (Sep 2025)',
    title: 'GST exemption on retail health premiums',
    text: 'Individual/retail health insurance premiums are exempt from GST with effect from 22 September 2025 (previously taxed at 18%).',
    appliesTo: [],
    category: 'info',
    effective: '2025-09-22',
    source: 'https://irdai.gov.in',
  },
];

export const lookupRegulation = (ruleType) => irdaiRegulations.filter((r) => (r.appliesTo || []).includes(ruleType));

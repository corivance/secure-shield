// Single source of truth for the compliance label + disclaimer shown across the
// UI — mirrors backend/src/data/complianceFramework.js. Update both together (or
// read `compliance` from GET /system-info, which now returns this object).
export const COMPLIANCE = {
  label: 'IRDAI norms · Master Circular 2024',
  short: 'IRDAI-compliant',
  reviewed: 'Jun 2026',
  circularRef: 'IRDAI/HLT/CIR/MISC/77/05/2024',
  disclaimer:
    'SecureShield is a decision-support tool based on published IRDAI norms — not legal advice. ' +
    'Regulations change; always verify against your policy wording and the latest IRDAI circulars ' +
    'at irdai.gov.in before acting on a claim or grievance.',
};

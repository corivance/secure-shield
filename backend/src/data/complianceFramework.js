// ─────────────────────────────────────────────────────────────────────────────
//  Single source of truth for the regulatory framework SecureShield aligns to.
//  Update `lastReviewed` (and the provisions in irdaiRegulations.js) whenever
//  IRDAI issues new circulars — nothing about the framework is hardcoded in the
//  UI or engine; everything reads from here.
//
//  Operative framework: IRDAI's consolidated Master Circular on Health Insurance
//  Business (2024), as supplemented by 2025–26 measures (GST exemption on retail
//  health premiums, Bima-ASBA, removal of the maximum entry age, senior-citizen
//  premium-hike cap). NOT legal advice — decision support only.
// ─────────────────────────────────────────────────────────────────────────────
export const complianceFramework = {
  authority: 'Insurance Regulatory and Development Authority of India (IRDAI)',
  framework: 'Master Circular on Health Insurance Business',
  circularRef: 'IRDAI/HLT/CIR/MISC/77/05/2024',
  issued: '2024-05-29',
  // Operative circular year + the latest year whose changes are reflected here.
  baseYear: 2024,
  updatesThrough: 2026,
  // Bump this whenever the provisions are re-checked against IRDAI publications.
  lastReviewed: '2026-06-11',
  // Short + long labels for the UI (no year-frozen strings scattered in code).
  label: 'IRDAI norms · Master Circular 2024',
  labelLong: 'IRDAI Health Insurance norms — Master Circular 2024, reviewed Jun 2026',
  sources: [
    'https://irdai.gov.in/health-dept',
    'https://irdai.gov.in/rules', // consolidated regulations & circulars
  ],
  disclaimer:
    'SecureShield is a decision-support tool based on published IRDAI norms, not legal advice. ' +
    'Regulations change — always verify against your policy wording and the latest IRDAI ' +
    'circulars at irdai.gov.in before acting on a claim or grievance.',
};

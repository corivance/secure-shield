// Representative ICD-10-PCS-style mapping for icd_procedure_lookup. In production
// this would be the full 500+ procedure table; a focused subset ships here so the
// pipeline is fully exercisable offline.
export const icdCodes = [
  { procedure: 'cataract surgery', code: '08RJ3JZ', category: 'ophthalmology', waitingMonths: 24 },
  { procedure: 'coronary artery bypass graft', code: '021009W', category: 'cardiac', waitingMonths: 24 },
  { procedure: 'angioplasty', code: '02703DZ', category: 'cardiac', waitingMonths: 24 },
  { procedure: 'knee replacement', code: '0SRC0J9', category: 'orthopedic', waitingMonths: 24 },
  { procedure: 'hip replacement', code: '0SR90J9', category: 'orthopedic', waitingMonths: 24 },
  { procedure: 'hernia repair', code: '0YQ50ZZ', category: 'general surgery', waitingMonths: 24 },
  { procedure: 'appendectomy', code: '0DTJ4ZZ', category: 'general surgery', waitingMonths: 0 },
  { procedure: 'cholecystectomy', code: '0FT44ZZ', category: 'general surgery', waitingMonths: 24 },
  { procedure: 'cesarean section', code: '10D00Z0', category: 'maternity', waitingMonths: 9 },
  { procedure: 'dialysis', code: '5A1D00Z', category: 'nephrology', waitingMonths: 0 },
  { procedure: 'chemotherapy', code: '3E04305', category: 'oncology', waitingMonths: 0 },
  { procedure: 'tonsillectomy', code: '0CTP0ZZ', category: 'ent', waitingMonths: 24 },
  { procedure: 'hysterectomy', code: '0UT90ZZ', category: 'gynecology', waitingMonths: 24 },
  { procedure: 'gastric bypass', code: '0D160ZA', category: 'bariatric', waitingMonths: 36 },
  { procedure: 'spinal fusion', code: '0SG10A1', category: 'orthopedic', waitingMonths: 24 },
];

// Common abbreviation expansions for medical_term_normalizer.
export const medicalAbbreviations = {
  cabg: 'coronary artery bypass graft',
  ptca: 'angioplasty',
  tkr: 'knee replacement',
  thr: 'hip replacement',
  lscs: 'cesarean section',
  ckd: 'chronic kidney disease',
  htn: 'hypertension',
  dm: 'diabetes mellitus',
  mi: 'myocardial infarction',
  copd: 'chronic obstructive pulmonary disease',
};

// Agent 1 — Policy Agent (production-quality rule extraction pipeline).
// Reads Indian health-insurance policy PDFs and produces frozen, validated rule sets.
//
// Architecture: PDF → Text → Tables → Sections → Heuristic Extraction → AI Gap Detection → AI Extraction → Confidence → Validation → Deduplication → IRDAI Cross-Validation → Immutable Store.
//
// Public API preserved: runPolicyAgent({ buffer, audit, userId })

import { pdfTextExtractor, pdfTableExtractor } from '../tools/pdfTools.js';
import { irdaiRegulationLookup, ruleValidator } from '../tools/policyTools.js';
import { complete, completeBest } from '../services/llmService.js';
import { logger } from '../utils/logger.js';

// ═══════════════════════════════════════════════════════════════════════════════
// § 1. CONSTANTS & TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const RULE_TYPES = [
  'room_rent', 'sub_limit', 'waiting_period', 'co_pay', 'deductible', 'exclusion',
  'restoration', 'day_care', 'pre_post_hospital', 'ambulance', 'ayush', 'maternity',
  'no_claim_bonus', 'organ_donor', 'domiciliary', 'modern_treatments', 'icu_charges',
  'health_checkup', 'plan_identity', 'sum_insured', 'geographic_zoning', 'permanent_exclusion',
];

const VALID_TYPES = new Set(RULE_TYPES);

const SECTION_LABELS = {
  room_rent: 'Room Rent',
  room_eligibility: 'Room Eligibility',
  icu_charges: 'ICU Charges',
  sub_limits: 'Sub Limits',
  waiting_period: 'Waiting Period',
  ped_waiting: 'PED Waiting',
  initial_waiting: 'Initial Waiting',
  disease_waiting: 'Disease Waiting',
  co_pay: 'Co Pay',
  deductible: 'Deductible',
  restoration: 'Restoration Benefit',
  benefits_schedule: 'Benefits Schedule',
  day_care: 'Day Care',
  organ_donor: 'Organ Donor',
  domiciliary: 'Domiciliary',
  modern_treatments: 'Modern Treatments',
  pre_post_hospitalisation: 'Pre/Post Hospitalisation',
  ambulance: 'Ambulance',
  ayush: 'AYUSH',
  maternity: 'Maternity',
  cataract: 'Cataract',
  no_claim_bonus: 'No Claim Bonus',
  health_checkup: 'Health Checkup',
  wellness: 'Wellness',
  exclusions: 'Exclusions',
  hospitalisation: 'Hospitalisation',
  definitions: 'Definitions',
  disease_specific: 'Disease Specific Limits',
  plan_identity: 'Plan Identity',
  sum_insured: 'Sum Insured',
  geographic_zoning: 'Geographic Zoning',
  permanent_exclusions: 'Permanent Exclusions',
  zone: 'Zone',
  territory: 'Territory',
};

// Insurer name patterns for metadata extraction.
const INSURER_PATTERNS = [
  /aditya\s+birla\s+health/i,
  /star\s+health/i,
  /hdfc\s+ergo/i,
  /icici\s+lombard/i,
  /niacl/i,
  /new\s+india/i,
  /oriental/i,
  /national\s+insurance/i,
  /care\s+health/i,
  /max\s+bupa/i,
  /bajaj\s+allianz/i,
  /tata\s+aig/i,
  /reliance\s+general/i,
  /cholamandalam/i,
  /united\s+india/i,
  /export\s+credit/i,
  /iffco\s+tokio/i,
  /magma\s+hib/i,
  /future\s+generali/i,
  /appollo\s+munich/i,
  /manipal\s+cigna/i,
  /niva\s+bupa/i,
  /digit\s+health/i,
  /acko\s+health/i,
  /zurich\s+kotak/i,
  /edelweiss\s+health/i,
];

// ═══════════════════════════════════════════════════════════════════════════════
// § 2. REGEX PATTERN ARRAYS
// ═══════════════════════════════════════════════════════════════════════════════

const ROOM_RENT_PATTERNS = [
  { re: /room\s+rent[^.]*?(\d+(?:\.\d+)?)\s*%\s*(?:of\s+sum\s+insured)?(?:\s*per\s*day)?/gi, type: 'percent', min: 0.1, max: 100 },
  { re: /room\s+rent[^.]*?(?:rs\.?|₹)\s*([\d,]+)\s*(?:per\s*day|\/day|p\.?d\.?)/gi, type: 'absolute', min: 100, max: 100000 },
  { re: /(?:daily|per\s*day)\s+room[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, type: 'absolute', min: 100, max: 100000 },
  { re: /room\s+charges?[^.]*?(\d+(?:\.\d+)?)\s*%/gi, type: 'percent', min: 0.1, max: 100 },
  { re: /room\s+rent[^.]*?(?:capped?\s+(?:at|@)\s*)?(?:rs\.?|₹)\s*([\d,]+)/gi, type: 'absolute', min: 100, max: 100000 },
  { re: /room\s+rent\s+(?:shall\s+be|is|will\s+be)[^.]*?(\d+(?:\.\d+)?)\s*%/gi, type: 'percent', min: 0.1, max: 100 },
  { re: /single\s+private\s+room/gi, type: 'unrestricted', min: 0, max: 0 },
  { re: /room\s+rent[^.]*?(?:no|without)\s+(?:restriction|limit|capping)/gi, type: 'unrestricted', min: 0, max: 0 },
  { re: /room\s+rent[^.]*?100\s*%\s*(?:of\s+)?sum\s+insured/gi, type: 'unrestricted', min: 0, max: 0 },
];

const CO_PAY_PATTERNS = [
  { re: /co[\s-]?pay(?:ment)?[^.]*?(\d+(?:\.\d+)?)\s*%/gi },
  { re: /(\d+(?:\.\d+)?)\s*%\s*co[\s-]?pay/gi },
  { re: /co[\s-]?pay(?:ment)?[^.]*?(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:percent|%)/gi },
  { re: /age[\s-]?based\s+co[\s-]?pay[^.]*?(\d+(?:\.\d+)?)\s*%/gi },
  { re: /policyholder\s+pays?[^.]*?(\d+(?:\.\d+)?)\s*%/gi },
  { re: /copayment[^.]*?(\d+(?:\.\d+)?)\s*%/gi },
];

const DEDUCTIBLE_PATTERNS = [
  { re: /deductible[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi },
  { re: /excess[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi },
  { re: /(?:rs\.?|₹)\s*([\d,]+)\s*deductible/gi },
  { re: /deductible\s+(?:of\s+)?(?:rs\.?|₹)\s*([\d,]+)/gi },
  { re: /voluntary\s+deductible[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi },
];

const WAITING_PERIOD_PATTERNS = [
  { re: /initial\s+waiting\s+period[^.]*?(\d+)\s*months?/gi, label: 'Initial waiting period' },
  { re: /waiting\s+period[^.]*?(?:of\s+)?(\d+)\s*months?/gi, label: 'General waiting period' },
  { re: /pre[\s-]?existing\s+(?:disease|condition|illness)[^.]*?(\d+)\s*months?/gi, label: 'Pre-existing disease waiting period' },
  { re: /(\d+)\s*months?\s+(?:of\s+)?waiting\s+period/gi, label: 'Waiting period' },
  { re: /specific\s+disease[^.]*?(\d+)\s*months?/gi, label: 'Specific disease waiting period' },
  { re: /waiting\s+period\s*:\s*(\d+)\s*months?/gi, label: 'Waiting period' },
];

const EXCLUSION_PATTERNS = [
  { re: /([\w][\w\s]{3,35}?)\s+(?:is|are)\s+excluded/gi },
  { re: /exclusion[^:]*:\s*([\w][\w\s]{3,35})/gi },
  { re: /not\s+(?:covered|covered\s+under)[^.]*?([\w][\w\s]{3,35})/gi },
  { re: /(?:does\s+not|shall\s+not)\s+cover[^.]*?([\w][\w\s]{3,35})/gi },
  // Pattern for comma-separated exclusion lists
  { re: /exclusion[^:]*:\s*([\w][\w\s]{3,35})(?:\s*,\s*([\w][\w\s]{3,35}))+/gi, split: true },
];

const SUB_LIMIT_PATTERNS = [
  { fromTable: true },
  { re: /(?:sub[\s-]?limit|capping?)[^.]*?([\w][\w\s]{2,30})[^.]*?(?:rs\.?|₹|inr)\s*([\d,]+)/gi },
  { re: /([\w][\w\s]{2,30})[^.]*(?:sub[\s-]?limit|capping?)[^.]*(?:rs\.?|₹|inr)\s*([\d,]+)/gi },
  { re: /([\w][\w\s]{2,30})[^.]*?(?:rs\.?|₹|inr)\s*([\d,]+)\s*(?:sub[\s-]?limit|capping?)/gi },
  // Pattern for "up to INR X" or "up to ₹X"
  { re: /([\w][\w\s]{2,30})[^.]*?up\s+to\s+(?:inr|rs\.?|₹)\s*([\d,]+)/gi },
  { re: /([\w][\w\s]{2,30})[^.]*?capped?\s+(?:at|@)\s+(?:inr|rs\.?|₹)\s*([\d,]+)/gi },
];

const RESTORATION_PATTERNS = [
  { re: /restoration\s+(?:of\s+)?sum\s+insured[^.]*?(\d+)\s*%/gi, label: 'Restoration benefit' },
  { re: /(?:auto[\s-]?)?restoration[^.]*?(\d+)\s*%/gi, label: 'Auto restoration' },
  { re: /sum\s+insured\s+(?:is\s+)?restored[^.]*?(\d+)\s*%/gi, label: 'Sum insured restoration' },
  { re: /(?:unlimited|100\s*%)\s+restoration/gi, label: 'Unlimited restoration' },
  { re: /restoration[^.]*?(?:of\s+)?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Restoration amount' },
];

const DAY_CARE_PATTERNS = [
  { re: /day[\s-]?care\s+procedure[^.]*?(\d+)\s*(?:procedures?|treatments?)/gi, label: 'Day-care procedures count' },
  { re: /(\d+)\s+day[\s-]?care\s+procedure/gi, label: 'Day-care procedures count' },
  { re: /day[\s-]?care[^.]*?all\s+procedure/gi, label: 'All day-care procedures covered' },
  { re: /day[\s-]?care[^.]*?listed/gi, label: 'Listed day-care procedures' },
];

const PRE_POST_PATTERNS = [
  { re: /pre[\s-]?hospitalisation[^.]*?(\d+)\s*(?:days?|hours?)/gi, label: 'Pre-hospitalisation' },
  { re: /post[\s-]?hospitalisation[^.]*?(\d+)\s*(?:days?|hours?)/gi, label: 'Post-hospitalisation' },
  { re: /pre[\s-]?hospitalization[^.]*?(\d+)\s*(?:days?|hours?)/gi, label: 'Pre-hospitalization' },
  { re: /post[\s-]?hospitalization[^.]*?(\d+)\s*(?:days?|hours?)/gi, label: 'Post-hospitalization' },
  { re: /pre\s+and\s+post[^.]*?(\d+)\s*(?:days?|hours?)/gi, label: 'Pre & post hospitalisation' },
  { re: /(\d+)\s*(?:days?|hours?)\s+(?:before|after)\s+hospital/gi, label: 'Pre/post hospitalisation' },
];

const AMBULANCE_PATTERNS = [
  { re: /ambulance[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Ambulance charges' },
  { re: /ambulance[^.]*?(\d+)\s*%/gi, label: 'Ambulance coverage percent' },
  { re: /emergency\s+ambulance[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Emergency ambulance' },
  { re: /ambulance[^.]*?capped?\s+(?:at|@)\s*(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Ambulance cap' },
  { re: /ambulance[^.]*?up\s+to\s*(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Ambulance limit' },
];

const AYUSH_PATTERNS = [
  { re: /ayush[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'AYUSH coverage amount' },
  { re: /ayush[^.]*?(\d+)\s*%/gi, label: 'AYUSH coverage percent' },
  { re: /ayush[^.]*?covered/gi, label: 'AYUSH treatment covered' },
  { re: /ayush[^.]*?up\s+to\s*(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'AYUSH limit' },
  { re: /(?:ayurveda|homeopathy|unani|siddha)[^.]*?covered/gi, label: 'AYUSH treatment covered' },
];

const MATERNITY_PATTERNS = [
  { re: /maternity[^.]*?(?:rs\.?|₹)\s*([\d,]{3,})/gi, label: 'Maternity coverage' },
  { re: /maternity[^.]*?(\d+)\s*(?:days?|months?|years?)\s*(?:waiting|cooling)/gi, label: 'Maternity waiting period' },
  { re: /(?:childbirth|delivery)[^.]*?(?:rs\.?|₹)\s*([\d,]{3,})/gi, label: 'Childbirth coverage' },
  { re: /newborn[^.]*?(?:rs\.?|₹)\s*([\d,]{3,})/gi, label: 'Newborn coverage' },
  { re: /maternity[^.]*?capped?\s+(?:at|@)\s*(?:rs\.?|₹)\s*([\d,]{3,})/gi, label: 'Maternity cap' },
  { re: /maternity[^.]*?covered/gi, label: 'Maternity covered' },
];

const NO_CLAIM_BONUS_PATTERNS = [
  { re: /no[\s-]?claim\s+bonus[^.]*?(\d+)\s*%/gi, label: 'No-claim bonus' },
  { re: /cumulative\s+bonus[^.]*?(\d+)\s*%/gi, label: 'Cumulative bonus' },
  { re: /ncb[^.]*?(\d+)\s*%/gi, label: 'NCB' },
  { re: /bonus[^.]*?(?:up\s+to|maximum|max)[^.]*?(\d+)\s*%/gi, label: 'Max bonus' },
  { re: /(?:each|every)\s+(?:claim[\s-]?free|year)[^.]*?(\d+)\s*%/gi, label: 'Annual bonus' },
];

const ORGAN_DONOR_PATTERNS = [
  { re: /organ\s+donor[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Organ donor expenses' },
  { re: /donor\s+organ[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Donor organ expenses' },
  { re: /harvesting\s+of\s+organ[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Organ harvesting' },
  { re: /organ\s+donor[^.]*?(\d+)\s*%/gi, label: 'Organ donor coverage' },
];

const DOMICILIARY_PATTERNS = [
  { re: /domiciliary[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Domiciliary treatment amount' },
  { re: /domiciliary[^.]*?(\d+)\s*%/gi, label: 'Domiciliary treatment percent' },
  { re: /home\s+treatment[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Home treatment amount' },
  { re: /domiciliary[^.]*?capped?\s+(?:at|@)\s*(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Domiciliary cap' },
];

const MODERN_TREATMENTS_PATTERNS = [
  { re: /modern\s+treatment[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Modern treatment coverage' },
  { re: /stem[\s-]?cell[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Stem cell treatment' },
  { re: /targeted\s+therapy[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Targeted therapy' },
  { re: /immunotherapy[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Immunotherapy' },
  { re: /modern\s+treatment[^.]*?(\d+)\s*%/gi, label: 'Modern treatment percent' },
];

const ICU_PATTERNS = [
  { re: /icu[^.]*?(?:rs\.?|₹)\s*([\d,]+)\s*(?:per\s+day|\/day|p\.?d\.?)/gi, label: 'ICU charges per day' },
  { re: /icu[^.]*?(\d+)\s*%\s*(?:of\s+sum\s+insured)?/gi, label: 'ICU charges percent' },
  { re: /intensive\s+care[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Intensive care charges' },
  { re: /icu[^.]*?capped?\s+(?:at|@)\s*(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'ICU cap' },
];

const HEALTH_CHECKUP_PATTERNS = [
  { re: /health\s+check[\s-]?up[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Health checkup amount' },
  { re: /annual\s+health\s+check/gi, label: 'Annual health checkup' },
  { re: /preventive\s+health[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi, label: 'Preventive health benefit' },
  { re: /health\s+check[\s-]?up[^.]*?once\s+(?:in|per)\s+(?:year|annual)/gi, label: 'Annual health checkup' },
];

const EXCLUSION_NOISE = /^(the\s+following|the\s+following\s+conditions|the\s+following\s+items|expenses\s+listed\s+below|as\s+listed\s+below|any\s+of\s+the\s+following|means?\s+|when\s+|where\s+|under\s+|even\s+if|directly\s+from|secondary\s+to|current\s+diagnosis|treatment|nach|by\s+policy|activ|word\s+explanations|date\s+when|product\s+name|product\s+benefit|section\s+b|section\s+c|or\s+subsumed|or\s+reversible|ics\s+and|the\s+terms|evaluation\s+purposes|specific\s+occupations|certain\s+locations|certain\s+health|new\s+device|exclusion\s+of|situations\s+the|surgical\s+procedure\s+that|a\s+surgical|a\s+medical|provides?\s+by|due\s+to\s+the\s+increase|increases?|breaks?\s+a\s+law|arises?\s+from|consequences?\s+related|cysts|granulomas|malformations)$/i;

const EXCLUSION_DEFINITION_NOISE = /^means?\s|^defined\s+as|^refers?\s+to|^denotes?\s|^indicates?\s|^includes?\s+but|^includes?,\s/i;

const extractExclusions = (text) => {
  const rules = [];
  const seen = new Set();

  // First, try to extract comma-separated lists from "Exclusion: ..." sections
  const exclusionSectionMatch = text.match(/exclusion[s]?\s*:\s*([\s\S]{10,2000}?)(?:\n\n|\r\n\r\n|$)/i);
  if (exclusionSectionMatch) {
    const exclusionText = exclusionSectionMatch[1];
    // Split by commas and extract individual items
    const items = exclusionText.split(/,\s*(?=[A-Z])/).map(s => s.trim()).filter(s => s.length > 3 && s.length < 60);
    for (const item of items) {
      const cleaned = item.replace(/\s+/g, ' ').trim();
      const key = cleaned.toLowerCase();
      if (seen.has(key)) continue;
      if (EXCLUSION_NOISE.test(cleaned)) continue;
      if (EXCLUSION_DEFINITION_NOISE.test(cleaned)) continue;
      // Must look like a medical condition or procedure name
      const MEDICAL_EXCLUSION_RE = /^(cosmetic|cataract|self[\s-]?inflicted|war|nuclear|alcohol|drug|plastic|obesity|dental|vision|hearing|fertility|ivf|stem[\s-]?cell|bariatric|experimental|alternative|hazardous|illegal|radioactive|elective|pre[\s-]?existing|congenital|degenerative|chronic|viral|bacterial|parasitic|neoplastic|malignant|benign|cardiac|neur(?:o|opathy|ological)|orthopaed|dermat|ophthalm|gastro|respiratory|urolog|gynaec|obstetric|paediatric|psychiatric|rehabilit|palliative|respite|home[\s-]?care|ambulance|ayush|day[\s-]?care|maternity|breach|excluded|rehabilitation|rest\s+cure|rehabilit|respite|obesity|cosmetic|hazardous|adventure|substance|abuse|investigation|evaluation)/i;
      if (!MEDICAL_EXCLUSION_RE.test(cleaned)) continue;
      seen.add(key);
      rules.push({
        type: 'exclusion',
        label: cleaned,
        params: { match: key },
        clauseRef: 'Exclusions',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: cleaned,
      });
      if (rules.length >= 15) return rules;
    }
  }

  // Fall back to regex patterns for individual exclusions
  for (const { re } of EXCLUSION_PATTERNS) {
    if (re.source.includes('split')) continue; // Skip the split pattern
    for (const m of text.matchAll(re)) {
      const label = m[1].trim();
      const key = label.toLowerCase();

      // Strict filtering: skip noise, definitions, and invalid lengths.
      if (label.length < 5 || label.length > 60) continue;
      if (EXCLUSION_NOISE.test(label)) continue;
      if (EXCLUSION_DEFINITION_NOISE.test(label)) continue;

      // Must look like a medical condition or procedure name.
      const MEDICAL_EXCLUSION_RE = /^(cosmetic|cataract|self[\s-]?inflicted|war|nuclear|alcohol|drug|plastic|obesity|dental|vision|hearing|fertility|ivf|stem[\s-]?cell|bariatric|experimental|alternative|hazardous|illegal|radioactive|elective|pre[\s-]?existing|congenital|degenerative|chronic|viral|bacterial|parasitic|neoplastic|malignant|benign|cardiac|neur(?:o|opathy|ological)|orthopaed|dermat|ophthalm|gastro|respiratory|urolog|gynaec|obstetric|paediatric|psychiatric|rehabilit|palliative|respite|home[\s-]?care|ambulance|ayush|day[\s-]?care|maternity|breach|excluded|rehabilitation|rest\s+cure|respite|obesity|cosmetic|hazardous|adventure|substance|abuse|investigation|evaluation)/i;
      if (!MEDICAL_EXCLUSION_RE.test(label)) continue;

      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'exclusion',
        label: `${label} exclusion`,
        params: { match: key },
        clauseRef: 'Exclusions',
        confidence: 0.75,
        source: 'heuristic',
        matchedText: m[0],
      });

      // Cap heuristic exclusions at 15 — AI will add more if needed.
      if (rules.length >= 15) return rules;
    }
  }

  return rules;
};

const SECTION_KEYWORDS = [
  { key: 'room_rent', patterns: [/room\s+rent/gi, /room\s+charges/gi, /daily\s+room/gi, /single\s+private\s+room/gi, /room\s+eligibility/gi, /room\s+type/gi] },
  { key: 'room_eligibility', patterns: [/room\s+eligibility/gi, /room\s+type/gi, /room\s+category/gi, /accommodation\s+type/gi] },
  { key: 'icu_charges', patterns: [/intensive\s+care/gi, /\bicu\b/gi, /icu\s+charges/gi, /critical\s+care/gi] },
  { key: 'sub_limits', patterns: [/sub[\s-]?limit/gi, /capping?/gi, /disease\s+specific/gi, /sub[\s-]?limit\s+of\s+benefit/gi] },
  { key: 'waiting_period', patterns: [/waiting\s+period/gi] },
  { key: 'ped_waiting', patterns: [/pre[\s-]?existing\s+(?:disease|condition|illness)/gi, /\bped\b/gi, /pre[\s-]?existing\s+waiting/gi] },
  { key: 'initial_waiting', patterns: [/initial\s+waiting\s+period/gi, /cooling[\s-]?off\s+period/gi, /waiting\s+period\s+of\s+\d+\s+month/gi] },
  { key: 'disease_waiting', patterns: [/specific\s+disease\s+waiting/gi, /disease[\s-]?specific\s+waiting/gi, /named\s+disease\s+waiting/gi, /waiting\s+period\s+for\s+(?:specific|named)/gi] },
  { key: 'co_pay', patterns: [/co[\s-]?pay/gi, /copayment/gi, /co[\s-]?payment/gi] },
  { key: 'deductible', patterns: [/deductible/gi, /excess/gi] },
  { key: 'restoration', patterns: [/restoration\s+benefit/gi, /sum\s+insured\s+restoration/gi, /auto[\s-]?restoration/gi, /restoration\s+of\s+sum/gi] },
  { key: 'benefits_schedule', patterns: [/benefits?\s+table/gi, /schedule\s+of\s+benefits/gi, /product\s+benefit/gi, /benefits?\s+schedule/gi, /list\s+of\s+benefits/gi] },
  { key: 'day_care', patterns: [/day\s+care/gi, /daycare/gi, /day[\s-]?care\s+procedure/gi] },
  { key: 'organ_donor', patterns: [/organ\s+donor/gi, /donor\s+organ/gi, /harvesting\s+of\s+organ/gi] },
  { key: 'domiciliary', patterns: [/domiciliary/gi, /home\s+treatment/gi, /home[\s-]?care\s+treatment/gi] },
  { key: 'modern_treatments', patterns: [/modern\s+treatment/gi, /advanced\s+treatment/gi, /stem[\s-]?cell/gi, /targeted\s+therapy/gi, /immunotherapy/gi] },
  { key: 'pre_post_hospitalisation', patterns: [/pre[\s-]?hospitalisation/gi, /post[\s-]?hospitalisation/gi, /pre[\s-]?hospitalization/gi, /post[\s-]?hospitalization/gi, /pre\s+and\s+post/gi] },
  { key: 'ambulance', patterns: [/ambulance/gi] },
  { key: 'ayush', patterns: [/ayush/gi, /ayurveda/gi, /homeopathy/gi, /unani/gi, /siddha/gi] },
  { key: 'maternity', patterns: [/maternity/gi, /childbirth/gi, /delivery/gi, /newborn/gi] },
  { key: 'cataract', patterns: [/cataract/gi] },
  { key: 'no_claim_bonus', patterns: [/no[\s-]?claim\s+bonus/gi, /cumulative\s+bonus/gi, /ncb/gi] },
  { key: 'health_checkup', patterns: [/health\s+check[\s-]?up/gi, /preventive\s+health/gi, /wellness\s+check/gi] },
  { key: 'wellness', patterns: [/wellness\s+benefit/gi, /wellness\s+program/gi, /health\s+wellness/gi] },
  { key: 'exclusions', patterns: [/exclusions?\b/gi, /not\s+covered/gi, /excluded/gi, /exclusion\s+of/gi] },
  { key: 'hospitalisation', patterns: [/hospitalisation/gi, /hospitalization/gi, /in[\s-]?patient/gi] },
  { key: 'definitions', patterns: [/definitions?\b/gi, /meaning\s+of\s+terms/gi, /glossary/gi] },
  { key: 'disease_specific', patterns: [/disease[\s-]?specific\s+limit/gi, /disease[\s-]?wise\s+limit/gi] },
  { key: 'plan_identity', patterns: [/plan\s+name/gi, /product\s+name/gi, /policy\s+name/gi, /variant/gi, /floater/gi, /individual/gi, /family\s+float/gi] },
  { key: 'sum_insured', patterns: [/sum\s+insured/gi, /insured\s+amount/gi, /coverage\s+amount/gi, /basic\s+sum/gi] },
  { key: 'geographic_zoning', patterns: [/zone\s+[a-d]/gi, /tier[\s-]?1/gi, /tier[\s-]?2/gi, /geographic/gi, /city\s+tier/gi, /metro/gi, /non[\s-]?metro/gi] },
  { key: 'permanent_exclusions', patterns: [/permanent\s+exclusion/gi, /lifetime\s+exclusion/gi, /never\s+covered/gi, /permanently\s+excluded/gi] },
];

const classifySections = (text) => {
  const t = String(text || '');
  const sections = [];

  for (const section of SECTION_KEYWORDS) {
    for (const pattern of section.patterns) {
      for (const match of t.matchAll(pattern)) {
        // Capture a larger window around each keyword to include full tables.
        const start = Math.max(0, match.index - 500);
        const end = Math.min(t.length, match.index + 4000);
        sections.push({
          key: section.key,
          start,
          end,
          text: t.slice(start, end),
          relevance: getSectionRelevance(section.key),
        });
      }
    }
  }

  // Deduplicate overlapping sections — merge if same key and close proximity.
  sections.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const s of sections) {
    const last = merged[merged.length - 1];
    if (last && last.key === s.key && s.start - last.end < 500) {
      last.end = Math.max(last.end, s.end);
      last.text = t.slice(last.start, last.end);
    } else {
      merged.push({ ...s });
    }
  }

  return merged.sort((a, b) => b.relevance - a.relevance);
};

const getSectionRelevance = (key) => {
  const scores = {
    room_rent: 100,
    room_eligibility: 99,
    icu_charges: 98,
    sub_limits: 97,
    waiting_period: 96,
    ped_waiting: 95,
    initial_waiting: 94,
    disease_waiting: 93,
    co_pay: 92,
    deductible: 91,
    restoration: 90,
    benefits_schedule: 89,
    day_care: 88,
    organ_donor: 87,
    domiciliary: 86,
    modern_treatments: 85,
    pre_post_hospitalisation: 84,
    ambulance: 83,
    ayush: 82,
    maternity: 81,
    cataract: 80,
    no_claim_bonus: 79,
    health_checkup: 78,
    wellness: 77,
    exclusions: 76,
    permanent_exclusions: 75,
    plan_identity: 74,
    sum_insured: 73,
    geographic_zoning: 72,
    hospitalisation: 50,
    definitions: 15,
    disease_specific: 60,
    zone: 71,
    territory: 70,
  };
  return scores[key] || 10;
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 4. RULE EXTRACTORS (each independent, with multiple regex patterns)
// ═══════════════════════════════════════════════════════════════════════════════

const extractRoomRent = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, type, min, max } of ROOM_RENT_PATTERNS) {
    for (const m of text.matchAll(re)) {
      // Handle unrestricted patterns (single private room, no restriction, 100% SI)
      if (type === 'unrestricted') {
        if (seen.has('unrestricted')) continue;
        seen.add('unrestricted');
        rules.push({
          type: 'room_rent',
          label: 'Room rent: No restriction (single private room / 100% of sum insured)',
          params: { percentOfSumInsured: 100 },
          clauseRef: 'Room Rent',
          confidence: 0.9,
          source: 'heuristic',
          matchedText: m[0],
        });
        continue;
      }

      const raw = m[1];
      if (raw == null) continue; // Skip if no capture group matched
      const value = Number(raw.replace(/,/g, ''));
      if (value < min || value > max) continue;
      // 100% means no room rent restriction — skip.
      if (type === 'percent' && value >= 100) continue;

      const key = type === 'percent' ? `pct_${value}` : `abs_${value}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'room_rent',
        label: type === 'percent'
          ? `Room rent: ${value}% of sum insured / day`
          : `Room rent: ₹${value.toLocaleString('en-IN')} / day`,
        params: type === 'percent'
          ? { percentOfSumInsured: value }
          : { absolutePerDay: value },
        clauseRef: 'Room Rent',
        confidence: 0.9,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractCoPay = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re } of CO_PAY_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const percent = Number(m[1]);
      if (percent <= 0 || percent >= 100) continue;
      if (seen.has(percent)) continue;
      seen.add(percent);

      rules.push({
        type: 'co_pay',
        label: `Co-payment: ${percent}%`,
        params: { percent },
        clauseRef: 'Co-payment',
        confidence: 0.85,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractDeductible = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re } of DEDUCTIBLE_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const amount = Number(m[1].replace(/,/g, ''));
      if (amount <= 0) continue;
      if (seen.has(amount)) continue;
      seen.add(amount);

      rules.push({
        type: 'deductible',
        label: `Deductible: ₹${amount.toLocaleString('en-IN')}`,
        params: { amount },
        clauseRef: 'Deductible',
        confidence: 0.85,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractWaitingPeriods = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of WAITING_PERIOD_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const months = Number(m[1]);
      if (months < 1 || months > 120) continue; // Skip fractional months and unreasonable values.
      const key = `${label.toLowerCase()}_${months}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'waiting_period',
        label: `${label}: ${months} months`,
        params: { procedure: label.toLowerCase().replace(/\s*waiting\s*period\s*/g, '').trim() || 'general', months },
        clauseRef: 'Waiting Period',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractSubLimitsFromTables = (tables) => {
  const rules = [];
  const seen = new Set();

  for (const row of tables.rows || []) {
    const amountStr = row.map((c) => c.replace(/[₹,\s]/g, '')).find((c) => /^\d{4,}$/.test(c));
    if (!amountStr) continue;

    const procedure = row.find((c) => c.length > 3 && !/^\d/.test(c) && !/^₹/.test(c) && !/^(of|in|or|and|the|for|from|to)$/i.test(c));
    if (!procedure) continue;

    const cap = Number(amountStr);
    if (cap < 1000) continue; // Sub-limits below ₹1,000 are not real limits.

    const key = `${procedure.toLowerCase()}_${cap}`;
    if (seen.has(key)) continue;
    seen.add(key);

    rules.push({
      type: 'sub_limit',
      label: `${procedure.trim()} sub-limit: ₹${cap.toLocaleString('en-IN')}`,
      params: { procedure: procedure.trim().toLowerCase(), cap },
      clauseRef: 'Sub-limits',
      confidence: 0.75,
      source: 'table',
      matchedText: row.join(' | '),
    });
  }

  return rules;
};

const extractSubLimitsFromText = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re } of SUB_LIMIT_PATTERNS) {
    if (re?.fromTable) continue;
    for (const m of text.matchAll(re)) {
      const procedure = (m[1] || '').trim();
      const cap = Number((m[2] || '0').replace(/,/g, ''));

      if (procedure.length < 3 || cap <= 0) continue; // Skip zero or negative values
      if (cap < 1000) continue; // Sub-limits below ₹1,000 are not real limits.
      const key = `${procedure.toLowerCase()}_${cap}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'sub_limit',
        label: `${procedure} sub-limit: ₹${cap.toLocaleString('en-IN')}`,
        params: { procedure: procedure.toLowerCase(), cap },
        clauseRef: 'Sub-limits',
        confidence: 0.7,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractRestoration = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of RESTORATION_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const percent = m[1] ? Number(m[1]) : null;
      const key = `restoration_${percent || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'restoration',
        label: percent ? `${label}: ${percent}%` : label,
        params: percent ? { percent } : { unlimited: true },
        clauseRef: 'Restoration Benefit',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractDayCare = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of DAY_CARE_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const count = m[1] ? Number(m[1]) : null;
      const key = `daycare_${count || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'day_care',
        label: count ? `${label}: ${count}` : label,
        params: count ? { count } : { covered: true },
        clauseRef: 'Day Care Procedures',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractPrePostHospital = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of PRE_POST_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ? Number(m[1]) : null;
      const key = `${label.toLowerCase()}_${value}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'pre_post_hospital',
        label: value ? `${label}: ${value} days` : label,
        params: { days: value },
        clauseRef: 'Pre/Post Hospitalisation',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractAmbulance = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of AMBULANCE_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ? Number(m[1].replace(/,/g, '')) : null;
      const key = `ambulance_${value || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'ambulance',
        label: value ? `${label}: ₹${value.toLocaleString('en-IN')}` : label,
        params: value ? { cap: value } : { covered: true },
        clauseRef: 'Ambulance',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractAyush = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of AYUSH_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ? Number(m[1].replace(/,/g, '')) : null;
      const key = `ayush_${value || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'ayush',
        label: value ? `${label}: ₹${value.toLocaleString('en-IN')}` : label,
        params: value ? { cap: value } : { covered: true },
        clauseRef: 'AYUSH',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractMaternity = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of MATERNITY_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ? Number(m[1].replace(/,/g, '')) : null;
      const key = `maternity_${value || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'maternity',
        label: value ? `${label}: ₹${value.toLocaleString('en-IN')}` : label,
        params: value ? { cap: value } : { covered: true },
        clauseRef: 'Maternity',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractNoClaimBonus = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of NO_CLAIM_BONUS_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const percent = m[1] ? Number(m[1]) : null;
      const key = `ncb_${percent || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'no_claim_bonus',
        label: percent ? `${label}: ${percent}%` : label,
        params: percent ? { percentPerYear: percent } : { covered: true },
        clauseRef: 'No Claim Bonus',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractOrganDonor = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of ORGAN_DONOR_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ? Number(m[1].replace(/,/g, '')) : null;
      const key = `organ_donor_${value || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'organ_donor',
        label: value ? `${label}: ₹${value.toLocaleString('en-IN')}` : label,
        params: value ? { cap: value } : { covered: true },
        clauseRef: 'Organ Donor',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractDomiciliary = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of DOMICILIARY_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ? Number(m[1].replace(/,/g, '')) : null;
      const key = `domiciliary_${value || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'domiciliary',
        label: value ? `${label}: ₹${value.toLocaleString('en-IN')}` : label,
        params: value ? { cap: value } : { covered: true },
        clauseRef: 'Domiciliary Treatment',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractModernTreatments = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of MODERN_TREATMENTS_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ? Number(m[1].replace(/,/g, '')) : null;
      const key = `modern_${value || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'modern_treatments',
        label: value ? `${label}: ₹${value.toLocaleString('en-IN')}` : label,
        params: value ? { cap: value } : { covered: true },
        clauseRef: 'Modern Treatments',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractIcuCharges = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of ICU_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ? Number(m[1].replace(/,/g, '')) : null;
      const key = `icu_${value || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'icu_charges',
        label: value ? `${label}: ₹${value.toLocaleString('en-IN')}` : label,
        params: { amount: value },
        clauseRef: 'ICU Charges',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

const extractHealthCheckup = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re, label } of HEALTH_CHECKUP_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const value = m[1] ? Number(m[1].replace(/,/g, '')) : null;
      const key = `healthcheck_${value || label.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rules.push({
        type: 'health_checkup',
        label: value ? `${label}: ₹${value.toLocaleString('en-IN')}` : label,
        params: value ? { cap: value } : { covered: true },
        clauseRef: 'Health Checkup',
        confidence: 0.8,
        source: 'heuristic',
        matchedText: m[0],
      });
    }
  }

  return rules;
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 5. METADATA EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════════

const cleanPlanName = (s) => {
  const v = String(s || '').trim().replace(/\s+/g, ' ');
  if (v.length < 3) return '';
  if (/policyholder|insured\s+name|^name\b|^(mr|mrs|ms|dr|m\/s)\b/i.test(v)) return '';
  if (/^(proposer|insured|policy\s+holder)/i.test(v)) return '';
  return v.slice(0, 60);
};

const extractInsurer = (text) => {
  const t = String(text || '');

  // Try known insurer patterns.
  for (const pattern of INSURER_PATTERNS) {
    const m = t.match(pattern);
    if (m) return m[0].trim();
  }

  // Try generic "issued by X" / "insurer: X" patterns.
  const issuedBy = t.match(/issued\s+by\s+([A-Z][A-Z\s.]+(?:LIMITED|LTD|CO\.?\s*LIMITED|INSURANCE))/i);
  if (issuedBy) return issuedBy[1].trim();

  const insurerLabel = t.match(/insurer[:\s]+([A-Z][A-Z\s.]+)/i);
  if (insurerLabel) return insurerLabel[1].trim();

  return 'Unknown Insurer';
};

const extractPlanName = (text) => {
  const t = String(text || '');

  // Try "Plan Name: X" / "Product: X" / "Policy: X" patterns.
  const patterns = [
    /plan\s+name[:\s]+([A-Z][A-Za-z0-9\s.]{2,50})/i,
    /product[:\s]+([A-Z][A-Za-z0-9\s.]{2,50})/i,
    /policy\s+name[:\s]+([A-Z][A-Za-z0-9\s.]{2,50})/i,
    /(?:plan|product|policy)\s+(?:is\s+)?[:\s]*([A-Z][A-Za-z0-9\s.]{2,50})/i,
  ];

  for (const pattern of patterns) {
    const m = t.match(pattern);
    if (m) return cleanPlanName(m[1]);
  }

  // Try to find a capitalized product name near the start.
  const nearStart = t.slice(0, 2000);
  const productMatch = nearStart.match(/(?:Activ|Health|Optima|ReAssure|Companion|Secure|Gold|Platinum|Diamond|Silver|Bronze|Premier|Classic|Essential|Plus|Elite|Supreme)[A-Za-z0-9\s]*/i);
  if (productMatch) return cleanPlanName(productMatch[0]);

  return 'Uploaded Policy';
};

const extractSumInsured = (text) => {
  const t = String(text || '');

  const patterns = [
    /sum\s+insured[^₹\d]*(?:rs\.?|₹)?\s*([\d,]+)/i,
    /insured\s+amount[^₹\d]*(?:rs\.?|₹)?\s*([\d,]+)/i,
    /(?:rs\.?|₹)\s*([\d,]+)\s*(?:sum\s+insured|insured\s+amount)/i,
  ];

  for (const pattern of patterns) {
    const m = t.match(pattern);
    if (m) return Number(m[1].replace(/,/g, ''));
  }

  return 0;
};

const extractMetadata = (text) => {
  const t = String(text || '');

  return {
    insurer: extractInsurer(t),
    planName: extractPlanName(t),
    sumInsured: extractSumInsured(t),
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 6. HEURISTIC PIPELINE
// ═══════════════════════════════════════════════════════════════════════════════

const runHeuristicExtractors = (text, tables) => {
  const t = String(text || '');
  const allRules = [
    ...extractRoomRent(t),
    ...extractCoPay(t),
    ...extractDeductible(t),
    ...extractWaitingPeriods(t),
    ...extractExclusions(t),
    ...extractSubLimitsFromText(t),
    ...extractSubLimitsFromTables(t),
    ...extractRestoration(t),
    ...extractDayCare(t),
    ...extractPrePostHospital(t),
    ...extractAmbulance(t),
    ...extractAyush(t),
    ...extractMaternity(t),
    ...extractNoClaimBonus(t),
    ...extractOrganDonor(t),
    ...extractDomiciliary(t),
    ...extractModernTreatments(t),
    ...extractIcuCharges(t),
    ...extractHealthCheckup(t),
  ];

  return allRules;
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 7. GAP DETECTION — which rule categories are missing?
// ═══════════════════════════════════════════════════════════════════════════════

const detectMissingCategories = (rules) => {
  const categories = new Set(rules.map((r) => r.type));
  const missing = [];

  if (!categories.has('room_rent')) missing.push('room_rent');
  if (!categories.has('sub_limit')) missing.push('sub_limit');
  if (!categories.has('waiting_period')) missing.push('waiting_period');
  if (!categories.has('co_pay')) missing.push('co_pay');
  if (!categories.has('deductible')) missing.push('deductible');
  if (!categories.has('exclusion')) missing.push('exclusion');
  if (!categories.has('restoration')) missing.push('restoration');
  if (!categories.has('day_care')) missing.push('day_care');
  if (!categories.has('pre_post_hospital')) missing.push('pre_post_hospital');
  if (!categories.has('ambulance')) missing.push('ambulance');
  if (!categories.has('ayush')) missing.push('ayush');
  if (!categories.has('maternity')) missing.push('maternity');
  if (!categories.has('no_claim_bonus')) missing.push('no_claim_bonus');
  if (!categories.has('organ_donor')) missing.push('organ_donor');
  if (!categories.has('domiciliary')) missing.push('domiciliary');
  if (!categories.has('modern_treatments')) missing.push('modern_treatments');
  if (!categories.has('icu_charges')) missing.push('icu_charges');
  if (!categories.has('health_checkup')) missing.push('health_checkup');
  if (!categories.has('plan_identity')) missing.push('plan_identity');
  if (!categories.has('sum_insured')) missing.push('sum_insured');
  if (!categories.has('geographic_zoning')) missing.push('geographic_zoning');
  if (!categories.has('permanent_exclusion')) missing.push('permanent_exclusion');

  return missing;
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 8. AI EXTRACTION (gap-based, structured context, all providers)
// ═══════════════════════════════════════════════════════════════════════════════

const AI_SYSTEM = 'You are an expert at reading Indian health-insurance policy documents. Extract rules as STRICT JSON only — no prose, no markdown fences.';

const buildAiPrompt = (sections, metadata, missingCategories) => {
  // Limit to top 25 sections by relevance. Each gets ~960 chars (24000/25).
  const topSections = sections.slice(0, 25);
  const perSection = Math.floor(24000 / topSections.length);
  const sectionContext = topSections.map((s) => `[${SECTION_LABELS[s.key] || s.key}]\n${s.text.slice(0, perSection)}`).join('\n\n');

  return `You are an expert Health Insurance Underwriter and Data Extraction Analyst. Your task is to analyze the attached health insurance policy document and extract ALL operational, financial, and clinical clauses.

For every piece of information you extract, you must categorize it strictly into one of the following validated RULE_TYPES:
['plan_identity', 'sum_insured', 'geographic_zoning', 'room_rent', 'icu_charges', 'pre_post_hospital', 'co_pay', 'deductible', 'sub_limit', 'day_care', 'ambulance', 'ayush', 'maternity', 'organ_donor', 'domiciliary', 'modern_treatments', 'restoration', 'no_claim_bonus', 'health_checkup', 'waiting_period', 'exclusion', 'permanent_exclusion']

CRITICAL EXTRACTION INSTRUCTIONS:
1. DO NOT SUMMARIZE: Extract precise clauses, percentages, numbers of days, and currency values.
2. HANDLING MISSING DATA: If a rule type from the list above is not explicitly mentioned in the PDF text, populate its key value strictly with the text string "Not specified in document". Do not leave keys out, and do not use null or undefined variables.
3. CLEAR DISTINCTION: Differentiate clearly between temporary 'waiting_period' clauses (like 2-year cataract waiting periods) and lifelong 'permanent_exclusion' items.
4. STRICT OUTPUT FORMAT: You must return the final result strictly as a valid, single JSON object adhering to the schema below. Do not include any conversational text, pleasantries, introductory remarks, or concluding notes.

MISSING CATEGORIES TO EXTRACT: ${missingCategories.length ? missingCategories.join(', ') : 'All categories — extract everything found.'}

CONTEXT:
- Insurer: ${metadata.insurer || 'Unknown'}
- Plan: ${metadata.planName || 'Unknown'}
- Sum Insured: ${metadata.sumInsured || 'Unknown'}

JSON SCHEMA (you MUST return this exact structure):
{
  "planIdentity": "Exact plan name, variant, and policy structure, e.g., Max Bupa ReAssure 2.0 Floater",
  "sumInsured": "Total base insurance coverage amount available per policy year",
  "geographicZoning": "Premium variations, tier-based restrictions, or localized co-pays",
  "roomRent": "Maximum daily room rent limit or specific allowed room category",
  "icuCharges": "Financial caps or specific terms assigned to intensive care unit stays",
  "prePostHospital": "Number of days covered prior to admission and after discharge, e.g., 60 days pre / 180 days post",
  "coPay": "Percentage share of claims the user must pay out-of-pocket",
  "deductible": "Fixed mandatory threshold amount that must be paid before insurance pays anything",
  "subLimit": "List of all surgical or procedural financial caps, such as specific limits for cataracts",
  "dayCare": "Coverage terms and limits for medical procedures requiring less than 24 hours of hospitalization",
  "ambulance": "Limits and financial caps for road and air emergency transport services",
  "ayush": "Limits on non-allopathic treatments like Ayurveda, Yoga, Unani, Siddha, or Homeopathy",
  "maternity": "Maternity limits for normal/cesarean operations, waiting periods, and newborn inclusion rules",
  "organDonor": "Coverage details and maximum allowance for harvesting a donor's organ",
  "domiciliary": "Terms for medical treatments managed at home due to hospital bed shortages",
  "modernTreatments": "Coverage limits for advanced medical science like robotic surgery or stem cell therapy",
  "restoration": "Trigger mechanisms, replenishment frequencies, and percentage rules for resetting exhausted covers",
  "noClaimBonus": "Accumulation rates, multipliers, and percentage caps rewarded for claim-free policy cycles",
  "healthCheckup": "Free annual physical check-up privileges or outpatient department (OPD) rewards",
  "waitingPeriod": "Initial 30-day cooling-off windows, specific disease waiting times, and Pre-Existing Disease (PED) timelines",
  "exclusion": "Standard diagnostic or systemic medical situations that are not covered under standard terms",
  "permanentExclusion": "List of medical procedures, cosmetic modifications, or physical consumables explicitly never covered by the policy"
}

RULES:
- Do NOT extract co_pay or deductible if value is 0
- Do NOT extract room_rent if the value is 100% (that means no restriction)
- Do NOT extract "the following" or generic placeholder text as exclusions
- Do NOT classify benefits (maternity, cataract, AYUSH, ambulance, day care, ICU) as exclusions
- For clauseRef, use the section/clause number from the policy (e.g. "7.b.i", "4.2", "Schedule A")
- If a Schedule/Table lists MULTIPLE deductibles or co-pays for different plan tiers, extract ONLY ONE (the lowest)
- EVERY key in the schema MUST be present. Use "Not specified in document" for any category not found.
- Extract PRECISE numbers, percentages, days, and currency values — never round or approximate.

RELEVANT SECTIONS:
"""${sectionContext.slice(0, 24000)}"""

Return ONLY the JSON object. No markdown fences, no explanation.`;
};

const parseAiResponse = (out) => {
  try {
    const jsonStr = out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1);
    const obj = JSON.parse(jsonStr);

    // Handle new flat schema format (InsurancePolicyExtractionPipeline)
    if (obj.planIdentity != null || obj.roomRent != null) {
      const rules = [];
      const seen = new Set();

      const addRule = (type, value, structuredRule) => {
        if (!value || value === 'Not specified in document' || value === 'N/A') return;
        const dedupKey = `${type}_${value.toLowerCase().slice(0, 60)}`;
        if (seen.has(dedupKey)) return;
        seen.add(dedupKey);
        if (structuredRule) {
          rules.push({ ...structuredRule, source: 'ai', confidence: 0.95 });
        } else {
          rules.push({
            type,
            label: `${type.replace(/_/g, ' ')}: ${value}`,
            params: { raw: value },
            clauseRef: '',
            confidence: 0.95,
            source: 'ai',
            matchedText: value,
          });
        }
      };

      // Plan identity & sum insured as metadata rules
      addRule('plan_identity', obj.planIdentity);
      addRule('sum_insured', obj.sumInsured);
      addRule('geographic_zoning', obj.geographicZoning);

      // Room Rent — parse into structured rule
      if (obj.roomRent && obj.roomRent !== 'Not specified in document') {
        const rr = obj.roomRent;
        const pctMatch = rr.match(/(\d+(?:\.\d+)?)\s*%/);
        const absMatch = rr.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
        if (pctMatch) {
          addRule('room_rent', rr, {
            type: 'room_rent', label: `Room rent: ${pctMatch[1]}% of sum insured / day`,
            params: { percentOfSumInsured: Number(pctMatch[1]) }, clauseRef: 'Room Rent',
          });
        } else if (absMatch) {
          addRule('room_rent', rr, {
            type: 'room_rent', label: `Room rent: ₹${absMatch[1]} / day`,
            params: { absolutePerDay: Number(absMatch[1].replace(/,/g, '')) }, clauseRef: 'Room Rent',
          });
        } else {
          addRule('room_rent', rr);
        }
      }

      // ICU Charges — parse into structured rule
      if (obj.icuCharges && obj.icuCharges !== 'Not specified in document') {
        const icu = obj.icuCharges;
        const pctMatch = icu.match(/(\d+(?:\.\d+)?)\s*%/);
        // Only match ₹ amounts that look like per-day charges (< ₹1,00,000) or explicitly ICU-related
        const absMatch = icu.match(/(?:₹|rs\.?|inr)\s*([\d,]+)\s*(?:per\s+day|\/day|p\.?d\.?)/i);
        if (pctMatch && Number(pctMatch[1]) > 0 && Number(pctMatch[1]) <= 100) {
          addRule('icu_charges', icu, {
            type: 'icu_charges', label: `ICU charges: ${pctMatch[1]}% of sum insured`,
            params: { percentOfSumInsured: Number(pctMatch[1]) }, clauseRef: 'ICU Charges',
          });
        } else if (absMatch && Number(absMatch[1].replace(/,/g, '')) > 0) {
          addRule('icu_charges', icu, {
            type: 'icu_charges', label: `ICU charges: ₹${absMatch[1]} / day`,
            params: { amount: Number(absMatch[1].replace(/,/g, '')) }, clauseRef: 'ICU Charges',
          });
        } else {
          // Check if text mentions "up to sum insured" or similar
          if (/up\s+to\s+(?:sum\s+insured|base\s+sum)/i.test(icu)) {
            addRule('icu_charges', icu, {
              type: 'icu_charges', label: `ICU charges: Up to Sum Insured`,
              params: { percentOfSumInsured: 100 }, clauseRef: 'ICU Charges',
            });
          } else {
            addRule('icu_charges', icu);
          }
        }
      }

      // Pre/Post Hospital — parse into structured rule
      if (obj.prePostHospital && obj.prePostHospital !== 'Not specified in document') {
        const pph = obj.prePostHospital;
        addRule('pre_post_hospital', pph);
      }

      // Co-pay — parse into structured rule
      if (obj.coPay && obj.coPay !== 'Not specified in document') {
        const cp = obj.coPay;
        const pctMatch = cp.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pctMatch && Number(pctMatch[1]) > 0) {
          addRule('co_pay', cp, {
            type: 'co_pay', label: `Co-payment: ${pctMatch[1]}%`,
            params: { percent: Number(pctMatch[1]) }, clauseRef: 'Co-payment',
          });
        }
      }

      // Deductible — parse into structured rule
      if (obj.deductible && obj.deductible !== 'Not specified in document') {
        const ded = obj.deductible;
        const amtMatch = ded.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
        if (amtMatch && Number(amtMatch[1].replace(/,/g, '')) > 0) {
          addRule('deductible', ded, {
            type: 'deductible', label: `Deductible: ₹${amtMatch[1]}`,
            params: { amount: Number(amtMatch[1].replace(/,/g, '')) }, clauseRef: 'Deductible',
          });
        }
      }

      // Sub-limits — split comma-separated list into individual rules
      if (obj.subLimit && obj.subLimit !== 'Not specified in document') {
        const sl = obj.subLimit;
        // Step 1: Normalize — replace Indian number commas with dots to protect them
        const normalized = sl.replace(/(\d),(\d{2})(,(\d{3}))+/g, '$1.$2.$4');
        // Step 2: Split at semicolons or commas between items
        const parts = normalized.split(/[;]\s*|,(?=\s*[A-Z][a-z])/);
        for (const part of parts) {
          // Step 3: Restore commas in numbers
          const restored = part.replace(/(\d)\.(\d{2})(\.(\d{3}))+/g, '$1,$2,$4').trim();
          if (restored.length < 5) continue;
          // Step 4: Extract ALL amounts and use the maximum (handles "INR 800/day up to max INR 4,800")
          const allAmounts = [...restored.matchAll(/(?:₹|inr|rs\.?)\s*([\d,]+)/gi)]
            .map((m) => Number(m[1].replace(/,/g, '')))
            .filter((n) => n > 0);
          if (allAmounts.length === 0) continue;
          const cap = Math.max(...allAmounts);
          // Step 5: Extract procedure name
          let procedure = restored
            .split(/\s+up\s+to\s+(?:inr|rs|₹)/i)[0]
            .split(/:\s*/)[0]
            .split(/\s+sub[\s-]?limit/i)[0]
            .replace(/(?:₹|inr|rs\.?)\s*[\d,]+/gi, '') // Remove inline amounts
            .replace(/\s*(?:per|a)\s*(?:day|policy|hospitalization)\b/gi, '')
            .replace(/\s*(?:maximum|max)\s*/gi, '')
            .replace(/\s*inr\s*/gi, '')
            .trim();
          if (procedure.length < 3) continue;
          // Clean procedure name — remove noise words
          procedure = procedure.replace(/^(?:cap|up\s+to)\s*/i, '').trim();
          if (procedure.length < 3) continue;
          addRule('sub_limit', restored, {
            type: 'sub_limit', label: `${procedure}: ₹${cap.toLocaleString('en-IN')}`,
            params: { procedure: procedure.toLowerCase(), cap }, clauseRef: 'Sub-limits',
          });
        }
      }

      // Day Care
      if (obj.dayCare && obj.dayCare !== 'Not specified in document') {
        addRule('day_care', obj.dayCare);
      }

      // Ambulance — split into individual rules if comma-separated
      if (obj.ambulance && obj.ambulance !== 'Not specified in document') {
        const amb = obj.ambulance;
        const parts = amb.split(/,(?=\s*[A-Z])/);
        for (const part of parts) {
          addRule('ambulance', part.trim());
        }
      }

      // AYUSH
      if (obj.ayush && obj.ayush !== 'Not specified in document') {
        addRule('ayush', obj.ayush);
      }

      // Maternity — parse into structured rule
      if (obj.maternity && obj.maternity !== 'Not specified in document') {
        const mat = obj.maternity;
        const amtMatch = mat.match(/(?:₹|rs\.?|inr)\s*([\d,]+)/i);
        const monthsMatch = mat.match(/(\d+)\s*(?:months?|years?)\s*(?:waiting|cooling)/i);
        if (monthsMatch) {
          addRule('waiting_period', mat, {
            type: 'waiting_period', label: `Maternity waiting period: ${monthsMatch[1]} months`,
            params: { procedure: 'maternity', months: Number(monthsMatch[1]) }, clauseRef: 'Maternity',
          });
        } else if (amtMatch && Number(amtMatch[1].replace(/,/g, '')) > 0) {
          addRule('maternity', mat, {
            type: 'maternity', label: `Maternity: ₹${amtMatch[1]}`,
            params: { cap: Number(amtMatch[1].replace(/,/g, '')) }, clauseRef: 'Maternity',
          });
        } else {
          addRule('maternity', mat);
        }
      }

      // Organ Donor
      if (obj.organDonor && obj.organDonor !== 'Not specified in document') {
        addRule('organ_donor', obj.organDonor);
      }

      // Domiciliary
      if (obj.domiciliary && obj.domiciliary !== 'Not specified in document') {
        addRule('domiciliary', obj.domiciliary);
      }

      // Modern Treatments
      if (obj.modernTreatments && obj.modernTreatments !== 'Not specified in document') {
        addRule('modern_treatments', obj.modernTreatments);
      }

      // Restoration
      if (obj.restoration && obj.restoration !== 'Not specified in document') {
        addRule('restoration', obj.restoration);
      }

      // No Claim Bonus — parse into structured rule
      if (obj.noClaimBonus && obj.noClaimBonus !== 'Not specified in document') {
        const ncb = obj.noClaimBonus;
        const pctMatch = ncb.match(/(\d+(?:\.\d+)?)\s*%/);
        if (pctMatch) {
          addRule('no_claim_bonus', ncb, {
            type: 'no_claim_bonus', label: `No-claim bonus: ${pctMatch[1]}% per year`,
            params: { percentPerYear: Number(pctMatch[1]) }, clauseRef: 'No Claim Bonus',
          });
        } else {
          addRule('no_claim_bonus', ncb);
        }
      }

      // Health Checkup
      if (obj.healthCheckup && obj.healthCheckup !== 'Not specified in document') {
        addRule('health_checkup', obj.healthCheckup);
      }

      // Waiting Period — split into individual rules
      if (obj.waitingPeriod && obj.waitingPeriod !== 'Not specified in document') {
        const wp = obj.waitingPeriod;
        // Split by patterns like "X months for Y" or "Y: X months"
        const wpParts = wp.split(/,\s*(?=\d+\s*months?\s+for\s+|\w[\w\s]*:\s*\d+)/i);
        for (const part of wpParts) {
          const trimmed = part.trim();
          if (trimmed.length < 5) continue;
          const monthsMatch = trimmed.match(/(\d+)\s*months?/i);
          if (monthsMatch && Number(monthsMatch[1]) > 0) {
            // Extract procedure name — clean up duplicated patterns
            let procedure = 'general';
            const procMatch = trimmed.match(/(?:for|:)\s*([\w\s\-]+?)(?:\s*$|\s*,)/i);
            if (procMatch) {
              procedure = procMatch[1].trim().toLowerCase();
              // Remove duplicated text like "24 months for 24 months for X" → "X"
              procedure = procedure.replace(/\d+\s*months?\s+(?:for\s+)?/gi, '').trim();
              // Remove trailing numbers
              procedure = procedure.replace(/\d+$/, '').trim();
              // Remove common noise words
              procedure = procedure.replace(/^(waiting\s+period|for\s+)?/i, '').trim();
            }
            if (!procedure || procedure.length < 2) procedure = 'general';
            addRule('waiting_period', trimmed, {
              type: 'waiting_period', label: `${procedure}: ${monthsMatch[1]} months`,
              params: { procedure, months: Number(monthsMatch[1]) }, clauseRef: 'Waiting Period',
            });
          }
        }
      }

      // Exclusion — split into individual rules
      if (obj.exclusion && obj.exclusion !== 'Not specified in document') {
        const exc = obj.exclusion;
        // Split at semicolons OR commas
        const excParts = exc.split(/[;,]\s*/);
        for (const part of excParts) {
          const trimmed = part.trim();
          if (trimmed.length < 3) continue;
          // Skip single noise words
          if (/^(?:or|and|the|a|an|in|on|at|to|for|of|with|by)$/i.test(trimmed)) continue;
          // Remove trailing code references like (code–excl01)
          const cleaned = trimmed.replace(/\s*\(code[–-]excl\d+\)\s*$/i, '').trim();
          if (cleaned.length < 3) continue;
          addRule('exclusion', cleaned, {
            type: 'exclusion', label: cleaned,
            params: { match: cleaned.toLowerCase() }, clauseRef: 'Exclusions',
          });
        }
      }

      // Permanent Exclusion — split into individual rules
      if (obj.permanentExclusion && obj.permanentExclusion !== 'Not specified in document') {
        const pe = obj.permanentExclusion;
        const peParts = pe.split(/,\s*(?=[A-Z])/);
        for (const part of peParts) {
          const trimmed = part.trim();
          if (trimmed.length < 3) continue;
          addRule('permanent_exclusion', trimmed, {
            type: 'permanent_exclusion', label: trimmed,
            params: { match: trimmed.toLowerCase() }, clauseRef: 'Permanent Exclusions',
          });
        }
      }

      // Extract plan name and sum insured from flat fields
      const planName = obj.planIdentity || '';
      const sumInsuredStr = obj.sumInsured || '';
      const sumMatch = String(sumInsuredStr).match(/[\d,]+/);
      const sumInsured = sumMatch ? Number(sumMatch[0].replace(/,/g, '')) : 0;

      return {
        planName,
        insurer: '',
        sumInsured,
        rules,
      };
    }

    // Handle legacy rules array format
    const rules = (Array.isArray(obj.rules) ? obj.rules : [])
      .filter((r) => VALID_TYPES.has(r?.type))
      .map((r) => ({
        ...r,
        confidence: 0.95,
        source: 'ai',
        matchedText: r.label || '',
      }));

    return {
      planName: obj.planName,
      insurer: obj.insurer,
      sumInsured: Number(obj.sumInsured) || 0,
      rules,
    };
  } catch {
    return null;
  }
};

const runAiExtraction = async (sections, metadata, missingCategories, userId) => {
  const prompt = buildAiPrompt(sections, metadata, missingCategories);

  // Log which sections are being sent to the AI.
  const topSections = sections.slice(0, 25);
  logger.info(`AI context: ${topSections.length} sections, ${prompt.length} chars total`);
  for (const s of topSections) {
    logger.info(`  - [${SECTION_LABELS[s.key] || s.key}] ${s.text.length} chars (relevance: ${s.relevance})`);
  }

  const { results, triedAny } = await completeBest({
    prompt,
    system: AI_SYSTEM,
    temperature: 0,
    maxTokens: 4096,
    userId,
  });

  if (!results.length) return { degraded: true, reason: triedAny ? 'provider-error' : 'no-key' };

  let best = null;
  let bestCount = -1;

  for (const r of results) {
    const parsed = parseAiResponse(r.text);
    if (parsed && parsed.rules.length > bestCount) {
      bestCount = parsed.rules.length;
      best = { ...parsed, provider: r.provider, model: r.model };
    }
  }

  if (!best) return { parseError: true };

  logger.info(`AI extraction: ${best.provider}/${best.model} — ${best.rules.length} rules from ${results.length} providers`);
  return best;
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 9. CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════════════════════

const scoreConfidence = (rules) => {
  return rules.map((r) => ({
    ...r,
    confidence: r.confidence || (r.source === 'ai' ? 0.9 : 0.75),
  }));
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 10. DEDUPLICATION
// ═══════════════════════════════════════════════════════════════════════════════

const deduplicateRules = (rules) => {
  const seen = new Map();

  for (const rule of rules) {
    const key = buildDedupKey(rule);
    const existing = seen.get(key);

    if (!existing || (rule.confidence || 0) > (existing.confidence || 0)) {
      seen.set(key, rule);
    }
  }

  let result = [...seen.values()];

  // Post-process: if multiple deductibles exist, keep only the lowest (base plan).
  const deductibles = result.filter((r) => r.type === 'deductible');
  if (deductibles.length > 1) {
    deductibles.sort((a, b) => (a.params?.amount || 0) - (b.params?.amount || 0));
    const lowest = deductibles[0];
    result = result.filter((r) => r.type !== 'deductible');
    result.push(lowest);
  }

  // Post-process: if multiple co-pays exist, keep only the lowest.
  const coPays = result.filter((r) => r.type === 'co_pay');
  if (coPays.length > 1) {
    coPays.sort((a, b) => (a.params?.percent || 0) - (b.params?.percent || 0));
    const lowest = coPays[0];
    result = result.filter((r) => r.type !== 'co_pay');
    result.push(lowest);
  }

  // Post-process: if multiple room rent rules, keep only the restrictive one (lowest % or absolute).
  // Also filter out 100% room rent (means no restriction).
  const roomRents = result.filter((r) => r.type === 'room_rent');
  if (roomRents.length > 0) {
    const filtered = roomRents.filter((r) => {
      const pct = r.params?.percentOfSumInsured;
      return pct == null || pct < 100;
    });
    if (filtered.length > 1) {
      // Keep the most restrictive: lowest % or lowest absolute.
      const pcts = filtered.filter((r) => r.params?.percentOfSumInsured != null);
      const abss = filtered.filter((r) => r.params?.absolutePerDay != null);
      const best = pcts.length ? pcts.reduce((a, b) => (a.params.percentOfSumInsured <= b.params.percentOfSumInsured ? a : b))
        : abss.reduce((a, b) => (a.params.absolutePerDay <= b.params.absolutePerDay ? a : b));
      result = result.filter((r) => r.type !== 'room_rent');
      result.push(best);
    } else if (filtered.length === 1) {
      result = result.filter((r) => r.type !== 'room_rent');
      result.push(filtered[0]);
    } else {
      result = result.filter((r) => r.type !== 'room_rent');
    }
  }

  // Post-process: remove exclusions that are actually benefits.
  const BENEFIT_KEYWORDS = /^(maternity|cataract|ambulance|ayush|day\s+care|icu|no\s+claim\s+bonus|dental|vision|hearing|fertility|ivf|stem[\s-]?cell|bariatric|home[\s-]?care|respite|palliative|rehabilit)/i;
  result = result.filter((r) => {
    if (r.type !== 'exclusion') return true;
    const match = r.params?.match || '';
    return !BENEFIT_KEYWORDS.test(match);
  });

  // Final safety: for singleton types only, if there are multiple rules, keep only the one with
  // the longest label. Multi-rule types (sub_limit, waiting_period, exclusion) keep all.
  const SINGLETON_TYPES = ['room_rent', 'icu_charges', 'co_pay', 'deductible', 'restoration', 'day_care', 'pre_post_hospital', 'ambulance', 'ayush', 'maternity', 'no_claim_bonus', 'organ_donor', 'domiciliary', 'modern_treatments', 'health_checkup', 'plan_identity', 'sum_insured', 'geographic_zoning'];
  const MULTI_TYPES = ['sub_limit', 'waiting_period', 'exclusion', 'permanent_exclusion'];

  const typeGroups = new Map();
  for (const r of result) {
    const t = (r.type || '').toLowerCase();
    if (!typeGroups.has(t)) typeGroups.set(t, []);
    typeGroups.get(t).push(r);
  }
  const finalResult = [];
  for (const [t, rules] of typeGroups) {
    if (rules.length === 1) {
      finalResult.push(rules[0]);
    } else if (MULTI_TYPES.includes(t)) {
      // Multi-rule types: keep all
      finalResult.push(...rules);
    } else {
      // Singleton types: keep the longest label
      rules.sort((a, b) => (b.label?.length || 0) - (a.label?.length || 0));
      finalResult.push(rules[0]);
    }
  }
  result = finalResult;

  // Ultra-final: remove any singleton rule whose label is just the type name repeated
  // (catches AI artifacts like type="ayush" label="ayush: AYUSH")
  const ultraClean = [];
  for (const r of result) {
    const t = (r.type || '').toLowerCase().replace(/_/g, ' ');
    const labelLower = (r.label || '').toLowerCase().replace(/_/g, ' ');
    const isMulti = MULTI_TYPES.includes((r.type || '').toLowerCase());
    // Skip if label is just the type name or "type: TYPE" with no real info
    if (!isMulti && (labelLower === t || labelLower === `${t}: ${t}` || labelLower === `${t}: ${r.type || ''}`)) continue;
    ultraClean.push(r);
  }
  result = ultraClean;

  return result;
};

const buildDedupKey = (rule) => {
  const params = rule.params || {};

  switch (rule.type) {
    case 'room_rent':
      return `room_rent_${params.percentOfSumInsured || 'abs'}_${params.absolutePerDay || 'pct'}`;
    case 'sub_limit':
      return `sub_limit_${(params.procedure || '').toLowerCase()}_${params.cap || 0}`;
    case 'waiting_period': {
      // For waiting periods, key by procedure+months — different procedures with same months are different rules.
      const proc = (params.procedure || '').toLowerCase().trim();
      return `waiting_period_${proc}_${params.months || 0}`;
    }
    case 'co_pay':
      return `co_pay_${params.percent || 0}`;
    case 'deductible':
      return `deductible_${params.amount || 0}`;
    case 'exclusion':
      return `exclusion_${(params.match || '').toLowerCase()}`;
    case 'restoration':
      return `restoration_${params.percent || 'unlimited'}`;
    case 'day_care':
      return `day_care_${params.count || 'covered'}`;
    case 'pre_post_hospital':
      return `pre_post_hospital_${params.days || 0}`;
    case 'ambulance':
      return `ambulance_${params.cap || 'covered'}`;
    case 'ayush':
      return `ayush_${params.cap || 'covered'}`;
    case 'maternity':
      return `maternity_${params.cap || 'covered'}`;
    case 'no_claim_bonus':
      return `no_claim_bonus_${params.percentPerYear || 0}`;
    case 'organ_donor':
      return `organ_donor_${params.cap || 'covered'}`;
    case 'domiciliary':
      return `domiciliary_${params.cap || 'covered'}`;
    case 'modern_treatments':
      return `modern_treatments_${params.cap || 'covered'}`;
    case 'icu_charges':
      return `icu_charges_${params.amount || params.percentOfSumInsured || 0}`;
    case 'health_checkup':
      return `health_checkup_${params.cap || 'covered'}`;
    case 'plan_identity':
      return `plan_identity_${(params.raw || '').toLowerCase().slice(0, 50)}`;
    case 'sum_insured':
      return `sum_insured_${(params.raw || '').toLowerCase().slice(0, 50)}`;
    case 'geographic_zoning':
      return `geographic_zoning_${(params.raw || '').toLowerCase().slice(0, 50)}`;
    case 'permanent_exclusion':
      return `permanent_exclusion_${(params.raw || '').toLowerCase().slice(0, 50)}`;
    default:
      return `${rule.type}_${rule.label || ''}_${JSON.stringify(params)}`;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 11. VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

const validateRules = (rules) => {
  const issues = [];
  const cleaned = [];

  for (const [i, rule] of rules.entries()) {
    if (!VALID_TYPES.has(rule.type)) {
      issues.push(`rule[${i}] has invalid type "${rule.type}"`);
      continue;
    }

    if (!rule.label) issues.push(`rule[${i}] missing label`);

    // Skip structured param checks for AI-extracted rules with raw text
    const hasRawParam = rule.params?.raw != null;
    if (!hasRawParam) {
      // Type-specific shape checks (only for heuristic rules with structured params)
      if (rule.type === 'room_rent' && rule.params?.percentOfSumInsured == null && rule.params?.absolutePerDay == null) {
        issues.push(`rule[${i}] room_rent needs percentOfSumInsured or absolutePerDay`);
      }
      if (rule.type === 'sub_limit' && rule.params?.cap == null) {
        issues.push(`rule[${i}] sub_limit needs a cap`);
      }
    }

    // Reject impossible rules.
    if (rule.type === 'room_rent' && !hasRawParam) {
      const pct = rule.params?.percentOfSumInsured;
      const abs = rule.params?.absolutePerDay;
      if (pct != null && (pct <= 0 || pct > 100)) continue;
      if (abs != null && (abs <= 0 || abs > 1000000)) continue;
    }
    if (rule.type === 'co_pay' && !hasRawParam) {
      const pct = Number(rule.params?.percent || 0);
      if (pct <= 0 || pct >= 100) continue;
    }
    if (rule.type === 'deductible' && !hasRawParam) {
      const amt = Number(rule.params?.amount || 0);
      if (amt <= 0) continue;
    }
    if (rule.type === 'sub_limit' && !hasRawParam) {
      const cap = Number(rule.params?.cap || 0);
      if (cap <= 0) continue;
    }
    if (rule.type === 'waiting_period' && !hasRawParam) {
      const months = Number(rule.params?.months || 0);
      if (months <= 0 || months > 120) continue;
    }

    cleaned.push({
      type: rule.type,
      label: rule.label || rule.type,
      params: rule.params || {},
      clauseRef: rule.clauseRef || '',
      confidence: rule.confidence || 0.7,
      source: rule.source || 'unknown',
      matchedText: rule.matchedText || '',
    });
  }

  return { valid: issues.length === 0, rules: cleaned, issues };
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 12. MERGE STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════════

const mergeRules = (heuristicRules, aiResult) => {
  if (!aiResult?.rules?.length) return heuristicRules;

  // Group by type.
  const heuristicByType = {};
  for (const r of heuristicRules) {
    (heuristicByType[r.type] ||= []).push(r);
  }

  const aiByType = {};
  for (const r of aiResult.rules) {
    (aiByType[r.type] ||= []).push(r);
  }

  const merged = [];

  // For each rule type, prefer AI if it has more/better rules.
  for (const type of RULE_TYPES) {
    const hRules = heuristicByType[type] || [];
    const aRules = aiByType[type] || [];

    if (aRules.length > hRules.length) {
      merged.push(...aRules);
    } else {
      merged.push(...hRules);
      // Add AI rules that don't overlap.
      for (const aRule of aRules) {
        const aKey = buildDedupKey(aRule);
        if (!hRules.some((h) => buildDedupKey(h) === aKey)) {
          merged.push(aRule);
        }
      }
    }
  }

  return merged;
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 13. EXTRACTION NOTE GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

const generateExtractionNote = (textLength, aiStatus, ruleCount) => {
  if (ruleCount > 0) return null;

  if (textLength < 40) {
    return 'This PDF has no extractable text — it looks like a scanned image. Try a text-based policy PDF.';
  }
  if (aiStatus?.reason === 'no-key') {
    return 'No LLM key was reachable. Add one in Settings → AI provider keys (or Admin → API Keys) and re-upload.';
  }
  if (aiStatus?.reason === 'provider-error') {
    return `AI extraction failed — ${aiStatus.error || 'the provider returned an error'}. Check the key, then re-upload.`;
  }
  if (aiStatus?.parseError) {
    return 'The AI responded but not in the expected format. Re-upload to retry, or add rules manually.';
  }
  if (!aiStatus) {
    return 'Could not recognise rules in this policy format.';
  }
  return 'The AI could not extract rules from this policy. You can add rules manually on the policy page.';
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 14. MAIN PIPELINE — runPolicyAgent
// ═══════════════════════════════════════════════════════════════════════════════

export const runPolicyAgent = async ({ buffer, audit, userId }) => {
  // ── Step 1: PDF Text Extraction ──
  let started = Date.now();
  const textResult = await pdfTextExtractor(buffer);
  await audit.log({
    agent: 'PolicyAgent',
    tool: 'pdf_text_extractor',
    input: `${buffer.length} bytes`,
    output: { pages: textResult.pages, chars: textResult.text.length },
    startedAt: started,
  });

  // ── Step 2: Table Extraction ──
  started = Date.now();
  const tables = pdfTableExtractor(textResult.text);
  await audit.log({
    agent: 'PolicyAgent',
    tool: 'pdf_table_extractor',
    input: 'raw text',
    output: { rows: tables.rows.length },
    startedAt: started,
  });

  // ── Step 3: Section Classification ──
  started = Date.now();
  const sections = classifySections(textResult.text);
  await audit.log({
    agent: 'PolicyAgent',
    tool: 'section_classifier',
    input: `${textResult.text.length} chars`,
    output: { sections: sections.length, keys: sections.map((s) => s.key) },
    startedAt: started,
  });

  // ── Step 4: Metadata Extraction ──
  started = Date.now();
  let meta = extractMetadata(textResult.text);
  await audit.log({
    agent: 'PolicyAgent',
    tool: 'metadata_extractor',
    input: 'full text',
    output: { insurer: meta.insurer, planName: meta.planName, sumInsured: meta.sumInsured },
    startedAt: started,
  });

  // ── Step 5: Heuristic Rule Extraction ──
  started = Date.now();
  let draftRules = runHeuristicExtractors(textResult.text, tables);
  await audit.log({
    agent: 'PolicyAgent',
    tool: 'heuristic_extractors',
    input: { textChars: textResult.text.length, tableRows: tables.rows.length },
    output: { rules: draftRules.length, byType: countByType(draftRules) },
    startedAt: started,
  });

  // ── Step 6: Gap Detection + AI Extraction ──
  const missingCategories = detectMissingCategories(draftRules);
  let aiStatus = null;
  let mode = 'heuristic';

  if (missingCategories.length > 0 || draftRules.length < 3) {
    started = Date.now();
    aiStatus = await runAiExtraction(sections, meta, missingCategories, userId);
    await audit.log({
      agent: 'PolicyAgent',
      tool: 'ai_rule_extractor',
      input: `${textResult.text.length} chars, missing: [${missingCategories.join(', ')}]`,
      output: {
        degraded: Boolean(aiStatus.degraded),
        reason: aiStatus.reason,
        rules: aiStatus.rules?.length || 0,
        provider: aiStatus.provider || 'none',
      },
      status: aiStatus.degraded ? 'failure' : 'success',
      startedAt: started,
    });

    if (aiStatus.rules?.length) {
      draftRules = mergeRules(draftRules, aiStatus);
      mode = 'ai+heuristic';
    }

    // Merge AI metadata.
    if (!aiStatus.degraded && !aiStatus.parseError) {
      if (aiStatus.planName) meta.planName = aiStatus.planName;
      if (aiStatus.insurer) meta.insurer = aiStatus.insurer;
      if (aiStatus.sumInsured) meta.sumInsured = aiStatus.sumInsured;
    }
  }

  // ── Step 7: Confidence Scoring ──
  draftRules = scoreConfidence(draftRules);

  // ── Step 8: Deduplication ──
  const beforeDedup = draftRules.length;
  draftRules = deduplicateRules(draftRules);

  // ── Step 9: Validation ──
  started = Date.now();
  const validated = ruleValidator(draftRules);
  await audit.log({
    agent: 'PolicyAgent',
    tool: 'rule_validator',
    input: { count: draftRules.length, mode, beforeDedup },
    output: { valid: validated.valid, issues: validated.issues, finalCount: validated.rules.length },
    status: validated.valid ? 'success' : 'failure',
    startedAt: started,
  });

  // ── Step 10: IRDAI Cross-Validation ──
  started = Date.now();
  const regRefs = draftRules.map((r) => ({
    type: r.type,
    regs: irdaiRegulationLookup({ ruleType: r.type }).map((x) => x.code),
  }));
  await audit.log({
    agent: 'PolicyAgent',
    tool: 'irdai_regulation_lookup',
    input: draftRules.map((r) => r.type),
    output: regRefs,
    startedAt: started,
  });

  // ── Step 11: Clean Metadata ──
  const cleaned = cleanPlanName(meta.planName);
  meta.planName = cleaned || (meta.insurer && meta.insurer !== 'Unknown Insurer' ? `${meta.insurer} Policy` : 'Uploaded Policy');

  // ── Step 12: Generate Extraction Note ──
  const extractionNote = generateExtractionNote(textResult.text.length, aiStatus, validated.rules.length);

  return {
    meta,
    rules: validated.rules,
    rawTextSnippet: textResult.text.slice(0, 1000),
    validation: validated,
    extractionMode: mode,
    extractionNote,
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// § 15. UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

const countByType = (rules) => {
  const counts = {};
  for (const r of rules) {
    counts[r.type] = (counts[r.type] || 0) + 1;
  }
  return counts;
};

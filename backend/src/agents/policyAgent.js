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

const RULE_TYPES = ['room_rent', 'sub_limit', 'waiting_period', 'co_pay', 'deductible', 'exclusion'];

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
  { re: /waiting\s+period[^.]*?(\d+)\s*months?/gi, label: 'General waiting period' },
  { re: /pre[\s-]?existing\s+(?:disease|condition)[^.]*?(\d+)\s*months?/gi, label: 'Pre-existing disease waiting period' },
  { re: /(\d+)\s*months?\s+(?:of\s+)?waiting\s+period/gi, label: 'Waiting period' },
  { re: /(?:after|within)\s+(\d+)\s*months/gi, label: 'Waiting period' },
  { re: /specific\s+disease[^.]*?(\d+)\s*months?/gi, label: 'Specific disease waiting period' },
  { re: /waiting\s+period\s*:\s*(\d+)\s*months?/gi, label: 'Waiting period' },
  { re: /(\d+)\s*months?\s+(?:waiting|cooling)/gi, label: 'Waiting period' },
];

const EXCLUSION_PATTERNS = [
  { re: /([\w][\w\s]{3,35}?)\s+(?:is|are)\s+excluded/gi },
  { re: /exclusion[^:]*:\s*([\w][\w\s]{3,35})/gi },
  { re: /not\s+(?:covered|covered\s+under)[^.]*?([\w][\w\s]{3,35})/gi },
  { re: /(?:does\s+not|shall\s+not)\s+cover[^.]*?([\w][\w\s]{3,35})/gi },
];

const SUB_LIMIT_PATTERNS = [
  { fromTable: true },
  { re: /(?:sub[\s-]?limit|capping?)[^.]*?([\w][\w\s]{2,30})[^.]*?(?:rs\.?|₹)\s*([\d,]+)/gi },
  { re: /([\w][\w\s]{2,30})[^.]*(?:sub[\s-]?limit|capping?)[^.]*(?:rs\.?|₹)\s*([\d,]+)/gi },
  { re: /([\w][\w\s]{2,30})[^.]*?(?:rs\.?|₹)\s*([\d,]+)\s*(?:sub[\s-]?limit|capping?)/gi },
];

const EXCLUSION_NOISE = /^(the\s+following|the\s+following\s+conditions|the\s+following\s+items|expenses\s+listed\s+below|as\s+listed\s+below|any\s+of\s+the\s+following|means?\s+|when\s+|where\s+|under\s+|even\s+if|directly\s+from|secondary\s+to|current\s+diagnosis|treatment|nach|by\s+policy|activ|word\s+explanations|date\s+when|product\s+name|product\s+benefit|section\s+b|section\s+c|or\s+subsumed|or\s+reversible|ics\s+and|the\s+terms|evaluation\s+purposes|specific\s+occupations|certain\s+locations|certain\s+health|new\s+device|exclusion\s+of|situations\s+the|surgical\s+procedure\s+that|a\s+surgical|a\s+medical|provides?\s+by|due\s+to\s+the\s+increase|increases?|breaks?\s+a\s+law|arises?\s+from|consequences?\s+related|cysts|granulomas|malformations)$/i;

const EXCLUSION_DEFINITION_NOISE = /^means?\s|^defined\s+as|^refers?\s+to|^denotes?\s|^indicates?\s|^includes?\s+but|^includes?,\s/i;

const extractExclusions = (text) => {
  const rules = [];
  const seen = new Set();

  for (const { re } of EXCLUSION_PATTERNS) {
    for (const m of text.matchAll(re)) {
      const label = m[1].trim();
      const key = label.toLowerCase();

      // Strict filtering: skip noise, definitions, and invalid lengths.
      if (label.length < 5 || label.length > 35) continue;
      if (EXCLUSION_NOISE.test(label)) continue;
      if (EXCLUSION_DEFINITION_NOISE.test(label)) continue;

      // Must look like a medical condition or procedure name.
      const MEDICAL_EXCLUSION_RE = /^(cosmetic|cataract|self[\s-]?inflicted|war|nuclear|alcohol|drug|plastic|obesity|dental|vision|hearing|fertility|ivf|stem[\s-]?cell|bariatric|experimental|alternative|hazardous|illegal|radioactive|elective|pre[\s-]?existing|congenital|degenerative|chronic|viral|bacterial|parasitic|neoplastic|malignant|benign|cardiac|neur(?:o|opathy|ological)|orthopaed|dermat|ophthalm|gastro|respiratory|urolog|gynaec|obstetric|paediatric|psychiatric|rehabilit|palliative|respite|home[\s-]?care|ambulance|ayush|day[\s-]?care|maternity)/i;
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

      // Cap heuristic exclusions at 10 — AI will add more if needed.
      if (rules.length >= 10) return rules;
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
    hospitalisation: 50,
    definitions: 15,
    disease_specific: 60,
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
      const value = Number(m[1].replace(/,/g, ''));
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

      if (procedure.length < 3 || cap < 1000) continue; // Sub-limits below ₹1,000 are not real limits.
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

  return `Extract insurance policy rules from the relevant sections below.

MISSING CATEGORIES TO EXTRACT: ${missingCategories.length ? missingCategories.join(', ') : 'All categories — extract everything found.'}

CONTEXT:
- Insurer: ${metadata.insurer || 'Unknown'}
- Plan: ${metadata.planName || 'Unknown'}
- Sum Insured: ${metadata.sumInsured || 'Unknown'}

OUTPUT JSON SCHEMA:
{
  "planName": string,
  "insurer": string,
  "sumInsured": number,
  "rules": [
    {
      "type": "room_rent"|"sub_limit"|"waiting_period"|"co_pay"|"deductible"|"exclusion",
      "label": "Human-readable title",
      "params": object,
      "clauseRef": "Section/clause reference from the policy"
    }
  ]
}

RULE PARAMS BY TYPE:
- room_rent: {"percentOfSumInsured": number} OR {"absolutePerDay": number}
- sub_limit: {"procedure": "lowercase name", "cap": number_in_rupees}
- waiting_period: {"procedure": "lowercase name", "months": number}
- co_pay: {"percent": number}
- deductible: {"amount": number_in_rupees}
- exclusion: {"match": "lowercase keyword — the EXCLUDED condition ONLY"}

PRIORITY (extract these FIRST):
1. ROOM RENT — room charges, daily room limit, % of sum insured per day. Extract ONLY the actual cap/restriction. If the policy says "100% of sum insured" or "no restriction", that is NOT a rule — skip it.
2. SUB-LIMITS — extract EVERY row from benefit/sub-limit/schedule tables. Each procedure with a ₹ cap is a separate sub_limit. Look for tables with columns like "Benefit", "Sub-limit", "Amount", "₹". Extract ALL rows, not just the first one.
3. CO-PAYMENT — percentage co-pay
4. DEDUCTIBLE — fixed ₹ amounts
5. WAITING PERIODS — initial, pre-existing, specific disease. CRITICAL: extract the PROCEDURE NAME with each waiting period (e.g. "Cataract: 24 months", NOT just "24 months for general"). Every waiting period row in a table is a separate rule.
6. EXCLUSIONS — conditions/procedures explicitly excluded from coverage. Only extract the most important 5-10.

RULES:
- Do NOT extract co_pay or deductible if value is 0
- Do NOT extract room_rent if the value is 100% (that means no restriction)
- Do NOT extract "the following" or generic placeholder text as exclusions
- Do NOT classify benefits (maternity, cataract, AYUSH, ambulance, day care, ICU) as exclusions
- For clauseRef, use the section/clause number from the policy (e.g. "7.b.i", "4.2", "Schedule A")
- If a Schedule/Table lists MULTIPLE deductibles or co-pays for different plan tiers, extract ONLY ONE (the lowest)

RELEVANT SECTIONS:
"""${sectionContext.slice(0, 24000)}"""

Return ONLY the JSON object.`;
};

const parseAiResponse = (out) => {
  try {
    const jsonStr = out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1);
    const obj = JSON.parse(jsonStr);

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

    // Type-specific shape checks.
    if (rule.type === 'room_rent' && rule.params?.percentOfSumInsured == null && rule.params?.absolutePerDay == null) {
      issues.push(`rule[${i}] room_rent needs percentOfSumInsured or absolutePerDay`);
    }
    if (rule.type === 'sub_limit' && rule.params?.cap == null) {
      issues.push(`rule[${i}] sub_limit needs a cap`);
    }

    // Reject impossible rules.
    if (rule.type === 'room_rent') {
      const pct = rule.params?.percentOfSumInsured;
      const abs = rule.params?.absolutePerDay;
      if (pct != null && (pct <= 0 || pct > 100)) continue;
      if (abs != null && (abs <= 0 || abs > 1000000)) continue;
    }
    if (rule.type === 'co_pay') {
      const pct = Number(rule.params?.percent || 0);
      if (pct <= 0 || pct >= 100) continue;
    }
    if (rule.type === 'deductible') {
      const amt = Number(rule.params?.amount || 0);
      if (amt <= 0) continue;
    }
    if (rule.type === 'sub_limit') {
      const cap = Number(rule.params?.cap || 0);
      if (cap <= 0) continue;
    }
    if (rule.type === 'waiting_period') {
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

// Human-readable names + a one-line "what it produces" for every pipeline step.
// The trace should read like plain English, not raw function identifiers.

export const AGENT_LABELS = {
  CaseAgent: 'Case Agent',
  DecisionEngine: 'Decision Engine',
  ExplanationAgent: 'Explanation Agent',
  PolicyAgent: 'Policy Agent',
  GrievanceAgent: 'Grievance Agent',
  ChatAgent: 'Chat Assistant',
};

// label = friendly name; does = what the step produces, in plain language.
export const TOOL_INFO = {
  // Eligibility — case understanding
  medical_term_normalizer: { label: 'Normalize medical terms', does: 'Maps the entered procedure to standard medical terminology.' },
  icd_procedure_lookup: { label: 'ICD procedure lookup', does: 'Finds the standard ICD code for the procedure.' },
  city_tier_classifier: { label: 'Classify city tier', does: 'Works out the city’s cost tier (Tier 1 / 2 / 3).' },
  hospital_cost_estimator: { label: 'Estimate hospital cost', does: 'Estimates the typical cost for this procedure and city.' },
  // Eligibility — decision
  symbolic_shield: { label: 'Decision engine', does: 'Applies the policy rules deterministically to reach the verdict and payable amount.' },
  // Eligibility — explanation
  clause_explainer: { label: 'Explain the verdict', does: 'Writes the plain-language reason, citing the policy clauses.' },
  savings_calculator: { label: 'Calculate savings', does: 'Totals the avoidable shortfalls you could recover.' },
  what_if_analyzer: { label: 'What-if analysis', does: 'Recomputes coverage under alternatives (e.g. a cheaper room or different hospital).' },
  // Policy ingest
  pdf_text_extractor: { label: 'Read PDF text', does: 'Extracts the raw text from the uploaded policy PDF.' },
  pdf_table_extractor: { label: 'Read PDF tables', does: 'Pulls benefit and sub-limit tables out of the PDF.' },
  ai_rule_extractor: { label: 'AI rule extraction', does: 'Uses the LLM to read every rule from the policy text.' },
  irdai_regulation_lookup: { label: 'IRDAI regulation lookup', does: 'Cross-references each rule against IRDAI regulations.' },
  rule_validator: { label: 'Validate & freeze rules', does: 'Checks each rule’s shape, then freezes the rule set.' },
  // Grievance / dispute
  precedent_matcher: { label: 'Match precedents', does: 'Finds similar past grievances and ombudsman rulings.' },
  grievance_drafter: { label: 'Draft grievance', does: 'Writes the grievance letter for your case.' },
  report_generator: { label: 'Generate report', does: 'Produces the downloadable PDF report.' },
};

// Friendly name for a tool slug; falls back to Title-Cased words for anything new.
export const humanizeTool = (slug = '') =>
  TOOL_INFO[slug]?.label || slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const toolDescription = (slug = '') => TOOL_INFO[slug]?.does || '';

// "CaseAgent" → "Case Agent" for anything not explicitly mapped.
export const humanizeAgent = (slug = '') =>
  AGENT_LABELS[slug] || String(slug).replace(/([a-z])([A-Z])/g, '$1 $2');

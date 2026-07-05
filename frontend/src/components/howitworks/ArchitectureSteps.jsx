import { useTranslation } from 'react-i18next';

export const ArchitectureSteps = () => {
  const { t } = useTranslation();
  const AGENTS = [
    { n: '01', name: t('howItWorks.agent1Name'), desc: t('howItWorks.agent1Desc'), tools: 'pdf_text_extractor · pdf_table_extractor · irdai_regulation_lookup · rule_validator' },
    { n: '02', name: t('howItWorks.agent2Name'), desc: t('howItWorks.agent2Desc'), tools: 'medical_term_normalizer · icd_procedure_lookup · city_tier_classifier · hospital_cost_estimator' },
    { n: '03', name: t('howItWorks.agent3Name'), desc: t('howItWorks.agent3Desc'), tools: 'exclusions → room rent → sub-limits → waiting periods → deductibles → co-pays', highlight: true },
    { n: '04', name: t('howItWorks.agent4Name'), desc: t('howItWorks.agent4Desc'), tools: 'clause_explainer · savings_calculator · what_if_analyzer' },
    { n: '05', name: t('howItWorks.agent5Name'), desc: t('howItWorks.agent5Desc'), tools: 'search_irdai_precedents · draft_grievance_letter · generate_claim_report_pdf' },
  ];
  return (
    <div className="space-y-4">
      {AGENTS.map((a) => (
        <div key={a.n} className={`ss-card p-6 ${a.highlight ? 'border-softgreen/50' : ''}`}>
          <div className="flex items-start gap-5">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-mono text-sm ${
                a.highlight ? 'bg-softgreen text-white' : 'bg-paleblue/60 text-taupe border border-gray/50'
              }`}
            >
              {a.n}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="ss-display text-[19px] text-ink">{a.name}</p>
                {a.highlight && <span className="ss-tag text-softgreen border-softgreen/40">{t('howItWorks.zeroLlm')}</span>}
              </div>
              <p className="text-sm text-charcoal mt-1.5 leading-relaxed">{a.desc}</p>
              <p className="font-mono text-[11px] text-charcoal/60 mt-3 leading-relaxed">{a.tools}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

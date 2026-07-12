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
        <div key={a.n} className={`bg-white border rounded-2xl p-6 shadow-card ${a.highlight ? 'border-emerald-200' : 'border-slate-200'}`}>
          <div className="flex items-start gap-5">
            <div
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl font-mono text-sm ${
                a.highlight ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {a.n}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-slate-900">{a.name}</p>
                {a.highlight && <span className="ss-tag text-emerald-600 bg-emerald-50">{t('howItWorks.zeroLlm')}</span>}
              </div>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{a.desc}</p>
              <p className="font-mono text-[11px] text-slate-400 mt-3 leading-relaxed">{a.tools}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

import { useTranslation } from 'react-i18next';

const RULE_LABELS = {
  room_rent: 'Room Rent',
  sub_limit: 'Sub-limits',
  waiting_period: 'Waiting Periods',
  co_pay: 'Co-pay',
  deductible: 'Deductible',
  exclusion: 'Exclusions',
};

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const ComparisonResult = ({ comparison }) => {
  const { t } = useTranslation();
  if (!comparison) return null;

  const { policies, ruleMatrix, recommendation } = comparison;

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('compare.ruleCategory')}</th>
              {policies.map((p, i) => (
                <th key={i} className="text-left py-3 px-4 min-w-[200px]">
                  <p className="text-sm font-semibold text-slate-900">{p.planName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.insurer} · {money(p.sumInsured)}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ruleMatrix.map((row) => (
              <tr key={row.type} className="border-b border-slate-100 last:border-0">
                <td className="py-3 pr-4 font-medium text-slate-900 whitespace-nowrap">
                  {RULE_LABELS[row.type] || row.type}
                </td>
                {row.policies.map((cell, i) => (
                  <td key={i} className="py-3 px-4">
                    {cell.count === 0 ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      <ul className="space-y-1">
                        {cell.values.map((val, j) => (
                          <li key={j} className="text-slate-700">
                            {val}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {policies.map((p, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
            <p className="text-sm font-semibold text-slate-900">{p.planName}</p>
            <p className="text-xs text-slate-500 mt-0.5">{p.insurer}</p>
            <div className="ss-rule my-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('policies.sumInsured')}</span>
                <span className="font-mono text-slate-900 tabular-nums">{money(p.sumInsured)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{t('policies.rules')}</span>
                <span className="font-mono text-slate-900 tabular-nums">{(p.rules || []).length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendation && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">{t('compare.recommendation')}</p>
          <p className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: recommendation }} />
        </div>
      )}

      <p className="text-xs text-slate-400 text-center">
        {t('compare.disclaimer')}
      </p>
    </div>
  );
};

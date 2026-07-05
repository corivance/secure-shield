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
      {/* Policy headers */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray/50">
              <th className="text-left py-3 pr-4 ss-eyebrow">{t('compare.ruleCategory')}</th>
              {policies.map((p, i) => (
                <th key={i} className="text-left py-3 px-4 min-w-[200px]">
                  <p className="ss-display text-ink">{p.planName}</p>
                  <p className="text-xs text-charcoal mt-0.5">{p.insurer} · {money(p.sumInsured)}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ruleMatrix.map((row) => (
              <tr key={row.type} className="border-b border-gray/30 last:border-0">
                <td className="py-3 pr-4 font-medium text-ink whitespace-nowrap">
                  {RULE_LABELS[row.type] || row.type}
                </td>
                {row.policies.map((cell, i) => (
                  <td key={i} className="py-3 px-4">
                    {cell.count === 0 ? (
                      <span className="text-charcoal/60">—</span>
                    ) : (
                      <ul className="space-y-1">
                        {cell.values.map((val, j) => (
                          <li key={j} className="text-ink">
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

      {/* Summary per policy */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {policies.map((p, i) => (
          <div key={i} className="ss-card p-4">
            <p className="ss-display text-sm text-ink">{p.planName}</p>
            <p className="text-xs text-charcoal mt-0.5">{p.insurer}</p>
            <div className="ss-rule my-3" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal">{t('policies.sumInsured')}</span>
                <span className="font-mono text-ink tabular-nums">{money(p.sumInsured)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal">{t('policies.rules')}</span>
                <span className="font-mono text-ink tabular-nums">{(p.rules || []).length}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recommendation */}
      {recommendation && (
        <div className="ss-card p-5 border-softgreen/40 bg-softgreen/5">
          <p className="ss-eyebrow text-softgreen mb-2">{t('compare.recommendation')}</p>
          <p className="text-sm text-ink leading-relaxed" dangerouslySetInnerHTML={{ __html: recommendation }} />
        </div>
      )}

      <p className="text-xs text-charcoal/70 text-center">
        {t('compare.disclaimer')}
      </p>
    </div>
  );
};

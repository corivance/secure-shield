import { useTranslation } from 'react-i18next';

const money = (n) => (n == null ? '—' : `₹${Number(n).toLocaleString('en-IN')}`);

export const BreakdownTable = ({ breakdown = [] }) => {
  const { t } = useTranslation();
  const PHASE_LABEL = {
    exclusions: t('ruleTypes.exclusion'),
    room_rent: t('ruleTypes.room_rent'),
    sub_limits: t('ruleTypes.sub_limit'),
    waiting_periods: t('ruleTypes.waiting_period'),
    deductible: t('ruleTypes.deductible'),
    co_pay: t('ruleTypes.co_pay'),
  };
  return (
    <div className="ss-card overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray/60">
            <th className="text-left px-5 py-3 ss-eyebrow font-normal">{t('eligibility.colPhase')}</th>
            <th className="text-left px-5 py-3 ss-eyebrow font-normal">{t('eligibility.colDetail')}</th>
            <th className="text-right px-5 py-3 ss-eyebrow font-normal">{t('eligibility.colShortfall')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray/40">
          {breakdown.map((b, i) => (
            <tr key={i} className={b.triggered ? 'bg-beige/10' : ''}>
              <td className="px-5 py-3.5 whitespace-nowrap">
                <span className="inline-flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${b.triggered ? 'bg-taupe' : 'bg-gray'}`} />
                  <span className="font-medium text-ink">{PHASE_LABEL[b.phase] || b.phase}</span>
                </span>
              </td>
              <td className="px-5 py-3.5 text-charcoal">
                {b.message || b.label || '—'}
                {b.clauseRef && <span className="font-mono text-[11px] text-charcoal/60"> · {b.clauseRef}</span>}
              </td>
              <td className="px-5 py-3.5 text-right font-mono tabular-nums text-taupe">
                {b.shortfall || b.deducted ? money(b.shortfall || b.deducted) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

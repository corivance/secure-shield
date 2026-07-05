import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

export const PlanCard = ({ plan, current, onUpgrade, busy }) => {
  const { t } = useTranslation();
  const money = (n) => (n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : t('common.free'));
  const cap = (n) => (n < 0 ? t('common.unlimited') : n);

  const FEATURES = [
    ['policies', t('plans.features.policies')],
    ['eligibilityChecks', t('plans.features.eligibilityChecks')],
    ['disputes', t('plans.features.disputes')],
  ];

  return (
    <div className={`ss-card p-6 flex flex-col ${current ? 'border-taupe ring-1 ring-taupe/30' : ''}`}>
      <div className="flex items-center justify-between">
        <p className="ss-display text-xl text-ink">{plan.name}</p>
        {current && <span className="ss-tag text-taupe border-taupe/40">{t('plans.current')}</span>}
      </div>

      <p className="mt-2">
        <span className="ss-display text-[28px] text-ink">{money(plan.price)}</span>
        {plan.price > 0 && <span className="text-sm text-charcoal"> · {t('plans.oneTime')}</span>}
      </p>
      {plan.description && <p className="text-sm text-charcoal mt-1">{plan.description}</p>}

      <ul className="mt-4 space-y-2">
        {FEATURES.map(([key, label]) => (
          <li key={key} className="flex items-center gap-2 text-sm text-charcoal">
            <Icon name="check" className="h-4 w-4 text-softgreen shrink-0" />
            <span className="font-mono tabular-nums text-ink">{cap(plan.limits?.[key])}</span> {label}
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-2">
        {current ? (
          <button className="ss-btn-secondary w-full" disabled>{t('plans.currentPlan')}</button>
        ) : plan.price > 0 ? (
          <button className="ss-btn-primary w-full" onClick={() => onUpgrade(plan)} disabled={busy}>
            {busy ? t('plans.processing') : t('plans.upgrade', { price: money(plan.price) })}
          </button>
        ) : (
          <button className="ss-btn-secondary w-full" disabled>{t('plans.downgradeViaAdmin')}</button>
        )}
      </div>
    </div>
  );
};

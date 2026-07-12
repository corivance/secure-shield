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
    <div className={`bg-white border rounded-2xl p-6 flex flex-col shadow-card ${current ? 'border-indigo-300 ring-1 ring-indigo-500/20' : 'border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-slate-900">{plan.name}</p>
        {current && <span className="ss-tag text-indigo-600 bg-indigo-50">{t('plans.current')}</span>}
      </div>

      <p className="mt-2">
        <span className="text-2xl font-semibold text-slate-900">{money(plan.price)}</span>
        {plan.price > 0 && <span className="text-sm text-slate-500"> · {t('plans.oneTime')}</span>}
      </p>
      {plan.description && <p className="text-sm text-slate-500 mt-1">{plan.description}</p>}

      <ul className="mt-4 space-y-2">
        {FEATURES.map(([key, label]) => (
          <li key={key} className="flex items-center gap-2 text-sm text-slate-500">
            <Icon name="check" className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-mono tabular-nums text-slate-900">{cap(plan.limits?.[key])}</span> {label}
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

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { PlanCard } from '../components/plans/PlanCard.jsx';
import { usePlans, useUpgradePlan } from '../hooks/usePlans.js';
import { currentUserAtom } from '../store/authAtom.js';

const UsageBar = ({ label, used, limit }) => {
  const unlimited = limit == null || limit < 0;
  const pct = unlimited ? 0 : Math.min(100, limit === 0 ? 100 : Math.round((used / limit) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono tabular-nums text-slate-900">
          {used}
          {unlimited ? '' : ` / ${limit}`}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : 'bg-indigo-600'}`}
          style={{ width: unlimited ? '12%' : `${pct}%` }}
        />
      </div>
    </div>
  );
};

const PlansPage = () => {
  const { t } = useTranslation();
  const user = useAtomValue(currentUserAtom);
  const { data, isLoading } = usePlans();
  const { upgrade, isPending } = useUpgradePlan();
  const [error, setError] = useState('');

  const RESOURCES = [
    ['policies', t('plans.resources.policies')],
    ['eligibilityChecks', t('plans.resources.eligibilityChecks')],
    ['disputes', t('plans.resources.disputes')],
  ];

  const plans = data?.plans || [];
  const usage = data?.usage || {};
  const current = data?.current;

  const onUpgrade = async (plan) => {
    setError('');
    try {
      await upgrade(plan, user);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <PageHeader eyebrow={t('plans.eyebrow')} title={t('plans.title')} subtitle={t('plans.subtitle')} />
      <ErrorBanner error={error ? { message: error } : null} />

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          {current && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <p className="ss-eyebrow">{t('plans.yourUsage', { plan: current.name })}</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {RESOURCES.map(([key, label]) => (
                  <UsageBar key={key} label={label} used={usage[key] || 0} limit={current.limits?.[key]} />
                ))}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((p) => (
              <PlanCard key={p.slug} plan={p} current={p.slug === data?.currentPlan} onUpgrade={onUpgrade} busy={isPending} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansPage;

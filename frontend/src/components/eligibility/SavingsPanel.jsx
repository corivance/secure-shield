import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const SavingsPanel = ({ savings }) => {
  const { t } = useTranslation();
  const scenarios = savings.scenarios || [];
  const max = savings.maxSavings || savings.potentialSavings || 0;
  if (!max && scenarios.length === 0) return null;

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="bulb" className="h-4 w-4 text-emerald-600" />
        <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">{t('eligibility.savingsTitle')}</p>
      </div>
      {max > 0 && (
        <p className="text-slate-600 text-sm mb-4">
          {t('eligibility.recoverUpTo')}{' '}
          <span className="text-lg font-semibold text-emerald-600 align-middle tabular-nums">{money(max)}</span>.
        </p>
      )}
      <ul className="space-y-2.5">
        {scenarios.map((s, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2.5">
            <span className="text-emerald-600 mt-0.5">→</span>
            <span>
              <span className="font-medium text-slate-900">{s.title}:</span> {s.change}{' '}
              <span className="font-mono text-emerald-600 tabular-nums">(+{money(s.extraSavings)})</span>
            </span>
          </li>
        ))}
      </ul>
      {savings.recommendation && scenarios.length === 0 && (
        <p className="text-sm text-slate-600">{savings.recommendation}</p>
      )}
    </div>
  );
};

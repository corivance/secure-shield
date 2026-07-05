import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const SavingsPanel = ({ savings }) => {
  const { t } = useTranslation();
  const scenarios = savings.scenarios || [];
  const max = savings.maxSavings || savings.potentialSavings || 0;
  if (!max && scenarios.length === 0) return null;

  return (
    <div className="ss-card p-6 border-softgreen/40">
      <div className="flex items-center gap-2 mb-2">
        <Icon name="bulb" className="h-4 w-4 text-softgreen" />
        <p className="ss-eyebrow text-softgreen">{t('eligibility.savingsTitle')}</p>
      </div>
      {max > 0 && (
        <p className="text-charcoal text-sm mb-4">
          {t('eligibility.recoverUpTo')}{' '}
          <span className="ss-display text-softgreen text-lg align-middle tabular-nums">{money(max)}</span>.
        </p>
      )}
      <ul className="space-y-2.5">
        {scenarios.map((s, i) => (
          <li key={i} className="text-sm text-charcoal flex items-start gap-2.5">
            <span className="text-softgreen mt-0.5">→</span>
            <span>
              <span className="font-medium text-ink">{s.title}:</span> {s.change}{' '}
              <span className="font-mono text-softgreen tabular-nums">(+{money(s.extraSavings)})</span>
            </span>
          </li>
        ))}
      </ul>
      {savings.recommendation && scenarios.length === 0 && (
        <p className="text-sm text-charcoal">{savings.recommendation}</p>
      )}
    </div>
  );
};

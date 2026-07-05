import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { VerdictBadge } from '../common/VerdictBadge.jsx';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const when = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export const HistoryRow = ({ check }) => {
  const { t } = useTranslation();
  const pct = Math.round(Number(check.coveragePercent) || 0);
  return (
    <Link
      to={`/checks/${check._id}`}
      className="ss-card ss-interactive group p-4 sm:p-5 flex items-center gap-4 sm:gap-5"
    >
      {/* Coverage indicator — fixed, roomy column so it never collides with the title. */}
      <div className="shrink-0 w-16 text-center border-r border-gray/40 pr-4 sm:pr-5">
        <span className="block font-mono text-2xl leading-none tabular-nums text-ink">
          {pct}<span className="text-xs text-charcoal/50 align-top">%</span>
        </span>
        <span className="block ss-eyebrow text-[9px] mt-1.5 text-charcoal/50">{t('common.covered')}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="ss-display text-[17px] text-ink truncate capitalize">{check.caseInput?.procedure || t('history.caseFallback')}</p>
        <p className="text-sm text-charcoal mt-0.5 truncate">
          {check.policy?.planName || t('history.policyFallback')} ·{' '}
          <span className="font-mono text-[12px] tabular-nums">
            {money(check.eligibleAmount)} / {money(check.claimedAmount)}
          </span>
        </p>
        {check.createdAt && <p className="text-[11px] text-charcoal/50 mt-1">{when(check.createdAt)}</p>}
      </div>

      <VerdictBadge verdict={check.verdict} />
    </Link>
  );
};

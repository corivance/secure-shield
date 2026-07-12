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
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex items-center gap-4 sm:gap-5 hover:border-slate-300 hover:shadow-soft transition-all duration-200 group"
    >
      <div className="shrink-0 w-16 text-center border-r border-slate-100 pr-4 sm:pr-5">
        <span className="block font-mono text-2xl leading-none tabular-nums text-slate-900">
          {pct}<span className="text-xs text-slate-400 align-top">%</span>
        </span>
        <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1.5">{t('common.covered')}</span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold text-slate-900 truncate capitalize">{check.caseInput?.procedure || t('history.caseFallback')}</p>
        <p className="text-sm text-slate-500 mt-0.5 truncate">
          {check.policy?.planName || t('history.policyFallback')} ·{' '}
          <span className="font-mono text-[12px] tabular-nums">
            {money(check.eligibleAmount)} / {money(check.claimedAmount)}
          </span>
        </p>
        {check.createdAt && <p className="text-[11px] text-slate-400 mt-1">{when(check.createdAt)}</p>}
      </div>

      <VerdictBadge verdict={check.verdict} />
    </Link>
  );
};

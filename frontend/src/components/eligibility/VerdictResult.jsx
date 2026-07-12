import { useTranslation } from 'react-i18next';
import { CoverageRing } from '../common/CoverageRing.jsx';
import { VerdictBadge } from '../common/VerdictBadge.jsx';
import { BreakdownTable } from './BreakdownTable.jsx';
import { SavingsPanel } from './SavingsPanel.jsx';
import { Disclaimer } from '../common/Disclaimer.jsx';
import { Icon } from '../common/Icon.jsx';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const VerdictResult = ({ check, onDispute, disputing }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col sm:flex-row items-center gap-7 shadow-card">
        <CoverageRing percent={check.coveragePercent} verdict={check.verdict} size={150} />
        <div className="flex-1 text-center sm:text-left">
          <VerdictBadge verdict={check.verdict} />
          <p className="text-3xl font-semibold text-slate-900 leading-none mt-4 tabular-nums">{money(check.eligibleAmount)}</p>
          <p className="text-slate-500 text-sm mt-1.5">
            {t('eligibility.eligibleOf')} <span className="font-mono tabular-nums">{money(check.claimedAmount)}</span> {t('eligibility.claimed')}
          </p>
          {check.verdict !== 'approved' && onDispute && (
            <button className="ss-btn-primary mt-5" onClick={onDispute} disabled={disputing}>
              {disputing ? t('eligibility.buildingDispute') : (<><Icon name="scale" className="h-4 w-4" /> {t('eligibility.disputeVerdict')}</>)}
            </button>
          )}
        </div>
      </div>

      {check.explanation && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
          <p className="ss-eyebrow mb-3">{t('eligibility.whyVerdict')}</p>
          <p className="text-slate-500 text-[15px] leading-relaxed whitespace-pre-line">{check.explanation}</p>
        </div>
      )}

      <div>
        <p className="ss-eyebrow mb-3">{t('eligibility.ruleBreakdown')}</p>
        <BreakdownTable breakdown={check.breakdown} />
      </div>

      {check.savings && <SavingsPanel savings={check.savings} />}

      <Disclaimer className="px-1" />
    </div>
  );
};

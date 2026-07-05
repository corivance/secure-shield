import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { QuickActions } from '../components/dashboard/QuickActions.jsx';
import { SystemInfoCard } from '../components/dashboard/SystemInfoCard.jsx';
import { StatTile } from '../components/dashboard/StatTile.jsx';
import { CoverageRing } from '../components/common/CoverageRing.jsx';
import { useSystemInfo } from '../hooks/useSystem.js';
import { useHistory } from '../hooks/useEligibility.js';
import { currentUserAtom } from '../store/authAtom.js';

const DashboardPage = () => {
  const { t } = useTranslation();
  const user = useAtomValue(currentUserAtom);
  const { data: info } = useSystemInfo();
  const { data: history = [] } = useHistory();

  const approved = history.filter((h) => h.verdict === 'approved').length;
  const partial = history.filter((h) => h.verdict === 'partial').length;
  const avgCoverage = history.length
    ? Math.round(history.reduce((s, h) => s + (h.coveragePercent || 0), 0) / history.length)
    : 0;
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : '';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t('dashboard.eyebrow')}
        title={firstName ? t('dashboard.welcomeName', { name: firstName }) : t('dashboard.welcome')}
        subtitle={t('dashboard.subtitle')}
      />

      <div className="grid lg:grid-cols-12 gap-5">
        {/* Coverage hero */}
        <section className="ss-card p-7 lg:col-span-7 flex flex-col sm:flex-row items-center gap-7">
          <CoverageRing percent={avgCoverage} verdict="partial" size={150} />
          <div className="flex-1 w-full">
            <p className="ss-eyebrow">{t('dashboard.portfolioCoverage')}</p>
            <p className="ss-display text-[30px] text-ink leading-tight mt-1">
              {history.length === 1
                ? t('dashboard.checksRun_one', { count: history.length })
                : t('dashboard.checksRun_other', { count: history.length })}
            </p>
            <div className="grid grid-cols-3 gap-2.5 mt-5">
              <StatTile label={t('verdict.approved')} value={approved} accent="softgreen" />
              <StatTile label={t('verdict.partial')} value={partial} accent="beige" />
              <StatTile label={t('dashboard.avgCover')} value={`${avgCoverage}%`} accent="taupe" />
            </div>
          </div>
        </section>

        {/* System info */}
        <section className="lg:col-span-5">
          <SystemInfoCard info={info} />
        </section>
      </div>

      <div>
        <p className="ss-eyebrow mb-3">{t('dashboard.quickActions')}</p>
        <QuickActions />
      </div>
    </div>
  );
};

export default DashboardPage;

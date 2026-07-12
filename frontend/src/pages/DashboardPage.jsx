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

      {/* Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
        {/* Coverage Ring - Focal Point: Spans 7 cols, 2 rows */}
        <section className="bg-white border border-slate-200 rounded-2xl p-7 md:col-span-7 md:row-span-2 flex flex-col sm:flex-row items-center gap-7 shadow-card">
          <CoverageRing percent={avgCoverage} verdict="partial" size={150} />
          <div className="flex-1 w-full">
            <p className="ss-eyebrow">{t('dashboard.portfolioCoverage')}</p>
            <p className="text-2xl font-semibold text-slate-900 leading-tight mt-1">
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

        {/* System Info Card: Spans 5 cols, 1 row */}
        <section className="md:col-span-5">
          <SystemInfoCard info={info} />
        </section>

        {/* Stats Row: 3 individual stat tiles spanning varying widths */}
        <section className="md:col-span-3">
          <StatTile label={t('verdict.approved')} value={approved} accent="softgreen" />
        </section>
        <section className="md:col-span-2">
          <StatTile label={t('verdict.partial')} value={partial} accent="beige" />
        </section>

        {/* Quick Actions Section: Spans 12 cols */}
        <section className="md:col-span-12">
          <p className="ss-eyebrow mb-3">{t('dashboard.quickActions')}</p>
          <QuickActions />
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;

import { useTranslation } from 'react-i18next';

export const SystemInfoCard = ({ info }) => {
  const { t } = useTranslation();
  if (!info) return null;
  const stats = [
    { label: t('dashboard.agents'), value: info.agents },
    { label: t('dashboard.tools'), value: info.tools },
    { label: t('dashboard.precedents'), value: info.precedents },
  ];
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 h-full shadow-card">
      <div className="flex items-center justify-between mb-4">
        <p className="ss-eyebrow">{t('dashboard.system')}</p>
        <span className="ss-tag"><span className="ss-dot" /> {t('dashboard.live')}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50 py-3 text-center">
            <p className="text-xl font-semibold text-slate-900 leading-none">{s.value}</p>
            <p className="ss-eyebrow mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="ss-rule mb-4" />
      <p className="ss-eyebrow mb-3">{t('dashboard.providersFailover')}</p>
      <ul className="space-y-2.5">
        {(info.providers || []).map((p) => (
          <li key={p.provider} className="flex items-center justify-between text-sm">
            <span className="text-slate-700 capitalize">
              {p.provider} <span className="font-mono text-[11px] text-slate-400">{p.model}</span>
            </span>
            <span className={`font-mono text-[10.5px] uppercase tracking-wider ${p.live ? 'text-emerald-600' : 'text-slate-400'}`}>
              {p.live ? `● ${t('dashboard.live')}` : `○ ${t('dashboard.standby')}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

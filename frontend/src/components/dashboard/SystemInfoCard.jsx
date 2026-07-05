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
    <div className="ss-card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="ss-eyebrow">{t('dashboard.system')}</p>
        <span className="ss-tag"><span className="ss-dot" /> {t('dashboard.live')}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray/50 bg-paleblue/30 py-3 text-center">
            <p className="ss-display text-2xl text-ink leading-none">{s.value}</p>
            <p className="ss-eyebrow mt-1.5 text-charcoal/70">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="ss-rule mb-4" />
      <p className="ss-eyebrow mb-3">{t('dashboard.providersFailover')}</p>
      <ul className="space-y-2.5">
        {(info.providers || []).map((p) => (
          <li key={p.provider} className="flex items-center justify-between text-sm">
            <span className="text-ink capitalize">
              {p.provider} <span className="font-mono text-[11px] text-charcoal/60">{p.model}</span>
            </span>
            <span className={`font-mono text-[10.5px] uppercase tracking-[0.12em] ${p.live ? 'text-softgreen' : 'text-charcoal/50'}`}>
              {p.live ? `● ${t('dashboard.live')}` : `○ ${t('dashboard.standby')}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

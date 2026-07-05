import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

export const QuickActions = () => {
  const { t } = useTranslation();
  const ACTIONS = [
    { to: '/policies', n: '01', icon: 'upload', title: t('dashboard.uploadPolicyTitle'), desc: t('dashboard.uploadPolicyDesc') },
    { to: '/check', n: '02', icon: 'shield', title: t('dashboard.checkEligibilityTitle'), desc: t('dashboard.checkEligibilityDesc') },
    { to: '/disputes', n: '03', icon: 'scale', title: t('dashboard.disputeClaimTitle'), desc: t('dashboard.disputeClaimDesc') },
    { to: '/chat', n: '04', icon: 'chat', title: t('dashboard.askAssistantTitle'), desc: t('dashboard.askAssistantDesc') },
  ];
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {ACTIONS.map((a) => (
        <Link key={a.to} to={a.to} className="ss-card ss-interactive group p-5 flex flex-col">
          <div className="flex items-start justify-between">
            <Icon name={a.icon} className="h-6 w-6 text-taupe" />
            <span className="font-mono text-[11px] tabular-nums text-charcoal/50">{a.n}</span>
          </div>
          <p className="ss-display text-[17px] text-ink mt-4">{a.title}</p>
          <p className="text-sm text-charcoal mt-1 flex-1">{a.desc}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-eyebrow text-taupe">
            {t('common.open')}
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </span>
        </Link>
      ))}
    </div>
  );
};

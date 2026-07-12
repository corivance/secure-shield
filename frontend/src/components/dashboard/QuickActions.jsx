import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

export const QuickActions = () => {
  const { t } = useTranslation();
  const ACTIONS = [
    { to: '/policies', n: '01', icon: 'upload', title: t('dashboard.uploadPolicyTitle'), desc: t('dashboard.uploadPolicyDesc'), span: 'md:col-span-5 md:row-span-2' },
    { to: '/check', n: '02', icon: 'shield', title: t('dashboard.checkEligibilityTitle'), desc: t('dashboard.checkEligibilityDesc'), span: 'md:col-span-4 md:row-span-1' },
    { to: '/disputes', n: '03', icon: 'scale', title: t('dashboard.disputeClaimTitle'), desc: t('dashboard.disputeClaimDesc'), span: 'md:col-span-3 md:row-span-1' },
    { to: '/chat', n: '04', icon: 'chat', title: t('dashboard.askAssistantTitle'), desc: t('dashboard.askAssistantDesc'), span: 'md:col-span-12 md:row-span-1' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-min">
      {ACTIONS.map((a) => (
        <Link key={a.to} to={a.to} className={`bg-white border border-slate-200 rounded-2xl p-5 flex flex-col hover:border-slate-300 hover:shadow-soft transition-all duration-200 group ${a.span}`}>
          <div className="flex items-start justify-between">
            <Icon name={a.icon} className="h-6 w-6 text-indigo-600" />
            <span className="font-mono text-[11px] tabular-nums text-slate-300">{a.n}</span>
          </div>
          <p className="text-base font-semibold text-slate-900 mt-4">{a.title}</p>
          <p className="text-sm text-slate-500 mt-1 flex-1">{a.desc}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600">
            {t('common.open')}
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </span>
        </Link>
      ))}
    </div>
  );
};

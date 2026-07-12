import { Icon } from './Icon.jsx';

export const EmptyState = ({ title, subtitle, action }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-card">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-slate-400">
        <Icon name="inbox" className="h-5 w-5" />
      </div>
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {subtitle && <p className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

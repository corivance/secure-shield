import { Icon } from './Icon.jsx';

export const EmptyState = ({ title, subtitle, action }) => {
  return (
    <div className="ss-card p-12 text-center">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-gray/60 bg-paleblue/40 text-charcoal">
        <Icon name="inbox" className="h-5 w-5" />
      </div>
      <p className="ss-display text-lg text-ink">{title}</p>
      {subtitle && <p className="text-charcoal text-sm mt-1.5 max-w-sm mx-auto">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

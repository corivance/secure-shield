import { Icon } from '../common/Icon.jsx';
import { timeAgo } from '../../lib/time.js';

const TYPE_ICON = {
  eligibility: 'shield',
  dispute: 'scale',
  policy: 'doc',
  account: 'user',
  compliance: 'clipboard',
  request: 'lock',
  system: 'bell',
};

export const NotificationItem = ({ notification, onSelect }) => {
  const { type, title, body, read, createdAt } = notification;
  return (
    <button
      type="button"
      onClick={() => onSelect?.(notification)}
      className={`w-full text-left flex gap-3 px-4 py-3 transition-colors hover:bg-paleblue/40 ${
        read ? '' : 'bg-paleblue/25'
      }`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-gray/50 bg-white/70 text-charcoal">
        <Icon name={TYPE_ICON[type] || 'bell'} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink truncate">{title}</span>
          {!read && <span className="h-1.5 w-1.5 rounded-full bg-softgreen shrink-0" />}
        </span>
        {body && <span className="block text-xs text-charcoal mt-0.5 leading-relaxed line-clamp-2">{body}</span>}
        <span className="block ss-eyebrow text-charcoal/60 mt-1">{timeAgo(createdAt)}</span>
      </span>
    </button>
  );
};

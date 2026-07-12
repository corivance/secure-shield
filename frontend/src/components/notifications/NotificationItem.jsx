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
      className={`w-full text-left flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${
        read ? '' : 'bg-indigo-50/50'
      }`}
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500">
        <Icon name={TYPE_ICON[type] || 'bell'} className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900 truncate">{title}</span>
          {!read && <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />}
        </span>
        {body && <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{body}</span>}
        <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{timeAgo(createdAt)}</span>
      </span>
    </button>
  );
};

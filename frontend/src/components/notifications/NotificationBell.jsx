import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';
import { NotificationList } from './NotificationList.jsx';
import {
  useNotifications,
  useUnreadCount,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '../../hooks/useNotifications.js';

export const NotificationBell = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: unread = 0 } = useUnreadCount();
  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const recent = (data?.notifications || []).slice(0, 6);
  const unreadCount = data?.unread ?? unread;

  const onSelect = (n) => {
    if (!n.read) markRead.mutate(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-full border border-gray/70 bg-white/60 text-charcoal hover:border-taupe hover:text-ink transition-colors"
        aria-label={t('nav.notifications')}
      >
        <Icon name="bell" className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-taupe text-white font-mono text-[10px] leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2rem)] z-40 ss-card overflow-hidden animate-rise">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray/50">
              <p className="ss-eyebrow">{t('nav.notifications')}</p>
              {unreadCount > 0 && (
                <button
                  className="font-mono text-[10.5px] uppercase tracking-eyebrow text-taupe hover:text-ink"
                  onClick={() => markAll.mutate()}
                  disabled={markAll.isPending}
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>
            <div className="max-h-[380px] overflow-y-auto">
              <NotificationList notifications={recent} onSelect={onSelect} />
            </div>
            <button
              className="w-full px-4 py-3 border-t border-gray/50 font-mono text-[10.5px] uppercase tracking-eyebrow text-charcoal hover:bg-paleblue/40 hover:text-ink transition-colors"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
            >
              {t('notifications.viewAll')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

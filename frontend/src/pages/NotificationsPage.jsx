import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { NotificationList } from '../components/notifications/NotificationList.jsx';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications.js';

const NotificationsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const notifications = data?.notifications || [];
  const unread = data?.unread || 0;

  const onSelect = (n) => {
    if (!n.read) markRead.mutate(n._id);
    if (n.link) navigate(n.link);
  };

  return (
    <div>
      <PageHeader
        eyebrow={t('notifications.eyebrow')}
        title={t('nav.notifications')}
        subtitle={t('notifications.subtitle')}
        actions={
          unread > 0 ? (
            <button className="ss-btn-secondary" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
              {t('notifications.markAllRead')}
            </button>
          ) : null
        }
      />
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="ss-card overflow-hidden">
          <NotificationList notifications={notifications} onSelect={onSelect} dividers />
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;

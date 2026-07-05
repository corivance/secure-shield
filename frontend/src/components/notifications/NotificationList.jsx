import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';
import { NotificationItem } from './NotificationItem.jsx';

export const NotificationList = ({ notifications = [], onSelect, dividers = true }) => {
  const { t } = useTranslation();
  if (!notifications.length) {
    return (
      <div className="px-4 py-10 text-center">
        <Icon name="bell" className="h-7 w-7 mx-auto mb-2 text-charcoal/40" />
        <p className="ss-eyebrow text-charcoal/70">{t('notifications.empty')}</p>
      </div>
    );
  }
  return (
    <ul className={dividers ? 'divide-y divide-gray/40' : ''}>
      {notifications.map((n) => (
        <li key={n._id}>
          <NotificationItem notification={n} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
};

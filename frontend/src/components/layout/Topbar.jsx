import { useTranslation } from 'react-i18next';
import { NotificationBell } from '../notifications/NotificationBell.jsx';
import { Icon } from '../common/Icon.jsx';
import { ProfileMenu } from './ProfileMenu.jsx';
import { LanguageSwitcher } from '../common/LanguageSwitcher.jsx';
import { COMPLIANCE } from '../../constants/compliance.js';

export const Topbar = () => {
  const { t } = useTranslation();
  return (
    <header className="h-16 sticky top-0 z-10 flex items-center gap-4 px-5 md:px-8 border-b border-gray/50 bg-white/55 backdrop-blur-2xl">
      <p className="md:hidden ss-display text-lg text-ink flex items-center gap-2">
        <Icon name="shield" className="h-5 w-5 text-taupe" /> SecureShield
      </p>

      <div className="hidden md:flex items-center gap-2">
        <span className="ss-dot" />
        <span className="font-mono text-[10.5px] uppercase tracking-eyebrow text-charcoal">
          {t('topbar.status', { compliance: COMPLIANCE.short, reviewed: COMPLIANCE.reviewed })}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <NotificationBell />
        <ProfileMenu />
      </div>
    </header>
  );
};

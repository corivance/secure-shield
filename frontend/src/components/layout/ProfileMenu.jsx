import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';
import { ChangePasswordModal } from '../profile/ChangePasswordModal.jsx';
import { useConfirm } from '../common/ConfirmProvider.jsx';
import { useLogout } from '../../hooks/useAuth.js';
import { currentUserAtom } from '../../store/authAtom.js';

const initials = (name = '', email = '') => {
  const base = (name || email || '?').trim();
  const parts = base.split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || base[0]?.toUpperCase() || '?';
};

const Item = ({ icon, label, onClick, danger }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-paleblue/40 ${
      danger ? 'text-taupe' : 'text-ink'
    }`}
  >
    <Icon name={icon} className="h-4 w-4 text-charcoal" />
    {label}
  </button>
);

export const ProfileMenu = () => {
  const { t } = useTranslation();
  const user = useAtomValue(currentUserAtom);
  const navigate = useNavigate();
  const logout = useLogout();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onLogout = async () => {
    setOpen(false);
    const ok = await confirm({
      title: t('profile.logoutConfirmTitle'),
      message: t('profile.logoutConfirmMessage'),
      confirmLabel: t('auth.logout'),
      tone: 'danger',
    });
    if (ok) logout.mutate();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-full pl-1 pr-1 sm:pl-3 py-1 hover:bg-paleblue/40 transition-colors"
      >
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="text-sm text-ink">{user?.fullName || user?.email}</span>
          <span className="ss-eyebrow text-charcoal/60">{t('profile.planLabel', { plan: user?.plan || 'free' })}</span>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-beige/40 border border-beige/60 text-xs font-medium text-taupe">
          {initials(user?.fullName, user?.email)}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-60 z-40 ss-card overflow-hidden animate-rise py-1">
            <div className="px-4 py-3 border-b border-gray/50">
              <p className="text-sm font-medium text-ink truncate">{user?.fullName}</p>
              <p className="text-xs text-charcoal truncate">{user?.email}</p>
            </div>
            <Item icon="user" label={t('profile.viewProfile')} onClick={() => { setOpen(false); navigate('/settings'); }} />
            <Item icon="lock" label={t('profile.changePassword')} onClick={() => { setOpen(false); setShowPassword(true); }} />
            <div className="ss-rule my-1" />
            <Item icon="lock" label={t('auth.logout')} onClick={onLogout} danger />
          </div>
        </>
      )}

      {showPassword && <ChangePasswordModal onClose={() => setShowPassword(false)} />}
    </div>
  );
};

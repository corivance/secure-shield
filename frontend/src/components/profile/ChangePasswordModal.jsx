import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal.jsx';
import { ErrorBanner } from '../common/ErrorBanner.jsx';
import { useChangePassword } from '../../hooks/useAuth.js';

const EMPTY = { currentPassword: '', newPassword: '', confirm: '' };

export const ChangePasswordModal = ({ onClose }) => {
  const { t } = useTranslation();
  const change = useChangePassword();
  const [form, setForm] = useState(EMPTY);
  const [localError, setLocalError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (form.newPassword.length < 8) return setLocalError(t('profile.passwordTooShort'));
    if (form.newPassword !== form.confirm) return setLocalError(t('profile.passwordsNoMatch'));
    change.mutate(
      { currentPassword: form.currentPassword, newPassword: form.newPassword },
      { onSuccess: () => { setForm(EMPTY); onClose(); } }
    );
  };

  return (
    <Modal
      title={t('profile.changePassword')}
      eyebrow={t('profile.securityEyebrow')}
      onClose={onClose}
      footer={
        <>
          <button className="ss-btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="ss-btn-primary" onClick={submit} disabled={change.isPending}>
            {change.isPending ? t('profile.updatingPassword') : t('profile.changePassword')}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner error={localError ? { message: localError } : change.error} />
        <div>
          <label className="ss-label">{t('profile.currentPassword')}</label>
          <input className="ss-input" type="password" value={form.currentPassword} onChange={set('currentPassword')} required />
        </div>
        <div>
          <label className="ss-label">{t('profile.newPassword')}</label>
          <input className="ss-input" type="password" minLength={8} value={form.newPassword} onChange={set('newPassword')} required />
        </div>
        <div>
          <label className="ss-label">{t('profile.confirmPassword')}</label>
          <input className="ss-input" type="password" minLength={8} value={form.confirm} onChange={set('confirm')} required />
        </div>
      </form>
    </Modal>
  );
};

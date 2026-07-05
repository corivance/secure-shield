import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal.jsx';
import { ErrorBanner } from '../common/ErrorBanner.jsx';
import { useUpdateUser } from '../../hooks/useAdmin.js';

export const UserEditModal = ({ user, roles = [], plans = [], onClose }) => {
  const { t } = useTranslation();
  const update = useUpdateUser();
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    email: user.email || '',
    roleSlug: user.roleSlug || 'member',
    plan: user.plan || 'free',
    canUseAdminKeys: Boolean(user.canUseAdminKeys),
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    update.mutate({ id: user.id, patch: form }, { onSuccess: onClose });
  };

  return (
    <Modal title={user.fullName || user.email} eyebrow={t('admin.users.editUser')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner error={update.error} />
        <div>
          <label className="ss-label">{t('admin.users.fullName')}</label>
          <input className="ss-input" value={form.fullName} onChange={set('fullName')} required />
        </div>
        <div>
          <label className="ss-label">{t('admin.users.email')}</label>
          <input className="ss-input" type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="ss-label">{t('admin.users.role')}</label>
            <select className="ss-input" value={form.roleSlug} onChange={set('roleSlug')}>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="ss-label">{t('admin.users.plan')}</label>
            <select className="ss-input" value={form.plan} onChange={set('plan')}>
              {plans.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm text-charcoal">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.canUseAdminKeys}
            onChange={(e) => setForm((f) => ({ ...f, canUseAdminKeys: e.target.checked }))}
          />
          <span>
            {t('admin.users.allowSharedBefore')} <strong className="text-ink">{t('admin.users.allowSharedStrong')}</strong> {t('admin.users.allowSharedAfter')}
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="ss-btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className="ss-btn-primary" disabled={update.isPending}>
            {update.isPending ? t('common.saving') : t('common.saveChanges')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

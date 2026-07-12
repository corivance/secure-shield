import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { ErrorBanner } from '../common/ErrorBanner.jsx';
import { useUpdateProfile } from '../../hooks/useAuth.js';
import { currentUserAtom } from '../../store/authAtom.js';

export const ProfileForm = () => {
  const { t } = useTranslation();
  const user = useAtomValue(currentUserAtom);
  const update = useUpdateProfile();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');

  const dirty = fullName.trim() !== (user?.fullName || '') || email.trim() !== (user?.email || '');

  const submit = (e) => {
    e.preventDefault();
    if (!dirty) return;
    update.mutate({ fullName: fullName.trim(), email: email.trim() });
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
      <p className="ss-eyebrow mb-4">{t('profile.profile')}</p>
      <ErrorBanner error={update.error} />
      <div className="space-y-4 mt-1">
        <div>
          <label className="ss-label">{t('auth.fullName')}</label>
          <input className="ss-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className="ss-label">{t('auth.email')}</label>
          <input className="ss-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-5">
        <button className="ss-btn-primary" disabled={!dirty || update.isPending}>
          {update.isPending ? t('common.saving') : t('common.saveChanges')}
        </button>
        {update.isSuccess && !dirty && (
          <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">{t('profile.saved')}</span>
        )}
      </div>
    </form>
  );
};

import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { ProfileForm } from '../components/profile/ProfileForm.jsx';
import { UserApiKeys } from '../components/profile/UserApiKeys.jsx';
import { useFetchApiKey } from '../hooks/useSystem.js';
import { currentUserAtom } from '../store/authAtom.js';

const initials = (name = '', email = '') => {
  const base = (name || email || '?').trim();
  const parts = base.split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || base[0]?.toUpperCase() || '?';
};

const joined = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const SettingsPage = () => {
  const { t } = useTranslation();
  const user = useAtomValue(currentUserAtom);
  const fetchKey = useFetchApiKey();
  const since = joined(user?.createdAt);

  return (
    <div>
      <PageHeader eyebrow={t('settings.eyebrow')} title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center shadow-card">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-xl bg-indigo-50 border border-indigo-100 text-xl font-medium text-indigo-600">
              {initials(user?.fullName, user?.email)}
            </span>
            <p className="text-base font-semibold text-slate-900 mt-3">{user?.fullName}</p>
            <p className="text-sm text-slate-500 break-all">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className={`ss-tag ${user?.roleSlug === 'super-admin' ? 'text-indigo-600 bg-indigo-50' : ''}`}>
                {user?.roleSlug || 'member'}
              </span>
              <span className="ss-tag">{t('settings.planTag', { plan: user?.plan || 'free' })}</span>
            </div>
            {since && <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-4">{t('settings.memberSince', { date: since })}</p>}
          </div>

          <ProfileForm />
        </aside>

        <div className="lg:col-span-2 space-y-6">
          <UserApiKeys />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
            <p className="ss-eyebrow mb-2">{t('settings.apiKey.title')}</p>
            <p className="text-sm text-slate-500 mb-4">
              {t('settings.apiKey.descBefore')}{' '}
              <code className="font-mono text-[12px] text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">X-API-Key</code>{t('settings.apiKey.descAfter')}
            </p>
            <button className="ss-btn-secondary" onClick={() => fetchKey.mutate()} disabled={fetchKey.isPending}>
              {fetchKey.isPending ? t('settings.apiKey.fetching') : t('settings.apiKey.fetch')}
            </button>
            {fetchKey.data && (
              <p className="font-mono text-[11px] text-emerald-600 mt-3 break-all">{t('settings.apiKey.storedKey', { key: fetchKey.data.apiKey })}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

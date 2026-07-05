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
        {/* Profile — account summary + edit, on the left */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="ss-card p-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-beige/40 border border-beige/60 text-xl font-medium text-taupe">
              {initials(user?.fullName, user?.email)}
            </span>
            <p className="ss-display text-lg text-ink mt-3">{user?.fullName}</p>
            <p className="text-sm text-charcoal break-all">{user?.email}</p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className={`ss-tag ${user?.roleSlug === 'super-admin' ? 'text-taupe border-taupe/40' : ''}`}>
                {user?.roleSlug || 'member'}
              </span>
              <span className="ss-tag capitalize">{t('settings.planTag', { plan: user?.plan || 'free' })}</span>
            </div>
            {since && <p className="ss-eyebrow text-charcoal/60 mt-4">{t('settings.memberSince', { date: since })}</p>}
          </div>

          <ProfileForm />
        </aside>

        {/* Keys & access on the right */}
        <div className="lg:col-span-2 space-y-6">
          <UserApiKeys />

          <div className="ss-card p-6">
            <p className="ss-eyebrow mb-2">{t('settings.apiKey.title')}</p>
            <p className="text-sm text-charcoal mb-4">
              {t('settings.apiKey.descBefore')}{' '}
              <code className="font-mono text-[12px] text-taupe">X-API-Key</code>{t('settings.apiKey.descAfter')}
            </p>
            <button className="ss-btn-secondary" onClick={() => fetchKey.mutate()} disabled={fetchKey.isPending}>
              {fetchKey.isPending ? t('settings.apiKey.fetching') : t('settings.apiKey.fetch')}
            </button>
            {fetchKey.data && (
              <p className="font-mono text-[11px] text-softgreen mt-3 break-all">{t('settings.apiKey.storedKey', { key: fetchKey.data.apiKey })}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

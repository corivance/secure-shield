import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { UserEditModal } from '../components/admin/UserEditModal.jsx';
import { useConfirm } from '../components/common/ConfirmProvider.jsx';
import { useAdminUsers, useDeleteUser } from '../hooks/useAdmin.js';
import { currentUserAtom } from '../store/authAtom.js';

const ROLE_CLASS = {
  'super-admin': 'bg-taupe/15 text-taupe border-taupe/40',
  reviewer: 'bg-softgreen/15 text-softgreen border-softgreen/40',
  member: 'bg-paleblue/60 text-charcoal border-gray/60',
};

const AdminUsersPage = () => {
  const { t } = useTranslation();
  const me = useAtomValue(currentUserAtom);
  const { data, isLoading, error } = useAdminUsers();
  const del = useDeleteUser();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState('');

  const users = data?.users || [];
  const filtered = query
    ? users.filter((u) => `${u.fullName} ${u.email}`.toLowerCase().includes(query.toLowerCase()))
    : users;

  const onDelete = async (u) => {
    const ok = await confirm({
      title: t('admin.users.deleteTitle', { name: u.fullName }),
      message: t('admin.users.deleteMessage', { email: u.email }),
      confirmLabel: t('admin.users.deleteConfirm'),
      tone: 'danger',
    });
    if (ok) del.mutate(u.id);
  };

  return (
    <div>
      <PageHeader
        eyebrow={t('admin.users.eyebrow')}
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle')}
        actions={
          <input
            className="ss-input w-56"
            placeholder={t('admin.users.searchPlaceholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      />
      <ErrorBanner error={error || del.error} />

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="ss-card overflow-x-auto mt-2">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-gray/60">
                <th className="text-left px-5 py-3 ss-eyebrow font-normal">{t('admin.users.colUser')}</th>
                <th className="text-left px-5 py-3 ss-eyebrow font-normal">{t('admin.users.colRole')}</th>
                <th className="text-left px-5 py-3 ss-eyebrow font-normal">{t('admin.users.colPlan')}</th>
                <th className="text-right px-5 py-3 ss-eyebrow font-normal">{t('admin.users.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray/40">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-paleblue/20 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{u.fullName}</p>
                    <p className="font-mono text-[12px] text-charcoal">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`ss-tag ${ROLE_CLASS[u.roleSlug] || ROLE_CLASS.member}`}>{u.roleSlug}</span>
                  </td>
                  <td className="px-5 py-3 capitalize text-charcoal">{u.plan}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="ss-btn-secondary py-1.5 px-3" onClick={() => setEditing(u)}>{t('common.edit')}</button>
                      <button
                        className="ss-btn-ghost py-1.5 px-3 text-taupe disabled:opacity-40"
                        onClick={() => onDelete(u)}
                        disabled={u.id === me?.id || del.isPending}
                        title={u.id === me?.id ? t('admin.users.cannotDeleteSelf') : t('common.delete')}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <UserEditModal user={editing} roles={data?.roles || []} plans={data?.plans || []} onClose={() => setEditing(null)} />
      )}
    </div>
  );
};

export default AdminUsersPage;

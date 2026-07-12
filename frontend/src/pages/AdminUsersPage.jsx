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
  'super-admin': 'bg-indigo-50 text-indigo-600',
  reviewer: 'bg-emerald-50 text-emerald-600',
  member: 'bg-slate-100 text-slate-600',
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
        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-card">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.colUser')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.colRole')}</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.colPlan')}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{u.fullName}</p>
                    <p className="font-mono text-[12px] text-slate-500">{u.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`ss-tag ${ROLE_CLASS[u.roleSlug] || ROLE_CLASS.member}`}>{u.roleSlug}</span>
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-500">{u.plan}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="ss-btn-secondary py-1.5 px-3" onClick={() => setEditing(u)}>{t('common.edit')}</button>
                      <button
                        className="ss-btn-ghost py-1.5 px-3 text-red-500 disabled:opacity-40"
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

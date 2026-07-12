import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { PlanForm } from '../components/admin/PlanForm.jsx';
import { useConfirm } from '../components/common/ConfirmProvider.jsx';
import { useAdminPlans, useDeletePlan } from '../hooks/useAdmin.js';

const cap = (n) => (n < 0 ? '∞' : n);

const AdminPlansPage = () => {
  const { t } = useTranslation();
  const { data: plans, isLoading, error } = useAdminPlans();
  const del = useDeletePlan();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null);

  const money = (n) => (n > 0 ? `₹${Number(n).toLocaleString('en-IN')}` : t('common.free'));

  const onDelete = async (p) => {
    const ok = await confirm({
      title: t('admin.plans.deleteTitle', { name: p.name }),
      message: t('admin.plans.deleteMessage'),
      confirmLabel: t('admin.plans.deleteConfirm'),
      tone: 'danger',
    });
    if (ok) del.mutate(p._id);
  };

  return (
    <div>
      <PageHeader
        eyebrow={t('admin.plans.eyebrow')}
        title={t('admin.plans.title')}
        subtitle={t('admin.plans.subtitle')}
        actions={<button className="ss-btn-primary" onClick={() => setEditing('new')}><Icon name="plus" className="h-4 w-4" /> {t('admin.plans.addPlan')}</button>}
      />
      <ErrorBanner error={error || del.error} />

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-card">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.plans.colPlan')}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.plans.colPrice')}</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.plans.colPolicies')}</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.plans.colChecks')}</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.plans.colDisputes')}</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.plans.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(plans || []).map((p) => (
                <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{p.name}</span>
                      {p.isDefault && <span className="ss-tag text-indigo-600 bg-indigo-50">{t('common.default')}</span>}
                      {!p.enabled && <span className="ss-tag">{t('common.disabled')}</span>}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">{p.slug}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono tabular-nums text-slate-900">{money(p.price)}</td>
                  <td className="px-5 py-3 text-center font-mono tabular-nums text-slate-500">{cap(p.limits?.policies)}</td>
                  <td className="px-5 py-3 text-center font-mono tabular-nums text-slate-500">{cap(p.limits?.eligibilityChecks)}</td>
                  <td className="px-5 py-3 text-center font-mono tabular-nums text-slate-500">{cap(p.limits?.disputes)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button className="ss-btn-secondary py-1.5 px-3" onClick={() => setEditing(p)}>{t('common.edit')}</button>
                      <button className="ss-btn-ghost py-1.5 px-3 text-red-500 disabled:opacity-40" onClick={() => onDelete(p)} disabled={p.isDefault || del.isPending}>
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

      {editing && <PlanForm plan={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
};

export default AdminPlansPage;

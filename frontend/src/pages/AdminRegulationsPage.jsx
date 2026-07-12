import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { RegulationForm } from '../components/admin/RegulationForm.jsx';
import { RegulationViewModal } from '../components/admin/RegulationViewModal.jsx';
import { RegulationUpdatesModal } from '../components/admin/RegulationUpdatesModal.jsx';
import { useConfirm } from '../components/common/ConfirmProvider.jsx';
import { useAdminRegulations, useDeleteRegulation } from '../hooks/useAdmin.js';

const AdminRegulationsPage = () => {
  const { t } = useTranslation();
  const { data: regulations, isLoading, error } = useAdminRegulations();
  const del = useDeleteRegulation();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [showUpdates, setShowUpdates] = useState(false);

  const onDelete = async (r) => {
    const ok = await confirm({
      title: t('admin.regulations.deleteTitle'),
      message: t('admin.regulations.deleteMessage', { title: r.title }),
      confirmLabel: t('common.delete'),
      tone: 'danger',
    });
    if (ok) del.mutate(r.id);
  };

  return (
    <div>
      <PageHeader
        eyebrow={t('admin.regulations.eyebrow')}
        title={t('admin.regulations.title')}
        subtitle={t('admin.regulations.subtitle')}
        actions={
          <>
            <button className="ss-btn-secondary" onClick={() => setShowUpdates(true)}>
              <Icon name="refresh" className="h-4 w-4" /> {t('admin.regulations.syncIrdai')}
            </button>
            <button className="ss-btn-primary" onClick={() => setEditing('new')}>
              <Icon name="plus" className="h-4 w-4" /> {t('admin.regulations.addProvision')}
            </button>
          </>
        }
      />
      <ErrorBanner error={error || del.error} />

      {isLoading ? (
        <Spinner />
      ) : regulations?.length ? (
        <div className="space-y-3 mt-2">
          {regulations.map((r) => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-900">{r.title}</p>
                    <span className={`ss-tag ${r.category === 'info' ? '' : 'bg-indigo-50 text-indigo-600'}`}>{r.category === 'info' ? t('admin.regulations.categoryInfo') : t('admin.regulations.categoryRule')}</span>
                    {!r.enabled && <span className="ss-tag">{t('common.disabled')}</span>}
                  </div>
                  {r.ref && (
                    <p className="font-mono text-[11px] text-slate-400 mt-1">{r.ref}</p>
                  )}
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{r.text}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {(r.appliesTo || []).map((t) => (
                      <span key={t} className="font-mono text-[10.5px] text-slate-400">#{t}</span>
                    ))}
                    {r.code && <span className="font-mono text-[10.5px] text-slate-400">{t('admin.regulations.labelPrefix', { code: r.code })}</span>}
                    {r.effective && <span className="font-mono text-[10.5px] text-slate-400">{t('admin.regulations.effPrefix', { date: r.effective })}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button className="ss-btn-ghost py-1.5 px-3" onClick={() => setViewing(r)} title={t('admin.regulations.viewFull')}>
                    <Icon name="eye" className="h-4 w-4" /> {t('common.view')}
                  </button>
                  <button className="ss-btn-secondary py-1.5 px-3" onClick={() => setEditing(r)}>{t('common.edit')}</button>
                  <button className="ss-btn-ghost py-1.5 px-3 text-red-500" onClick={() => onDelete(r)} disabled={del.isPending}>
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title={t('admin.regulations.emptyTitle')}
          subtitle={t('admin.regulations.emptySubtitle')}
          action={<button className="ss-btn-primary" onClick={() => setEditing('new')}>{t('admin.regulations.addProvisionShort')}</button>}
        />
      )}

      {viewing && <RegulationViewModal regulation={viewing} onClose={() => setViewing(null)} />}

      {editing && (
        <RegulationForm regulation={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      )}

      {showUpdates && <RegulationUpdatesModal onClose={() => setShowUpdates(false)} />}
    </div>
  );
};

export default AdminRegulationsPage;

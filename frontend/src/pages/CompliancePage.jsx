import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { Disclaimer } from '../components/common/Disclaimer.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { RegulationViewModal } from '../components/admin/RegulationViewModal.jsx';
import { TranslationEditModal } from '../components/compliance/TranslationEditModal.jsx';
import { useComplianceRegulations } from '../hooks/useCompliance.js';
import { currentUserAtom } from '../store/authAtom.js';

const CompliancePage = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'en';
  const user = useAtomValue(currentUserAtom);
  const isSuperAdmin = user?.roleSlug === 'super-admin';

  const { data, isLoading } = useComplianceRegulations();
  const regulations = data?.regulations || [];
  const fw = data?.framework;
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);

  const isTranslated = lang !== 'en';
  const showMachineNote = isTranslated && (fw?.machineTranslated || regulations.some((r) => r.machineTranslated));
  const catLabel = (c) => (c === 'info' ? t('compliance.categoryInfo') : t('compliance.categoryRule'));

  return (
    <div>
      <PageHeader eyebrow={t('compliance.eyebrow')} title={t('compliance.title')} subtitle={t('compliance.subtitle')} />

      {showMachineNote && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-2.5">
          <Icon name="globe" className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm text-slate-500">{t('compliance.machineNote')}</p>
        </div>
      )}

      {fw && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 flex flex-wrap items-center gap-x-6 gap-y-1 shadow-card">
          <span className="ss-eyebrow">{t('compliance.framework')}</span>
          <span className="text-sm text-slate-900">{fw.label}</span>
          {fw.circularRef && <span className="font-mono text-[11px] text-slate-400">{fw.circularRef}</span>}
          {fw.lastReviewed && <span className="font-mono text-[11px] text-slate-400">{t('compliance.reviewed', { date: fw.lastReviewed })}</span>}
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : regulations.length ? (
        <div className="space-y-3">
          {regulations.map((r) => (
            <div key={r.id || r.title} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-start justify-between gap-4 shadow-card">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-slate-900">{r.title}</p>
                  <span className={`ss-tag ${r.category === 'info' ? '' : 'bg-indigo-50 text-indigo-600'}`}>{catLabel(r.category)}</span>
                </div>
                {r.ref && <p className="font-mono text-[11px] text-slate-400 mt-1">{r.ref}</p>}
                {r.text && <p className="text-sm text-slate-500 mt-1.5 leading-relaxed line-clamp-2">{r.text}</p>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {(r.appliesTo || []).map((tag) => (
                    <span key={tag} className="font-mono text-[10.5px] text-slate-400">#{tag}</span>
                  ))}
                  {r.source && (
                    <a className="font-mono text-[10.5px] text-indigo-600 hover:text-indigo-700 underline break-all" href={r.source} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                      {t('common.source')} ↗
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button className="ss-btn-secondary py-1.5 px-3" onClick={() => setViewing(r)}>{t('common.view')}</button>
                {isSuperAdmin && isTranslated && (
                  <button className="ss-btn-ghost py-1.5 px-3 text-[12px]" onClick={() => setEditing(r)}>
                    <Icon name="pen" className="h-3.5 w-3.5" /> {t('compliance.editTranslation')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title={t('compliance.noProvisions')} subtitle={t('compliance.noProvisionsSub')} />
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-6 shadow-card">
        <Disclaimer text={fw?.disclaimer} />
      </div>

      {viewing && <RegulationViewModal regulation={viewing} onClose={() => setViewing(null)} />}
      {editing && <TranslationEditModal regulation={editing} lang={lang} onClose={() => setEditing(null)} />}
    </div>
  );
};

export default CompliancePage;

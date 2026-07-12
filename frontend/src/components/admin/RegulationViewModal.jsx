import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal.jsx';

const Row = ({ label, children }) => (
  <div>
    <p className="ss-eyebrow mb-1">{label}</p>
    {children}
  </div>
);

export const RegulationViewModal = ({ regulation, onClose }) => {
  const { t } = useTranslation();
  const r = regulation;
  return (
    <Modal
      title={r.title}
      eyebrow={t('admin.regulations.viewEyebrow')}
      onClose={onClose}
      footer={<button className="ss-btn-primary" onClick={onClose}>{t('common.close')}</button>}
    >
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`ss-tag ${r.category === 'info' ? '' : 'bg-indigo-50 text-indigo-600'}`}>{r.category === 'info' ? t('admin.regulations.categoryInfo') : t('admin.regulations.categoryRule')}</span>
          {r.enabled ? (
            <span className="ss-tag text-emerald-600 bg-emerald-50">{t('common.enabled')}</span>
          ) : (
            <span className="ss-tag">{t('common.disabled')}</span>
          )}
          {r.code && <span className="font-mono text-[11px] text-slate-400">{t('admin.regulations.labelPrefix', { code: r.code })}</span>}
        </div>

        {r.ref && (
          <Row label={t('admin.regulations.rowReference')}>
            <p className="font-mono text-[12px] text-slate-900 break-all">{r.ref}</p>
          </Row>
        )}

        <Row label={t('admin.regulations.rowText')}>
          <p className="text-slate-500 leading-relaxed whitespace-pre-line">{r.text || '—'}</p>
        </Row>

        {(r.appliesTo || []).length > 0 && (
          <Row label={t('admin.regulations.appliesTo')}>
            <div className="flex flex-wrap gap-2">
              {r.appliesTo.map((rt) => (
                <span key={rt} className="font-mono text-[10.5px] text-slate-400">#{rt}</span>
              ))}
            </div>
          </Row>
        )}

        <div className="flex flex-wrap gap-x-8 gap-y-3">
          {r.effective && (
            <Row label={t('admin.regulations.rowEffective')}>
              <p className="font-mono text-[12px] text-slate-500">{r.effective}</p>
            </Row>
          )}
          {r.source && (
            <Row label={t('admin.regulations.rowSource')}>
              <a className="text-indigo-600 hover:text-indigo-700 underline break-all" href={r.source} target="_blank" rel="noreferrer">
                {t('admin.regulations.openCircular')}
              </a>
            </Row>
          )}
        </div>
      </div>
    </Modal>
  );
};

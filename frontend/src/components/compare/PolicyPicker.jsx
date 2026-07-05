import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const MAX_SELECT = 3;

export const PolicyPicker = ({ policies, selected, onToggle, uploading, onUpload, onDelete }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') return;
    if (file.size > 20 * 1024 * 1024) return;
    onUpload(file);
  };

  return (
    <div className="space-y-4">
      {policies?.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {policies.map((p) => {
            const isSelected = selected.includes(p._id);
            const disabled = !isSelected && selected.length >= MAX_SELECT;
            return (
              <div
                key={p._id}
                className={`ss-card text-left p-4 transition-all duration-200 relative ${
                  isSelected
                    ? 'ring-2 ring-softgreen border-softgreen/60 bg-softgreen/5'
                    : disabled
                    ? 'opacity-50 cursor-not-allowed border-gray/40'
                    : 'border-gray/40 hover:border-charcoal/60 cursor-pointer'
                }`}
                onClick={() => !disabled && onToggle(p._id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="ss-display text-sm text-ink truncate">{p.planName}</p>
                    <p className="text-xs text-charcoal mt-0.5 truncate">{p.insurer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-softgreen text-white">
                        <Icon name="check" className="h-3 w-3" />
                      </span>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(p); }}
                        className="grid h-6 w-6 place-items-center rounded-lg text-charcoal/40 hover:text-taupe hover:bg-paleblue/50 transition-colors"
                        title={t('common.delete')}
                      >
                        <Icon name="trash" className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div>
                    <p className="ss-eyebrow">{t('policies.sumInsured')}</p>
                    <p className="font-mono text-xs text-ink tabular-nums mt-0.5">{money(p.sumInsured)}</p>
                  </div>
                  <div>
                    <p className="ss-eyebrow">{t('policies.rules')}</p>
                    <p className="font-mono text-xs text-ink tabular-nums mt-0.5">{(p.rules || []).length}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Link
                      to={`/policies/${p._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-eyebrow text-charcoal/50 hover:text-taupe transition-colors"
                      title={t('common.view')}
                    >
                      {t('common.view')} <span className="transition-transform duration-200 hover:translate-x-0.5">→</span>
                    </Link>
                    <Link
                      to={`/policies/${p._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-eyebrow text-charcoal/50 hover:text-taupe transition-colors"
                      title={t('policyDetail.editRules')}
                    >
                      <Icon name="pen" className="h-3 w-3" /> {t('common.edit')}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-charcoal">{t('compare.noPoliciesHint')}</p>
      )}

      <div
        className={`relative ss-card border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
          dragging ? 'border-taupe bg-paleblue/40' : 'border-gray/70 hover:border-charcoal/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
      >
        {uploading && (
          <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-softgreen/15 to-transparent animate-sweep" />
        )}
        <Icon name="upload" className="h-7 w-7 mx-auto mb-2 text-charcoal/70" />
        <p className="ss-display text-sm text-ink">
          {uploading ? t('uploader.extracting') : t('compare.uploadNew')}
        </p>
        <p className="ss-eyebrow mt-1 text-charcoal/70">{t('uploader.browseHint')}</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
};

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
                className={`bg-white border rounded-2xl text-left p-4 transition-all duration-200 relative ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-indigo-300 bg-indigo-50/50'
                    : disabled
                    ? 'opacity-50 cursor-not-allowed border-slate-200'
                    : 'border-slate-200 hover:border-slate-300 cursor-pointer'
                }`}
                onClick={() => !disabled && onToggle(p._id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{p.planName}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{p.insurer}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isSelected && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-indigo-600 text-white">
                        <Icon name="check" className="h-3 w-3" />
                      </span>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(p); }}
                        className="grid h-6 w-6 place-items-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
                    <p className="font-mono text-xs text-slate-900 tabular-nums mt-0.5">{money(p.sumInsured)}</p>
                  </div>
                  <div>
                    <p className="ss-eyebrow">{t('policies.rules')}</p>
                    <p className="font-mono text-xs text-slate-900 tabular-nums mt-0.5">{(p.rules || []).length}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Link
                      to={`/policies/${p._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-indigo-600 transition-colors"
                      title={t('common.view')}
                    >
                      {t('common.view')} <span className="transition-transform duration-200 hover:translate-x-0.5">→</span>
                    </Link>
                    <Link
                      to={`/policies/${p._id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-indigo-600 transition-colors"
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
        <p className="text-sm text-slate-500">{t('compare.noPoliciesHint')}</p>
      )}

      <div
        className={`relative bg-white border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 overflow-hidden ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files?.[0]); }}
      >
        {uploading && (
          <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-100/50 to-transparent animate-sweep" />
        )}
        <Icon name="upload" className="h-7 w-7 mx-auto mb-2 text-slate-300" />
        <p className="text-sm font-semibold text-slate-900">
          {uploading ? t('uploader.extracting') : t('compare.uploadNew')}
        </p>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-1">{t('uploader.browseHint')}</p>
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

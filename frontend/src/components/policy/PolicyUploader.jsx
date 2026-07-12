import { useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

export const PolicyUploader = ({ onUpload, uploading }) => {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const handle = (file) => {
    setError('');
    if (!file) return;
    if (file.type !== 'application/pdf') return setError(t('uploader.errorNotPdf'));
    if (file.size > 20 * 1024 * 1024) return setError(t('uploader.errorTooLarge'));
    onUpload(file);
  };

  return (
    <div>
      <div
        className={`relative bg-white border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 overflow-hidden ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handle(e.dataTransfer.files?.[0]);
        }}
      >
        {uploading && (
          <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-indigo-100/50 to-transparent animate-sweep" />
        )}
        <Icon name="upload" className="h-9 w-9 mx-auto mb-3 text-slate-300" />
        <p className="text-lg font-semibold text-slate-900">
          {uploading ? t('uploader.extracting') : t('uploader.dropHere')}
        </p>
        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-2">{t('uploader.browseHint')}</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <Icon name="lock" className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
        <span>
          <Trans i18nKey="uploader.privacyNote" components={{ strong: <span className="text-slate-900 font-medium" /> }} />
        </span>
      </div>
    </div>
  );
};

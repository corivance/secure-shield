import { useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

// Drag & drop / select a policy PDF. Validates size + type client-side; the
// server re-validates (magic bytes, MIME). Upload itself is handled by the page hook.
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
        className={`relative ss-card border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 overflow-hidden ${
          dragging ? 'border-taupe bg-paleblue/40' : 'border-gray/70'
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
          <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-softgreen/15 to-transparent animate-sweep" />
        )}
        <Icon name="upload" className="h-9 w-9 mx-auto mb-3 text-charcoal/70" />
        <p className="ss-display text-lg text-ink">
          {uploading ? t('uploader.extracting') : t('uploader.dropHere')}
        </p>
        <p className="ss-eyebrow mt-2 text-charcoal/70">{t('uploader.browseHint')}</p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handle(e.target.files?.[0])}
        />
      </div>
      {error && <p className="text-taupe text-sm mt-2">{error}</p>}

      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-gray/60 bg-paleblue/15 px-4 py-3 text-sm text-charcoal">
        <Icon name="lock" className="h-4 w-4 mt-0.5 shrink-0 text-softgreen" />
        <span>
          <Trans i18nKey="uploader.privacyNote" components={{ strong: <span className="text-ink font-medium" /> }} />
        </span>
      </div>
    </div>
  );
};

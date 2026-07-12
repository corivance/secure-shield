import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

export const Modal = ({ title, eyebrow, onClose, children, footer }) => {
  const { t } = useTranslation();
  const eyebrowText = eyebrow === undefined ? t('common.edit') : eyebrow;
  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 animate-rise"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg flex flex-col max-h-[85vh] rounded-2xl shadow-modal" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-4 p-6 pb-3 shrink-0">
            <div>
              {eyebrowText && <p className="ss-eyebrow mb-1">{eyebrowText}</p>}
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            </div>
            <button className="text-slate-400 hover:text-slate-600 text-lg leading-none -mt-1" onClick={onClose} aria-label={t('common.close')}>
              ✕
            </button>
          </div>

          <div className="px-6 pb-5 overflow-y-auto flex-1">{children}</div>

          {footer && (
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0">{footer}</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

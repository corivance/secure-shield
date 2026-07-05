import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

// Generic centered modal (distinct from ConfirmProvider, which is only for
// yes/no confirmations). Rendered via a portal to <body> so its `position:fixed`
// overlay covers the whole viewport — not just the (transformed) page container.
// Sticky header + scrollable body + sticky footer keep actions visible.
export const Modal = ({ title, eyebrow, onClose, children, footer }) => {
  const { t } = useTranslation();
  const eyebrowText = eyebrow === undefined ? t('common.edit') : eyebrow;
  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 backdrop-blur-md animate-rise"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="ss-card w-full max-w-lg flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-4 p-6 pb-3 shrink-0">
            <div>
              {eyebrowText && <p className="ss-eyebrow mb-1.5">{eyebrowText}</p>}
              <h2 className="ss-display text-xl text-ink">{title}</h2>
            </div>
            <button className="text-charcoal hover:text-ink text-lg leading-none -mt-1" onClick={onClose} aria-label={t('common.close')}>
              ✕
            </button>
          </div>

          <div className="px-6 pb-5 overflow-y-auto flex-1">{children}</div>

          {footer && (
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray/50 shrink-0">{footer}</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

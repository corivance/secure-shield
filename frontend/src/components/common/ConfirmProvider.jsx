import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

// Centralized confirmation dialog. All confirmations go through `await confirm(...)`
// from this context — never window.confirm or component-specific modals.
const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx.confirm;
};

export const ConfirmProvider = ({ children }) => {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);

  // Returns a Promise<boolean> that resolves when the user confirms/cancels.
  const confirm = useCallback((options = {}) => {
    setDialog({
      title: options.title || t('confirm.title'),
      message: options.message || '',
      confirmLabel: options.confirmLabel || t('confirm.confirm'),
      cancelLabel: options.cancelLabel || t('confirm.cancel'),
      tone: options.tone || 'default',
    });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, [t]);

  const close = (result) => {
    setDialog(null);
    if (resolver.current) {
      resolver.current(result);
      resolver.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {dialog && createPortal(
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 backdrop-blur-md animate-rise"
          role="dialog"
          aria-modal="true"
          onClick={() => close(false)}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="ss-card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
              <p className="ss-eyebrow mb-2">{t('confirm.confirm')}</p>
              <h2 className="ss-display text-xl text-ink">{dialog.title}</h2>
              {dialog.message && <p className="text-sm text-charcoal mt-2 leading-relaxed">{dialog.message}</p>}
              <div className="mt-6 flex justify-end gap-2">
                <button className="ss-btn-ghost" onClick={() => close(false)}>
                  {dialog.cancelLabel}
                </button>
                <button
                  className={dialog.tone === 'danger' ? 'ss-btn bg-taupe text-white hover:bg-ink' : 'ss-btn-primary'}
                  onClick={() => close(true)}
                >
                  {dialog.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </ConfirmContext.Provider>
  );
};

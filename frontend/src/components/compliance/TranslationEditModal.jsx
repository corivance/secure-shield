import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal.jsx';
import { ErrorBanner } from '../common/ErrorBanner.jsx';
import { useSaveTranslation } from '../../hooks/useCompliance.js';

export const TranslationEditModal = ({ regulation, lang, onClose }) => {
  const { t } = useTranslation();
  const save = useSaveTranslation();
  const [title, setTitle] = useState(regulation.title || '');
  const [text, setText] = useState(regulation.text || '');
  const entityId = regulation.id || regulation.ref;

  const submit = async (e) => {
    e.preventDefault();
    await save.mutateAsync({ entityType: 'regulation', entityId, field: 'title', lang, value: title });
    await save.mutateAsync({ entityType: 'regulation', entityId, field: 'text', lang, value: text });
    onClose();
  };

  return (
    <Modal
      title={t('compliance.correctTranslation')}
      eyebrow={`${t('language.label')} · ${lang.toUpperCase()}`}
      onClose={onClose}
      footer={
        <>
          <button className="ss-btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="ss-btn-primary" onClick={submit} disabled={save.isPending}>
            {save.isPending ? t('common.saving') : t('compliance.saveTranslation')}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner error={save.error} />
        <div>
          <label className="ss-label">{t('compliance.translatedTitle')}</label>
          <input className="ss-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="ss-label">{t('compliance.translatedText')}</label>
          <textarea className="ss-input min-h-[160px]" value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </form>
    </Modal>
  );
};

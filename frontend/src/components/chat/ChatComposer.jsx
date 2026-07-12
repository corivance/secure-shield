import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

export const ChatComposer = ({ onSend, sending }) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imageName, setImageName] = useState('');

  const pickImage = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      setImageBase64(result.split(',')[1] || '');
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    onSend({ question: question.trim(), imageBase64: imageBase64 || undefined });
    setQuestion('');
    setImageBase64('');
    setImageName('');
  };

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl p-3 flex items-end gap-2 shadow-card">
      <label className="ss-btn-secondary cursor-pointer py-2 px-3" title={t('chat.attachTitle')}>
        <Icon name="paperclip" className="h-4 w-4" />
        <input type="file" accept="image/*" className="hidden" onChange={(e) => pickImage(e.target.files?.[0])} />
      </label>
      <div className="flex-1">
        {imageName && <p className="text-[11px] text-slate-400 mb-1">{t('chat.attached', { name: imageName })}</p>}
        <textarea
          className="ss-input resize-none"
          rows={1}
          placeholder={t('chat.placeholder')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
        />
      </div>
      <button type="submit" className="ss-btn-primary py-2.5" disabled={sending || !question.trim()}>
        {t('chat.send')}
      </button>
    </form>
  );
}

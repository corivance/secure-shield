import { useTranslation } from 'react-i18next';

const SOURCE_KEY = { faq: 'faq', llm: 'llm', ocr: 'ocr' };

export const ChatThread = ({ messages = [], pending }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      {messages.map((m, i) => (
        <div key={m._id || i} className="space-y-2">
          <div className="flex justify-end">
            <div className="bg-taupe text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] text-sm leading-relaxed">
              {m.question}
            </div>
          </div>
          <div className="flex justify-start">
            <div className="ss-panel px-4 py-2.5 max-w-[80%] text-sm text-charcoal">
              <p className="whitespace-pre-line leading-relaxed">{m.answer}</p>
              {m.source && (
                <p className="ss-eyebrow mt-2 text-charcoal/50">{t('chat.via', { source: SOURCE_KEY[m.source] ? t(`chat.source.${m.source}`) : m.source })}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {pending && (
        <div className="flex justify-start">
          <div className="ss-panel px-4 py-2.5 text-sm text-charcoal font-mono text-[11px] uppercase tracking-eyebrow">
            {t('chat.thinking')}
          </div>
        </div>
      )}
    </div>
  );
};

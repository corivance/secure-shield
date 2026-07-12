import { useTranslation } from 'react-i18next';

const SOURCE_KEY = { faq: 'faq', llm: 'llm', ocr: 'ocr' };

export const ChatThread = ({ messages = [], pending }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      {messages.map((m, i) => (
        <div key={m._id || i} className="space-y-2">
          <div className="flex justify-end">
            <div className="bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] text-sm leading-relaxed">
              {m.question}
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 max-w-[80%] text-sm text-slate-600">
              <p className="whitespace-pre-line leading-relaxed">{m.answer}</p>
              {m.source && (
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-2">{t('chat.via', { source: SOURCE_KEY[m.source] ? t(`chat.source.${m.source}`) : m.source })}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {pending && (
        <div className="flex justify-start">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-400 text-[11px] font-medium uppercase tracking-wider">
            {t('chat.thinking')}
          </div>
        </div>
      )}
    </div>
  );
};

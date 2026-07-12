import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../i18n/languages.js';
import { setLanguage } from '../../i18n/index.js';
import { Icon } from './Icon.jsx';

export const LanguageSwitcher = ({ variant = 'default', align = 'right' }) => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find((l) => l.code === (i18n.resolvedLanguage || i18n.language)) || LANGUAGES[0];

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const choose = (code) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg text-sm transition-colors ${
          variant === 'bare'
            ? 'px-3 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            : 'px-2.5 py-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50'
        }`}
        aria-label="Change language"
      >
        <Icon name="globe" className="h-4 w-4" />
        <span className="font-medium">{current.native}</span>
      </button>

      {open && (
        <ul
          className={`absolute z-50 mt-2 w-48 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-1 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {LANGUAGES.map((l) => {
            const active = l.code === current.code;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  onClick={() => choose(l.code)}
                  className={`w-full flex items-center justify-between gap-3 px-3.5 py-2 text-sm text-left transition-colors ${
                    active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="font-medium">{l.native}</span>
                  <span className="text-[11px] text-slate-400">{l.label}</span>
                  {active && <Icon name="check" className="h-3.5 w-3.5 text-indigo-600 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

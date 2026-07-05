import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANG_CODES, STORAGE_KEY } from './languages.js';
import en from './en.js';
import hi from './hi.js';
import ml from './ml.js';
import ta from './ta.js';
import te from './te.js';
import kn from './kn.js';
import bn from './bn.js';
import mr from './mr.js';
import gu from './gu.js';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ml: { translation: ml },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  bn: { translation: bn },
  mr: { translation: mr },
  gu: { translation: gu },
};

const readStored = () => {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && LANG_CODES.includes(v) ? v : 'en';
  } catch {
    return 'en';
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: readStored(),
  fallbackLng: 'en', // any untranslated key falls back to English — never blank
  supportedLngs: LANG_CODES,
  interpolation: { escapeValue: false },
});

// Change language and remember the choice across sessions.
export const setLanguage = (code) => {
  i18n.changeLanguage(code);
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    /* storage unavailable — language still changes for this session */
  }
};

export default i18n;

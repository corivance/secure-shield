// Supported UI/content languages (mirrors the frontend list). Used to give the
// translator a clear target-language name.
export const LANG_NAMES = {
  en: 'English',
  hi: 'Hindi',
  ml: 'Malayalam',
  ta: 'Tamil',
  te: 'Telugu',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  gu: 'Gujarati',
};

export const SUPPORTED_LANGS = Object.keys(LANG_NAMES);
export const isSupportedLang = (code) => SUPPORTED_LANGS.includes(code);

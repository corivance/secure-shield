import { useTranslation } from 'react-i18next';
import { COMPLIANCE } from '../../constants/compliance.js';

// `text` lets callers pass a translated disclaimer (e.g. the compliance page);
// without it, falls back to the static English copy.
export const Disclaimer = ({ className = '', text }) => {
  const { t } = useTranslation();
  return (
    <p className={`flex items-start gap-2 text-[11px] leading-relaxed text-charcoal/70 ${className}`}>
      <span className="font-mono uppercase tracking-eyebrow shrink-0 mt-px">{t('compliance.note')}</span>
      <span>{text || COMPLIANCE.disclaimer}</span>
    </p>
  );
};

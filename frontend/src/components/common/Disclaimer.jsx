import { useTranslation } from 'react-i18next';
import { COMPLIANCE } from '../../constants/compliance.js';

export const Disclaimer = ({ className = '', text }) => {
  const { t } = useTranslation();
  return (
    <p className={`flex items-start gap-2 text-[11px] leading-relaxed text-slate-400 ${className}`}>
      <span className="font-medium uppercase tracking-wider shrink-0 mt-px">{t('compliance.note')}</span>
      <span>{text || COMPLIANCE.disclaimer}</span>
    </p>
  );
};

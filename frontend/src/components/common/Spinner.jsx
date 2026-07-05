import { useTranslation } from 'react-i18next';

export const Spinner = ({ label }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 text-charcoal text-sm py-10 justify-center">
      <span className="h-4 w-4 rounded-full border-2 border-gray/60 border-t-taupe animate-spin" />
      <span className="font-mono text-[11px] uppercase tracking-eyebrow">{label ?? t('common.loading')}</span>
    </div>
  );
};

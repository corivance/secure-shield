import { useTranslation } from 'react-i18next';

export const Spinner = ({ label }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-3 text-slate-400 text-sm py-10 justify-center">
      <span className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
      <span className="text-xs font-medium uppercase tracking-wider">{label ?? t('common.loading')}</span>
    </div>
  );
};

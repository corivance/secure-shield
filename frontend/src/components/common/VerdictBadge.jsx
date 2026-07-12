import { useTranslation } from 'react-i18next';
import { VERDICT_META } from '../../constants/navigation.js';
import { Icon } from './Icon.jsx';

const CLASS = {
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  partial: 'bg-amber-50 text-amber-700 border border-amber-200',
  denied: 'bg-red-50 text-red-700 border border-red-200',
};

export const VerdictBadge = ({ verdict }) => {
  const { t } = useTranslation();
  const meta = VERDICT_META[verdict] || VERDICT_META.partial;
  const key = VERDICT_META[verdict] ? verdict : 'partial';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
        CLASS[verdict] || CLASS.partial
      }`}
    >
      <Icon name={meta.icon} className="h-3.5 w-3.5" />
      {t(`verdict.${key}`)}
    </span>
  );
};

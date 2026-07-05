import { useTranslation } from 'react-i18next';
import { VERDICT_META } from '../../constants/navigation.js';
import { Icon } from './Icon.jsx';

const CLASS = {
  approved: 'bg-softgreen/15 text-softgreen border-softgreen/40',
  partial: 'bg-beige/25 text-taupe border-beige/50',
  denied: 'bg-taupe/10 text-taupe border-taupe/40',
};

export const VerdictBadge = ({ verdict }) => {
  const { t } = useTranslation();
  const meta = VERDICT_META[verdict] || VERDICT_META.partial;
  const key = VERDICT_META[verdict] ? verdict : 'partial';
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${
        CLASS[verdict] || CLASS.partial
      }`}
    >
      <Icon name={meta.icon} className="h-3.5 w-3.5" />
      {t(`verdict.${key}`)}
    </span>
  );
};

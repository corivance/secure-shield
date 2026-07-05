import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

export const PrecedentList = ({ precedents = [] }) => {
  const { t } = useTranslation();
  if (!precedents.length) return null;
  return (
    <div className="ss-card p-6">
      <p className="ss-eyebrow mb-4 flex items-center gap-2"><Icon name="book" className="h-3.5 w-3.5" /> {t('disputes.precedents')}</p>
      <ul className="space-y-4">
        {precedents.map((p, i) => (
          <li key={i} className="border-l-2 border-beige pl-4">
            <p className="text-sm font-medium text-ink">{p.citation}</p>
            <p className="ss-eyebrow mt-1 text-charcoal/70">{p.forum} · {p.year}</p>
            <p className="text-sm text-charcoal mt-1.5 leading-relaxed">{p.holding}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

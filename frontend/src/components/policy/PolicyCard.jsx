import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Icon } from '../common/Icon.jsx';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const PolicyCard = ({ policy, onDelete }) => {
  const { t } = useTranslation();
  return (
    <div className="ss-card ss-interactive group p-5 flex flex-col h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/policies/${policy._id}`} className="ss-display text-[18px] text-ink hover:text-taupe truncate block">
            {policy.planName}
          </Link>
          <p className="text-sm text-charcoal mt-0.5 truncate">{policy.insurer}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {policy.frozen && (
            <span className="ss-tag"><Icon name="lock" className="h-3 w-3" /> {t('policies.frozen')}</span>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(policy)}
              className="grid h-7 w-7 place-items-center rounded-lg text-charcoal/50 hover:text-taupe hover:bg-paleblue/50 transition-colors"
              title={t('policies.deletePolicy')}
              aria-label={t('policies.deletePolicy')}
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="ss-rule my-4" />

      <div className="flex items-center justify-between mt-auto">
        <div>
          <p className="ss-eyebrow">{t('policies.sumInsured')}</p>
          <p className="font-mono text-sm text-ink tabular-nums mt-1">{money(policy.sumInsured)}</p>
        </div>
        <div>
          <p className="ss-eyebrow">{t('policies.rules')}</p>
          <p className="font-mono text-sm text-ink tabular-nums mt-1">{(policy.rules || []).length}</p>
        </div>
        <Link
          to={`/policies/${policy._id}`}
          className="self-end inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-eyebrow text-taupe hover:text-ink"
        >
          {t('common.view')} <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
};

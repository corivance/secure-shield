import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Icon } from '../common/Icon.jsx';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const PolicyCard = ({ policy, onDelete }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col h-full hover:border-slate-300 hover:shadow-soft transition-all duration-200 group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link to={`/policies/${policy._id}`} className="text-base font-semibold text-slate-900 hover:text-indigo-600 truncate block">
            {policy.planName}
          </Link>
          <p className="text-sm text-slate-500 mt-0.5 truncate">{policy.insurer}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {policy.frozen && (
            <span className="ss-tag"><Icon name="lock" className="h-3 w-3" /> {t('policies.frozen')}</span>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(policy)}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
          <p className="font-mono text-sm text-slate-900 tabular-nums mt-1">{money(policy.sumInsured)}</p>
        </div>
        <div>
          <p className="ss-eyebrow">{t('policies.rules')}</p>
          <p className="font-mono text-sm text-slate-900 tabular-nums mt-1">{(policy.rules || []).length}</p>
        </div>
        <Link
          to={`/policies/${policy._id}`}
          className="self-end inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
        >
          {t('common.view')} <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </Link>
      </div>
    </div>
  );
};

import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { ApiKeyCard } from '../components/admin/ApiKeyCard.jsx';
import { useApiKeys, useUpdateApiKey } from '../hooks/useAdmin.js';

const LLM_PROVIDERS = new Set(['cerebras', 'groq', 'openrouter']);

const Stat = ({ value, label, accent = 'text-slate-900' }) => (
  <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-center shadow-card">
    <p className={`text-2xl font-semibold leading-none ${accent}`}>{value}</p>
    <p className="ss-eyebrow mt-1.5">{label}</p>
  </div>
);

const Section = ({ title, hint, items }) => {
  if (!items.length) return null;
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <p className="ss-eyebrow">{title}</p>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      <div className="space-y-3">
        {items.map((k) => (
          <ApiKeyCard key={k.keyName} apiKey={k} useUpdate={useUpdateApiKey} />
        ))}
      </div>
    </section>
  );
};

const AdminApiKeysPage = () => {
  const { t } = useTranslation();
  const { data: keys, isLoading, error } = useApiKeys();
  const list = keys || [];

  const configured = list.filter((k) => k.isSet).length;
  const active = list.filter((k) => k.isSet && k.enabled).length;
  const llm = list.filter((k) => LLM_PROVIDERS.has(k.provider));
  const optional = list.filter((k) => !LLM_PROVIDERS.has(k.provider));

  return (
    <div>
      <PageHeader
        eyebrow={t('admin.apiKeys.eyebrow')}
        title={t('admin.apiKeys.title')}
        subtitle={t('admin.apiKeys.subtitle')}
      />
      <ErrorBanner error={error} />

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-7">
          <div className="grid grid-cols-3 gap-3">
            <Stat value={list.length} label={t('admin.apiKeys.statProviders')} />
            <Stat value={configured} label={t('admin.apiKeys.statConfigured')} accent="text-slate-600" />
            <Stat value={active} label={t('admin.apiKeys.statActive')} accent="text-emerald-600" />
          </div>

          <div className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-card">
            <Icon name="lock" className="h-4 w-4 mt-0.5 shrink-0 text-slate-500" />
            <p className="text-sm text-slate-500 leading-relaxed">
              {t('admin.apiKeys.infoBefore')} <strong className="text-slate-900">{t('admin.apiKeys.infoStrong')}</strong> {t('admin.apiKeys.infoAfter')}
            </p>
          </div>

          <Section title={t('admin.apiKeys.llmTitle')} hint={t('admin.apiKeys.llmHint')} items={llm} />
          <Section title={t('admin.apiKeys.optionalTitle')} hint={t('admin.apiKeys.optionalHint')} items={optional} />
        </div>
      )}
    </div>
  );
};

export default AdminApiKeysPage;

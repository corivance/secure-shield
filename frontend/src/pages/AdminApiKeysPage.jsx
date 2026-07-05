import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { ApiKeyCard } from '../components/admin/ApiKeyCard.jsx';
import { useApiKeys, useUpdateApiKey } from '../hooks/useAdmin.js';

const LLM_PROVIDERS = new Set(['cerebras', 'groq', 'openrouter']);

const Stat = ({ value, label, accent = 'text-ink' }) => (
  <div className="rounded-2xl border border-gray/60 bg-white/50 px-4 py-3 text-center">
    <p className={`ss-display text-[26px] leading-none ${accent}`}>{value}</p>
    <p className="ss-eyebrow mt-1.5 text-charcoal/70">{label}</p>
  </div>
);

const Section = ({ title, hint, items }) => {
  if (!items.length) return null;
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <p className="ss-eyebrow text-charcoal/70">{title}</p>
        {hint && <span className="text-xs text-charcoal/60">{hint}</span>}
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
            <Stat value={configured} label={t('admin.apiKeys.statConfigured')} accent="text-taupe" />
            <Stat value={active} label={t('admin.apiKeys.statActive')} accent="text-softgreen" />
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-gray/60 bg-paleblue/30 px-4 py-3">
            <Icon name="lock" className="h-4 w-4 mt-0.5 shrink-0 text-charcoal" />
            <p className="text-sm text-charcoal leading-relaxed">
              {t('admin.apiKeys.infoBefore')} <strong className="text-ink">{t('admin.apiKeys.infoStrong')}</strong> {t('admin.apiKeys.infoAfter')}
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

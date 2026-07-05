import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { PolicyPicker } from '../components/compare/PolicyPicker.jsx';
import { ComparisonResult } from '../components/compare/ComparisonResult.jsx';
import { usePolicies, useUploadPolicy, useDeletePolicy } from '../hooks/usePolicies.js';
import { useMyApiKeys } from '../hooks/useUserKeys.js';
import { useRunComparison, useComparisons, useDeleteComparison } from '../hooks/useComparison.js';
import { useConfirm } from '../components/common/ConfirmProvider.jsx';

const ComparePage = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { data: policies, isLoading: policiesLoading } = usePolicies();
  const { data: comparisons, isLoading: historyLoading } = useComparisons();
  const { data: keyStatus } = useMyApiKeys();
  const upload = useUploadPolicy();
  const delPolicy = useDeletePolicy();
  const run = useRunComparison();
  const del = useDeleteComparison();

  const llmReady = Boolean(keyStatus?.llmAvailable);
  const uploaded = upload.data?.policy;
  const ruleCount = uploaded ? (uploaded.rules || []).length : 0;
  const extractionNote = upload.data?.extraction?.note;

  const [selected, setSelected] = useState([]);
  const [result, setResult] = useState(null);

  const onDeletePolicy = async (policy) => {
    const ok = await confirm({
      title: t('policies.deleteConfirm.title', { planName: policy.planName }),
      message: t('policies.deleteConfirm.message'),
      confirmLabel: t('policies.deleteConfirm.confirmLabel'),
      tone: 'danger',
    });
    if (ok) {
      setSelected((prev) => prev.filter((id) => id !== policy._id));
      delPolicy.mutate(policy._id);
    }
  };

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const onCompare = async () => {
    if (selected.length < 2) return;
    const data = await run.mutateAsync(selected);
    setResult(data);
  };

  const onDeleteHistory = async (comp) => {
    const ok = await confirm({
      title: t('compare.deleteConfirm.title'),
      message: t('compare.deleteConfirm.message'),
      confirmLabel: t('common.delete'),
      tone: 'danger',
    });
    if (ok) del.mutate(comp._id);
  };

  if (policiesLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={t('compare.title')}
        subtitle={t('compare.subtitle')}
      />

      <div className="space-y-8">
        {/* Policy selection */}
        <section>
          <div
            className={`mb-3 flex items-start gap-2.5 rounded-xl border px-4 py-2.5 text-sm ${
              llmReady ? 'border-softgreen/40 bg-softgreen/10 text-softgreen' : 'border-beige/50 bg-beige/15 text-taupe'
            }`}
          >
            <Icon name={llmReady ? 'check' : 'alert'} className="h-4 w-4 mt-0.5 shrink-0" />
            {llmReady ? (
              <span><Trans i18nKey="policies.llmReady" components={{ strong: <strong /> }} /></span>
            ) : (
              <span><Trans i18nKey="policies.llmLimited" components={{ strong: <strong /> }} /></span>
            )}
          </div>

          <p className="ss-eyebrow mb-3">{t('compare.selectPolicies')}</p>
          <PolicyPicker
            policies={policies}
            selected={selected}
            onToggle={toggle}
            uploading={upload.isPending}
            onUpload={(file) => upload.mutate(file)}
            onDelete={onDeletePolicy}
          />
          <ErrorBanner error={upload.error || run.error} />
          <p className="text-xs text-charcoal/60 mt-2">{t('compare.editHint')}</p>
          {uploaded && !upload.isPending && (
            <div
              className={`mt-3 rounded-xl border px-4 py-2.5 text-sm ${
                ruleCount > 0 ? 'border-softgreen/40 bg-softgreen/10 text-softgreen' : 'border-beige/50 bg-beige/15 text-taupe'
              }`}
            >
              {ruleCount > 0 ? (
                <>{t('policies.extractedRules', { count: ruleCount, planName: uploaded.planName })}</>
              ) : (
                <><Trans i18nKey="policies.extractedNone" components={{ strong: <strong /> }} /> {extractionNote}</>
              )}
            </div>
          )}

          {selected.length >= 2 && !result && (
            <button
              type="button"
              onClick={onCompare}
              disabled={run.isPending}
              className="ss-btn-primary mt-4"
            >
              {run.isPending ? (
                <span className="flex items-center gap-2"><Spinner size="sm" /> {t('compare.comparing')}</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Icon name="columns" className="h-4 w-4" />
                  {t('compare.runComparison', { count: selected.length })}
                </span>
              )}
            </button>
          )}
        </section>

        {/* Result */}
        {result && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="ss-eyebrow">{t('compare.result')}</p>
              <button
                type="button"
                onClick={() => { setResult(null); setSelected([]); }}
                className="ss-btn-secondary text-xs"
              >
                {t('compare.newComparison')}
              </button>
            </div>
            <ComparisonResult comparison={result} />
          </section>
        )}

        {/* History */}
        {!result && (
          <section>
            <p className="ss-eyebrow mb-3">{t('compare.history')}</p>
            {historyLoading ? (
              <Spinner />
            ) : comparisons?.length ? (
              <div className="space-y-3">
                {comparisons.map((comp) => (
                  <div
                    key={comp._id}
                    className="ss-card ss-interactive p-4 flex items-center justify-between gap-4 cursor-pointer"
                    onClick={() => setResult(comp)}
                  >
                    <div className="min-w-0">
                      <p className="ss-display text-sm text-ink truncate">
                        {comp.policies.map((p) => p.planName).join(' vs ')}
                      </p>
                      <p className="text-xs text-charcoal mt-0.5">
                        {comp.policyCount} policies · {new Date(comp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteHistory(comp); }}
                        className="grid h-7 w-7 place-items-center rounded-lg text-charcoal/50 hover:text-taupe hover:bg-paleblue/50 transition-colors"
                        title={t('common.delete')}
                      >
                        <Icon name="trash" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('compare.emptyTitle')} subtitle={t('compare.emptySubtitle')} />
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ComparePage;

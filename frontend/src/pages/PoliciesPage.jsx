import { useTranslation, Trans } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { PolicyUploader } from '../components/policy/PolicyUploader.jsx';
import { PolicyCard } from '../components/policy/PolicyCard.jsx';
import { useConfirm } from '../components/common/ConfirmProvider.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { usePolicies, useUploadPolicy, useDeletePolicy } from '../hooks/usePolicies.js';
import { useMyApiKeys } from '../hooks/useUserKeys.js';

const PoliciesPage = () => {
  const { t } = useTranslation();
  const { data: policies, isLoading } = usePolicies();
  const { data: keyStatus } = useMyApiKeys();
  const upload = useUploadPolicy();
  const del = useDeletePolicy();
  const confirm = useConfirm();

  const llmReady = Boolean(keyStatus?.llmAvailable);
  const uploaded = upload.data?.policy;
  const ruleCount = uploaded ? (uploaded.rules || []).length : 0;
  const extractionNote = upload.data?.extraction?.note;

  const onDelete = async (policy) => {
    const ok = await confirm({
      title: t('policies.deleteConfirm.title', { planName: policy.planName }),
      message: t('policies.deleteConfirm.message'),
      confirmLabel: t('policies.deleteConfirm.confirmLabel'),
      tone: 'danger',
    });
    if (ok) del.mutate(policy._id);
  };

  return (
    <div>
      <PageHeader title={t('policies.title')} subtitle={t('policies.subtitle')} />

      {/* Pre-upload: is AI-assisted extraction available? */}
      <div
        className={`mb-4 flex items-start gap-2.5 rounded-xl border px-4 py-2.5 text-sm ${
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

      <div className="mb-6">
        <PolicyUploader onUpload={(file) => upload.mutate(file)} uploading={upload.isPending} />
        <ErrorBanner error={upload.error || del.error} />
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
      </div>

      {isLoading ? (
        <Spinner />
      ) : policies?.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {policies.map((p) => (
            <PolicyCard key={p._id} policy={p} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <EmptyState title={t('policies.empty.title')} subtitle={t('policies.empty.subtitle')} />
      )}
    </div>
  );
};

export default PoliciesPage;

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { CaseForm } from '../components/eligibility/CaseForm.jsx';
import { PipelineProgress } from '../components/eligibility/PipelineProgress.jsx';
import { VerdictResult } from '../components/eligibility/VerdictResult.jsx';
import { usePolicies } from '../hooks/usePolicies.js';
import { useRunCheck } from '../hooks/useEligibility.js';
import { useStartDispute } from '../hooks/useDisputes.js';

const CheckEligibilityPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: policies, isLoading } = usePolicies();
  const run = useRunCheck();
  const dispute = useStartDispute();

  const result = run.data;

  const onDispute = () => {
    dispute.mutate(result.check._id, { onSuccess: (d) => navigate(`/disputes?id=${d._id || d.id}`) });
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title={t('eligibility.title')} subtitle={t('eligibility.subtitle')} />

      {policies?.length ? (
        <div className="space-y-6">
          <CaseForm policies={policies} onSubmit={(form) => run.mutate(form)} submitting={run.isPending} />
          <ErrorBanner error={run.error} />
          <PipelineProgress steps={result?.steps || []} running={run.isPending} />
          {result?.check && <VerdictResult check={result.check} onDispute={onDispute} disputing={dispute.isPending} />}
        </div>
      ) : (
        <EmptyState
          title={t('eligibility.noPolicyTitle')}
          subtitle={t('eligibility.noPolicySubtitle')}
          action={<a className="ss-btn-primary" href="/policies">{t('eligibility.uploadPolicy')}</a>}
        />
      )}
    </div>
  );
};

export default CheckEligibilityPage;

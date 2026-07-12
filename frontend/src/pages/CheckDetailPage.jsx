import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { VerdictResult } from '../components/eligibility/VerdictResult.jsx';
import { useCheck } from '../hooks/useEligibility.js';
import { useStartDispute } from '../hooks/useDisputes.js';

const CheckDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: check, isLoading } = useCheck(id);
  const dispute = useStartDispute();

  if (isLoading) return <Spinner />;
  if (!check) return <p className="text-slate-500">{t('checkDetail.notFound')}</p>;

  const onDispute = () =>
    dispute.mutate(check._id, { onSuccess: (d) => navigate(`/disputes?id=${d._id || d.id}`) });

  return (
    <div>
      <PageHeader title={check.caseInput?.procedure || t('checkDetail.resultTitle')} subtitle={check.policy?.planName} />
      <VerdictResult check={check} onDispute={onDispute} disputing={dispute.isPending} />
    </div>
  );
};

export default CheckDetailPage;

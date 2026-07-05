import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { DisputePanel } from '../components/dispute/DisputePanel.jsx';
import { useDispute, useDownloadReport } from '../hooks/useDisputes.js';

const DisputesPage = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const id = params.get('id');
  const { data: dispute, isLoading } = useDispute(id, { poll: true });
  const download = useDownloadReport();

  return (
    <div>
      <PageHeader title={t('nav.disputes')} subtitle={t('disputes.subtitle')} />
      {!id ? (
        <EmptyState
          title={t('disputes.noneTitle')}
          subtitle={t('disputes.noneSubtitle')}
          action={<a className="ss-btn-primary" href="/history">{t('disputes.goToHistory')}</a>}
        />
      ) : isLoading ? (
        <Spinner label={t('disputes.loading')} />
      ) : (
        <DisputePanel dispute={dispute} onDownload={(f) => download.mutate(f)} downloading={download.isPending} />
      )}
    </div>
  );
};

export default DisputesPage;

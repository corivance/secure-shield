import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { HistoryRow } from '../components/history/HistoryRow.jsx';
import { useHistory } from '../hooks/useEligibility.js';

const HistoryPage = () => {
  const { t } = useTranslation();
  const { data: checks, isLoading } = useHistory();

  return (
    <div>
      <PageHeader title={t('history.title')} subtitle={t('history.subtitle')} />
      {isLoading ? (
        <Spinner />
      ) : checks?.length ? (
        <div className="space-y-3">
          {checks.map((c) => (
            <HistoryRow key={c._id} check={c} />
          ))}
        </div>
      ) : (
        <EmptyState title={t('history.emptyTitle')} subtitle={t('history.emptySubtitle')} />
      )}
    </div>
  );
};

export default HistoryPage;

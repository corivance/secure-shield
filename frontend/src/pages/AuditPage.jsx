import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { AuditTable } from '../components/audit/AuditTable.jsx';
import { useAuditTrail } from '../hooks/useAudit.js';

const AuditPage = () => {
  const { t } = useTranslation();
  const { data: entries, isLoading } = useAuditTrail();

  return (
    <div>
      <PageHeader title={t('nav.audit')} subtitle={t('audit.subtitle')} />
      {isLoading ? (
        <Spinner />
      ) : entries?.length ? (
        <AuditTable entries={entries} />
      ) : (
        <EmptyState title={t('audit.emptyTitle')} subtitle={t('audit.emptySubtitle')} />
      )}
    </div>
  );
};

export default AuditPage;

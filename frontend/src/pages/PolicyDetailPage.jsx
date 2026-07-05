import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Spinner } from '../components/common/Spinner.jsx';
import { RuleList } from '../components/policy/RuleList.jsx';
import { RuleEditor } from '../components/policy/RuleEditor.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { usePolicy, useUpdatePolicyRules } from '../hooks/usePolicies.js';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const PolicyDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { data: policy, isLoading } = usePolicy(id);
  const update = useUpdatePolicyRules(id);
  const [editing, setEditing] = useState(false);

  if (isLoading) return <Spinner />;
  if (!policy) return <p className="text-charcoal">{t('policyDetail.notFound')}</p>;

  const save = (data) => update.mutate(data, { onSuccess: () => setEditing(false) });

  return (
    <div>
      <PageHeader
        title={policy.planName}
        subtitle={t('policyDetail.subtitle', { insurer: policy.insurer, sumInsured: money(policy.sumInsured) })}
        actions={
          <>
            <button className="ss-btn-secondary" onClick={() => setEditing(true)}>{t('policyDetail.editRules')}</button>
            <Link className="ss-btn-primary" to="/check">{t('policyDetail.runCheck')}</Link>
          </>
        }
      />
      <div className="ss-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-ink">{t('policyDetail.frozenRules')}</h3>
          <div className="flex items-center gap-2">
            {policy.manuallyEdited && <span className="ss-tag text-taupe border-taupe/40">{t('policyDetail.edited')}</span>}
            {policy.frozen && <span className="ss-tag"><Icon name="lock" className="h-3 w-3" /> {t('policyDetail.immutable')}</span>}
          </div>
        </div>
        <RuleList rules={policy.rules} />
        {!policy.rules?.length && (
          <button className="ss-btn-secondary mt-4" onClick={() => setEditing(true)}>
            <Icon name="plus" className="h-4 w-4" /> {t('policyDetail.addRulesManually')}
          </button>
        )}
      </div>

      {editing && (
        <RuleEditor
          policy={policy}
          onClose={() => setEditing(false)}
          onSave={save}
          busy={update.isPending}
          error={update.error}
        />
      )}
    </div>
  );
};

export default PolicyDetailPage;

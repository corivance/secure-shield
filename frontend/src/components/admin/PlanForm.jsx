import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal.jsx';
import { ErrorBanner } from '../common/ErrorBanner.jsx';
import { useCreatePlan, useUpdatePlan } from '../../hooks/useAdmin.js';

const blank = {
  slug: '', name: '', description: '', price: 0, order: 0, enabled: true, isDefault: false,
  limits: { policies: -1, eligibilityChecks: -1, disputes: -1 },
};

const LimitField = ({ label, value, onChange }) => {
  const { t } = useTranslation();
  return (
    <div>
      <label className="ss-label">{label}</label>
      <input className="ss-input" type="number" value={value} onChange={onChange} />
      <p className="text-[11px] text-slate-400 mt-1">{t('admin.plans.unlimitedHint')}</p>
    </div>
  );
};

export const PlanForm = ({ plan, onClose }) => {
  const { t } = useTranslation();
  const isEdit = Boolean(plan?.id || plan?._id);
  const create = useCreatePlan();
  const update = useUpdatePlan();
  const busy = create.isPending || update.isPending;
  const error = create.error || update.error;

  const [form, setForm] = useState(plan ? { ...blank, ...plan, limits: { ...blank.limits, ...(plan.limits || {}) } } : blank);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setLimit = (k) => (e) => setForm((f) => ({ ...f, limits: { ...f.limits, [k]: e.target.value } }));

  const submit = (e) => {
    e.preventDefault();
    const data = {
      slug: form.slug, name: form.name, description: form.description,
      price: Number(form.price) || 0, order: Number(form.order) || 0,
      enabled: form.enabled, isDefault: form.isDefault,
      limits: {
        policies: Number(form.limits.policies),
        eligibilityChecks: Number(form.limits.eligibilityChecks),
        disputes: Number(form.limits.disputes),
      },
    };
    if (isEdit) update.mutate({ id: plan.id || plan._id, data }, { onSuccess: onClose });
    else create.mutate(data, { onSuccess: onClose });
  };

  return (
    <Modal
      title={isEdit ? form.name || t('admin.plans.plan') : t('admin.plans.newPlan')}
      eyebrow={isEdit ? t('admin.plans.editPlan') : t('admin.plans.addPlan')}
      onClose={onClose}
      footer={
        <>
          <button className="ss-btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="ss-btn-primary" onClick={submit} disabled={busy}>
            {busy ? t('common.saving') : isEdit ? t('common.saveChanges') : t('admin.plans.createPlan')}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner error={error} />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="ss-label">{t('admin.plans.slug')}</label>
            <input className="ss-input" value={form.slug} onChange={set('slug')} placeholder="pro" required disabled={isEdit} />
          </div>
          <div>
            <label className="ss-label">{t('admin.plans.name')}</label>
            <input className="ss-input" value={form.name} onChange={set('name')} placeholder="Pro" required />
          </div>
        </div>
        <div>
          <label className="ss-label">{t('admin.plans.description')}</label>
          <input className="ss-input" value={form.description} onChange={set('description')} />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="ss-label">{t('admin.plans.price')}</label>
            <input className="ss-input" type="number" min="0" value={form.price} onChange={set('price')} />
          </div>
          <div>
            <label className="ss-label">{t('admin.plans.displayOrder')}</label>
            <input className="ss-input" type="number" value={form.order} onChange={set('order')} />
          </div>
        </div>

        <div>
          <p className="ss-eyebrow mb-2">{t('admin.plans.limits')}</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <LimitField label={t('admin.plans.limitPolicies')} value={form.limits.policies} onChange={setLimit('policies')} />
            <LimitField label={t('admin.plans.limitChecks')} value={form.limits.eligibilityChecks} onChange={setLimit('eligibilityChecks')} />
            <LimitField label={t('admin.plans.limitDisputes')} value={form.limits.disputes} onChange={setLimit('disputes')} />
          </div>
        </div>

        <div className="flex flex-wrap gap-5">
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            {t('admin.plans.enabled')}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            {t('admin.plans.defaultSignups')}
          </label>
        </div>
      </form>
    </Modal>
  );
};

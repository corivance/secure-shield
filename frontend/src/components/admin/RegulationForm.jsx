import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal.jsx';
import { ErrorBanner } from '../common/ErrorBanner.jsx';
import { useCreateRegulation, useUpdateRegulation } from '../../hooks/useAdmin.js';

const RULE_TYPES = ['room_rent', 'sub_limit', 'waiting_period', 'co_pay', 'deductible', 'exclusion'];

const blank = {
  title: '', text: '', code: '', ref: '', appliesTo: [], category: 'rule', effective: '', source: '', enabled: true,
};

export const RegulationForm = ({ regulation, onClose }) => {
  const { t } = useTranslation();
  const isEdit = Boolean(regulation?.id);
  const create = useCreateRegulation();
  const update = useUpdateRegulation();
  const busy = create.isPending || update.isPending;
  const error = create.error || update.error;

  const [form, setForm] = useState(regulation ? { ...blank, ...regulation } : blank);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleApplies = (t) =>
    setForm((f) => ({ ...f, appliesTo: f.appliesTo.includes(t) ? f.appliesTo.filter((x) => x !== t) : [...f.appliesTo, t] }));

  const submit = (e) => {
    e.preventDefault();
    const data = { ...form, appliesTo: form.category === 'info' ? [] : form.appliesTo };
    if (isEdit) update.mutate({ id: regulation.id, data }, { onSuccess: onClose });
    else create.mutate(data, { onSuccess: onClose });
  };

  return (
    <Modal title={isEdit ? form.title || t('admin.regulations.regulation') : t('admin.regulations.newRegulation')} eyebrow={isEdit ? t('admin.regulations.editProvision') : t('admin.regulations.addProvision')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner error={error} />
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="ss-label">{t('admin.regulations.fieldTitle')}</label>
            <input className="ss-input" value={form.title} onChange={set('title')} required />
          </div>
          <div>
            <label className="ss-label">{t('admin.regulations.fieldCode')}</label>
            <input className="ss-input" value={form.code} onChange={set('code')} placeholder={t('admin.regulations.fieldCodePlaceholder')} />
            <p className="text-[11px] text-charcoal/60 mt-1">{t('admin.regulations.fieldCodeHelp')}</p>
          </div>
        </div>
        <div>
          <label className="ss-label">{t('admin.regulations.fieldText')}</label>
          <textarea className="ss-input" rows={3} value={form.text} onChange={set('text')} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="ss-label">{t('admin.regulations.fieldRef')}</label>
            <input className="ss-input" value={form.ref} onChange={set('ref')} placeholder="IRDAI/HLT/CIR/MISC/…" />
            <p className="text-[11px] text-charcoal/60 mt-1">{t('admin.regulations.fieldRefHelp')}</p>
          </div>
          <div>
            <label className="ss-label">{t('admin.regulations.fieldSource')}</label>
            <input className="ss-input" value={form.source} onChange={set('source')} placeholder="https://irdai.gov.in/…" />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="ss-label">{t('admin.regulations.fieldCategory')}</label>
            <select className="ss-input" value={form.category} onChange={set('category')}>
              <option value="rule">{t('admin.regulations.optionRule')}</option>
              <option value="info">{t('admin.regulations.optionInfo')}</option>
            </select>
          </div>
          <div>
            <label className="ss-label">{t('admin.regulations.fieldEffective')}</label>
            <input className="ss-input" value={form.effective} onChange={set('effective')} placeholder="2024-04-01" />
          </div>
        </div>
        {form.category === 'rule' && (
          <div>
            <label className="ss-label">{t('admin.regulations.appliesTo')}</label>
            <div className="flex flex-wrap gap-2">
              {RULE_TYPES.map((rt) => (
                <button
                  type="button"
                  key={rt}
                  onClick={() => toggleApplies(rt)}
                  className={`ss-tag ${form.appliesTo.includes(rt) ? 'border-taupe text-taupe bg-paleblue/50' : ''}`}
                >
                  {t(`ruleTypes.${rt}`)}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-charcoal">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))} />
          {t('admin.regulations.enabledHelp')}
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="ss-btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button type="submit" className="ss-btn-primary" disabled={busy}>
            {busy ? t('common.saving') : isEdit ? t('common.saveChanges') : t('admin.regulations.createRegulation')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

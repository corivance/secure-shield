import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Modal } from '../common/Modal.jsx';
import { ErrorBanner } from '../common/ErrorBanner.jsx';
import { Icon } from '../common/Icon.jsx';

const TYPE_VALUES = ['room_rent', 'sub_limit', 'waiting_period', 'co_pay', 'deductible', 'exclusion'];

const toRow = (r) => ({
  type: r.type || 'sub_limit',
  label: r.label || '',
  clauseRef: r.clauseRef || '',
  basis: r.params?.absolutePerDay != null ? 'absolute' : 'percent',
  params: { ...(r.params || {}) },
});

const blankRow = () => ({ type: 'sub_limit', label: '', clauseRef: '', basis: 'percent', params: {} });

const serialize = (r) => {
  const params = {};
  switch (r.type) {
    case 'room_rent':
      if (r.basis === 'absolute') params.absolutePerDay = Number(r.params.absolutePerDay) || 0;
      else params.percentOfSumInsured = Number(r.params.percentOfSumInsured) || 0;
      break;
    case 'sub_limit':
      params.procedure = String(r.params.procedure || '').trim().toLowerCase();
      params.cap = Number(r.params.cap) || 0;
      break;
    case 'waiting_period':
      params.procedure = String(r.params.procedure || '').trim().toLowerCase();
      params.months = Number(r.params.months) || 0;
      break;
    case 'co_pay':
      params.percent = Number(r.params.percent) || 0;
      break;
    case 'deductible':
      params.amount = Number(r.params.amount) || 0;
      break;
    case 'exclusion':
      params.match = String(r.params.match || '').trim().toLowerCase();
      break;
    default:
      break;
  }
  return { type: r.type, label: r.label.trim() || r.type, params, clauseRef: r.clauseRef.trim() };
};

const Field = ({ label, children }) => (
  <div className="flex-1 min-w-[120px]">
    <label className="ss-label">{label}</label>
    {children}
  </div>
);

const RuleParams = ({ row, onParam, onBasis }) => {
  const { t } = useTranslation();
  const p = row.params;
  switch (row.type) {
    case 'room_rent':
      return (
        <>
          <Field label={t('ruleEditor.capBasis')}>
            <select className="ss-input" value={row.basis} onChange={(e) => onBasis(e.target.value)}>
              <option value="percent">{t('ruleEditor.percentOfSumInsured')}</option>
              <option value="absolute">{t('ruleEditor.perDay')}</option>
            </select>
          </Field>
          {row.basis === 'absolute' ? (
            <Field label={t('ruleEditor.perDay')}>
              <input className="ss-input" type="number" min="0" value={p.absolutePerDay ?? ''} onChange={onParam('absolutePerDay')} />
            </Field>
          ) : (
            <Field label={t('ruleEditor.percentOfSumInsuredPerDay')}>
              <input className="ss-input" type="number" min="0" step="0.1" value={p.percentOfSumInsured ?? ''} onChange={onParam('percentOfSumInsured')} />
            </Field>
          )}
        </>
      );
    case 'sub_limit':
      return (
        <>
          <Field label={t('ruleEditor.procedureBenefit')}>
            <input className="ss-input" value={p.procedure ?? ''} onChange={onParam('procedure')} placeholder={t('ruleEditor.placeholderCataract')} />
          </Field>
          <Field label={t('ruleEditor.cap')}>
            <input className="ss-input" type="number" min="0" value={p.cap ?? ''} onChange={onParam('cap')} />
          </Field>
        </>
      );
    case 'waiting_period':
      return (
        <>
          <Field label={t('ruleEditor.procedureCondition')}>
            <input className="ss-input" value={p.procedure ?? ''} onChange={onParam('procedure')} placeholder={t('ruleEditor.placeholderPreExisting')} />
          </Field>
          <Field label={t('ruleEditor.months')}>
            <input className="ss-input" type="number" min="0" value={p.months ?? ''} onChange={onParam('months')} />
          </Field>
        </>
      );
    case 'co_pay':
      return (
        <Field label={t('ruleEditor.coPaymentPercent')}>
          <input className="ss-input" type="number" min="0" max="100" value={p.percent ?? ''} onChange={onParam('percent')} />
        </Field>
      );
    case 'deductible':
      return (
        <Field label={t('ruleEditor.deductibleAmount')}>
          <input className="ss-input" type="number" min="0" value={p.amount ?? ''} onChange={onParam('amount')} />
        </Field>
      );
    case 'exclusion':
      return (
        <Field label={t('ruleEditor.excludedKeyword')}>
          <input className="ss-input" value={p.match ?? ''} onChange={onParam('match')} placeholder={t('ruleEditor.placeholderCosmetic')} />
        </Field>
      );
    default:
      return null;
  }
};

export const RuleEditor = ({ policy, onClose, onSave, busy, error }) => {
  const { t } = useTranslation();
  const [planName, setPlanName] = useState(policy.planName || '');
  const [insurer, setInsurer] = useState(policy.insurer || '');
  const [sumInsured, setSumInsured] = useState(policy.sumInsured || 0);
  const [rows, setRows] = useState((policy.rules || []).map(toRow));

  const updateRow = (i, patch) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const setParam = (i) => (key) => (e) => setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, params: { ...r.params, [key]: e.target.value } } : r)));
  const setType = (i) => (e) => updateRow(i, { type: e.target.value, params: {}, basis: 'percent' });
  const addRow = () => setRows((rs) => [...rs, blankRow()]);
  const removeRow = (i) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const submit = (e) => {
    e.preventDefault();
    onSave({
      planName,
      insurer,
      sumInsured: Number(sumInsured) || 0,
      rules: rows.map(serialize),
    });
  };

  return (
    <Modal
      title={t('ruleEditor.title')}
      eyebrow={t('ruleEditor.eyebrow')}
      onClose={onClose}
      footer={
        <>
          <button className="ss-btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
          <button className="ss-btn-primary" onClick={submit} disabled={busy}>
            {busy ? t('common.saving') : t('ruleEditor.saveRefreeze')}
          </button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <ErrorBanner error={error} />

        <p className="text-xs text-slate-400 leading-relaxed">
          <Trans i18nKey="ruleEditor.intro" components={{ ink: <span className="text-slate-900" /> }} />
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="ss-label">{t('ruleEditor.planName')}</label>
            <input className="ss-input" value={planName} onChange={(e) => setPlanName(e.target.value)} required />
          </div>
          <div>
            <label className="ss-label">{t('ruleEditor.insurer')}</label>
            <input className="ss-input" value={insurer} onChange={(e) => setInsurer(e.target.value)} />
          </div>
          <div>
            <label className="ss-label">{t('ruleEditor.sumInsured')}</label>
            <input className="ss-input" type="number" min="0" value={sumInsured} onChange={(e) => setSumInsured(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="ss-eyebrow">{t('ruleEditor.rulesCount', { count: rows.length })}</p>
            <button type="button" className="ss-btn-secondary py-1.5 px-3" onClick={addRow}>
              <Icon name="plus" className="h-4 w-4" /> {t('ruleEditor.addRule')}
            </button>
          </div>

          {rows.length === 0 ? (
            <p className="text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center">
              {t('ruleEditor.noRules')}
            </p>
          ) : (
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-wrap gap-3 flex-1">
                      <Field label={t('ruleEditor.type')}>
                        <select className="ss-input" value={row.type} onChange={setType(i)}>
                          {TYPE_VALUES.map((v) => <option key={v} value={v}>{t(`ruleTypes.${v}`)}</option>)}
                        </select>
                      </Field>
                      <RuleParams row={row} onParam={setParam(i)} onBasis={(b) => updateRow(i, { basis: b })} />
                    </div>
                    <button
                      type="button"
                      className="ss-btn-ghost p-2 text-red-500 shrink-0 mt-6"
                      onClick={() => removeRow(i)}
                      aria-label={t('ruleEditor.removeRule')}
                    >
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-3 grid sm:grid-cols-2 gap-3">
                    <Field label={t('ruleEditor.labelOptional')}>
                      <input className="ss-input" value={row.label} onChange={(e) => updateRow(i, { label: e.target.value })} placeholder={t('ruleEditor.placeholderRoomRentCap')} />
                    </Field>
                    <Field label={t('ruleEditor.clauseRefOptional')}>
                      <input className="ss-input" value={row.clauseRef} onChange={(e) => updateRow(i, { clauseRef: e.target.value })} placeholder={t('ruleEditor.placeholderSection')} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

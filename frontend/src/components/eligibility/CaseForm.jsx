import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ROOM_TYPES, ADMISSION_TYPES } from '../../constants/navigation.js';

const EMPTY = {
  policyId: '',
  patientName: '',
  patientAge: '',
  roomType: '',
  roomCostPerDay: '',
  stayDays: '',
  admissionType: '',
  procedure: '',
  procedureCost: '',
  preExisting: '',
  hospitalName: '',
  city: '',
  claimedAmount: '',
  policyAgeMonths: '',
};

const Field = ({ label, required, children }) => {
  return (
    <div>
      <label className="ss-label">
        {label} {required && <span className="text-taupe">*</span>}
      </label>
      {children}
    </div>
  );
}

// Controlled case-input form. Pure UI — submission handled by the parent page hook.
export const CaseForm = ({ policies = [], onSubmit, submitting }) => {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="ss-card p-6 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label={t('eligibility.fieldPolicy')} required>
          <select className="ss-input" value={form.policyId} onChange={set('policyId')} required>
            <option value="">{t('eligibility.selectPolicy')}</option>
            {policies.map((p) => (
              <option key={p._id} value={p._id}>
                {p.planName} — {p.insurer}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('eligibility.fieldProcedure')} required>
          <input className="ss-input" placeholder={t('eligibility.phProcedure')} value={form.procedure} onChange={set('procedure')} required />
        </Field>

        <Field label={t('eligibility.fieldPatientName')}>
          <input className="ss-input" placeholder={t('eligibility.phPatientName')} value={form.patientName} onChange={set('patientName')} />
        </Field>
        <Field label={t('eligibility.fieldPatientAge')}>
          <input className="ss-input" type="number" min="0" placeholder="45" value={form.patientAge} onChange={set('patientAge')} />
        </Field>

        <Field label={t('eligibility.fieldRoomType')}>
          <select className="ss-input" value={form.roomType} onChange={set('roomType')}>
            <option value="">—</option>
            {ROOM_TYPES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label={t('eligibility.fieldRoomCost')}>
          <input className="ss-input" type="number" min="0" placeholder="5000" value={form.roomCostPerDay} onChange={set('roomCostPerDay')} />
        </Field>

        <Field label={t('eligibility.fieldStayDays')}>
          <input className="ss-input" type="number" min="0" placeholder="3" value={form.stayDays} onChange={set('stayDays')} />
        </Field>
        <Field label={t('eligibility.fieldAdmissionType')}>
          <select className="ss-input" value={form.admissionType} onChange={set('admissionType')}>
            <option value="">—</option>
            {ADMISSION_TYPES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </Field>

        <Field label={t('eligibility.fieldProcedureCost')}>
          <input className="ss-input" type="number" min="0" placeholder="60000" value={form.procedureCost} onChange={set('procedureCost')} />
        </Field>
        <Field label={t('eligibility.fieldPreExisting')}>
          <input className="ss-input" placeholder={t('eligibility.phPreExisting')} value={form.preExisting} onChange={set('preExisting')} />
        </Field>

        <Field label={t('eligibility.fieldHospitalName')}>
          <input className="ss-input" placeholder={t('eligibility.phHospitalName')} value={form.hospitalName} onChange={set('hospitalName')} />
        </Field>
        <Field label={t('eligibility.fieldCity')}>
          <input className="ss-input" placeholder={t('eligibility.phCity')} value={form.city} onChange={set('city')} />
        </Field>

        <Field label={t('eligibility.fieldPolicyAge')}>
          <input className="ss-input" type="number" min="0" placeholder="36" value={form.policyAgeMonths} onChange={set('policyAgeMonths')} />
        </Field>
        <Field label={t('eligibility.fieldClaimedAmount')} required>
          <input className="ss-input" type="number" min="1" placeholder="85000" value={form.claimedAmount} onChange={set('claimedAmount')} required />
        </Field>
      </div>

      <div className="flex justify-end pt-2">
        <button type="submit" className="ss-btn-primary" disabled={submitting}>
          {submitting ? t('eligibility.checking') : t('eligibility.runCheck')}
        </button>
      </div>
    </form>
  );
}

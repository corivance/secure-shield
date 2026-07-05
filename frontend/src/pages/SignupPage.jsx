import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthCard } from '../components/auth/AuthCard.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { useSignup } from '../hooks/useAuth.js';

const SignupPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signup = useSignup();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    signup.mutate(form, { onSuccess: () => navigate('/') });
  };

  return (
    <AuthCard
      title={t('auth.createAccountTitle')}
      subtitle={t('signup.subtitle')}
      footer={<>{t('auth.haveAccount')} <Link className="text-taupe font-medium" to="/login">{t('auth.signIn')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner error={signup.error} />
        <div>
          <label className="ss-label">{t('auth.fullName')}</label>
          <input className="ss-input" value={form.fullName} onChange={set('fullName')} required />
        </div>
        <div>
          <label className="ss-label">{t('auth.email')}</label>
          <input className="ss-input" type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label className="ss-label">{t('auth.password')}</label>
          <input className="ss-input" type="password" minLength={8} value={form.password} onChange={set('password')} required />
          <p className="text-[11px] text-charcoal mt-1">{t('signup.passwordHint')}</p>
        </div>
        <button className="ss-btn-primary w-full" disabled={signup.isPending}>
          {signup.isPending ? t('signup.creating') : t('signup.createAccount')}
        </button>
      </form>
    </AuthCard>
  );
};

export default SignupPage;

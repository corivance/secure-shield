import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthCard } from '../components/auth/AuthCard.jsx';
import { ErrorBanner } from '../components/common/ErrorBanner.jsx';
import { useLogin } from '../hooks/useAuth.js';

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = (e) => {
    e.preventDefault();
    login.mutate({ email, password }, { onSuccess: () => navigate('/') });
  };

  return (
    <AuthCard
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInTo')}
      footer={<>{t('auth.noAccount')} <Link className="text-indigo-600 font-medium hover:text-indigo-700" to="/signup">{t('auth.createOne')}</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <ErrorBanner error={login.error} />
        <div>
          <label className="ss-label">{t('auth.email')}</label>
          <input className="ss-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="ss-label">{t('auth.password')}</label>
          <input className="ss-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="ss-btn-primary w-full" disabled={login.isPending}>
          {login.isPending ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
    </AuthCard>
  );
};

export default LoginPage;

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';
import { LanguageSwitcher } from '../common/LanguageSwitcher.jsx';

export const AuthCard = ({ title, subtitle, children, footer }) => {
  const { t } = useTranslation();
  const FEATURES = [
    ['01', t('auth.feature1Head'), t('auth.feature1Body')],
    ['02', t('auth.feature2Head'), t('auth.feature2Body')],
    ['03', t('auth.feature3Head'), t('auth.feature3Body')],
  ];
  return (
    <div className="relative min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-[#F8FAFC]">
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="bare" />
      </div>

      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-white border-r border-slate-200">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
            <Icon name="shield" className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold text-slate-900">SecureShield</span>
        </div>

        <div className="max-w-md">
          <p className="ss-eyebrow mb-4">{t('auth.brandEyebrow')}</p>
          <h2 className="text-[40px] font-semibold leading-[1.04] text-slate-900">
            {t('auth.brandHeadline')}
          </h2>
          <div className="mt-9 space-y-5">
            {FEATURES.map(([n, head, body]) => (
              <div key={n} className="flex gap-4">
                <span className="font-mono text-[11px] tabular-nums text-slate-400 mt-1">{n}</span>
                <div>
                  <p className="text-slate-900 font-medium">{head}</p>
                  <p className="text-slate-500 text-sm mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{t('auth.brandFooter')}</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
              <Icon name="shield" className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-slate-900">SecureShield</span>
          </div>

          <p className="ss-eyebrow mb-2">{footer ? t('auth.accountEyebrow') : t('auth.welcomeEyebrow')}</p>
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          {subtitle && <p className="text-slate-500 text-sm mt-2">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <p className="text-center text-sm text-slate-500 mt-6">{footer}</p>}
        </div>
      </div>
    </div>
  );
};

export { Link };

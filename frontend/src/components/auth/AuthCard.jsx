import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';
import { LanguageSwitcher } from '../common/LanguageSwitcher.jsx';

// Editorial split: a brand statement panel beside the form.
export const AuthCard = ({ title, subtitle, children, footer }) => {
  const { t } = useTranslation();
  const FEATURES = [
    ['01', t('auth.feature1Head'), t('auth.feature1Body')],
    ['02', t('auth.feature2Head'), t('auth.feature2Body')],
    ['03', t('auth.feature3Head'), t('auth.feature3Body')],
  ];
  return (
    <div className="relative min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Language picker — available right on the login/signup screen */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher variant="bare" />
      </div>

      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden border-r border-gray/50">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              'radial-gradient(700px 420px at 18% 12%, rgba(135,154,119,0.20), transparent 60%), radial-gradient(640px 460px at 92% 96%, rgba(201,173,147,0.24), transparent 58%), radial-gradient(900px 700px at 50% 50%, rgba(215,229,240,0.5), transparent 72%)',
          }}
        />
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-taupe text-white shadow-soft"><Icon name="shield" className="h-5 w-5" /></span>
          <span className="ss-display text-xl text-ink">SecureShield</span>
        </div>

        <div className="max-w-md">
          <p className="ss-eyebrow mb-4">{t('auth.brandEyebrow')}</p>
          <h2 className="ss-display text-[40px] leading-[1.04] text-ink">
            {t('auth.brandHeadline')}
          </h2>
          <div className="mt-9 space-y-5">
            {FEATURES.map(([n, head, body]) => (
              <div key={n} className="flex gap-4">
                <span className="font-mono text-[11px] tabular-nums text-charcoal/70 mt-1">{n}</span>
                <div>
                  <p className="text-ink font-medium tracking-tightish">{head}</p>
                  <p className="text-charcoal text-sm mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="ss-eyebrow text-charcoal/60">{t('auth.brandFooter')}</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-taupe text-white"><Icon name="shield" className="h-5 w-5" /></span>
            <span className="ss-display text-xl text-ink">SecureShield</span>
          </div>

          <p className="ss-eyebrow mb-3">{footer ? t('auth.accountEyebrow') : t('auth.welcomeEyebrow')}</p>
          <h1 className="ss-display text-[32px] leading-tight text-ink">{title}</h1>
          {subtitle && <p className="text-charcoal text-sm mt-2">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <p className="text-center text-sm text-charcoal mt-6">{footer}</p>}
        </div>
      </div>
    </div>
  );
};

export { Link };

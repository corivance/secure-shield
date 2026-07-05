import { useTranslation, Trans } from 'react-i18next';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { ArchitectureSteps } from '../components/howitworks/ArchitectureSteps.jsx';
import { Disclaimer } from '../components/common/Disclaimer.jsx';
import { COMPLIANCE } from '../constants/compliance.js';

const HowItWorksPage = () => {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader
        eyebrow={t('howItWorks.eyebrow')}
        title={t('howItWorks.title')}
        subtitle={t('howItWorks.subtitle')}
      />
      <div className="ss-card p-6 mb-6">
        <p className="text-[15px] text-charcoal leading-relaxed">
          <Trans i18nKey="howItWorks.intro" components={{ strong: <strong className="text-ink" /> }} />
        </p>
        <div className="ss-rule my-4" />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="ss-eyebrow">{t('howItWorks.framework')}</span>
          <span className="text-sm text-ink">{COMPLIANCE.label}</span>
          <span className="font-mono text-[11px] text-charcoal/70">{COMPLIANCE.circularRef}</span>
          <span className="font-mono text-[11px] text-charcoal/70">{t('howItWorks.reviewed', { date: COMPLIANCE.reviewed })}</span>
        </div>
      </div>
      <ArchitectureSteps />
      <div className="ss-card p-5 mt-6">
        <Disclaimer />
      </div>
    </div>
  );
};

export default HowItWorksPage;

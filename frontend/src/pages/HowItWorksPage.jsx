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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-card">
        <p className="text-[15px] text-slate-500 leading-relaxed">
          <Trans i18nKey="howItWorks.intro" components={{ strong: <strong className="text-slate-900" /> }} />
        </p>
        <div className="ss-rule my-4" />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="ss-eyebrow">{t('howItWorks.framework')}</span>
          <span className="text-sm text-slate-900">{COMPLIANCE.label}</span>
          <span className="font-mono text-[11px] text-slate-400">{COMPLIANCE.circularRef}</span>
          <span className="font-mono text-[11px] text-slate-400">{t('howItWorks.reviewed', { date: COMPLIANCE.reviewed })}</span>
        </div>
      </div>
      <ArchitectureSteps />
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mt-6 shadow-card">
        <Disclaimer />
      </div>
    </div>
  );
};

export default HowItWorksPage;

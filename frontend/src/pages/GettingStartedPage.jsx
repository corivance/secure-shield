import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { PageHeader } from '../components/common/PageHeader.jsx';
import { Icon } from '../components/common/Icon.jsx';
import { Disclaimer } from '../components/common/Disclaimer.jsx';
import { COMPLIANCE } from '../constants/compliance.js';
import { currentUserAtom } from '../store/authAtom.js';

const CodeBlock = ({ children }) => (
  <pre className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 overflow-x-auto my-3">
    <code>{children}</code>
  </pre>
);

const Step = ({ n, icon, title, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4 shadow-card">
    <div className="flex items-start gap-5">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200 font-mono text-sm">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <Icon name={icon} className="h-5 w-5 text-indigo-600 shrink-0" />
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="mt-3 text-sm text-slate-500 leading-relaxed space-y-3">{children}</div>
      </div>
    </div>
  </div>
);

const Tip = ({ children }) => (
  <div className="flex items-start gap-2 text-sm">
    <span className="text-emerald-600 mt-0.5 shrink-0">•</span>
    <span>{children}</span>
  </div>
);

const GettingStartedPage = () => {
  const { t } = useTranslation();
  const user = useAtomValue(currentUserAtom);

  return (
    <div>
      <PageHeader
        eyebrow={t('gettingStarted.eyebrow')}
        title={t('gettingStarted.title')}
        subtitle={t('gettingStarted.subtitle')}
      />

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('gettingStarted.overviewTitle')}</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          <Trans
            i18nKey="gettingStarted.intro"
            components={{ strong: <strong className="text-slate-900" /> }}
          />
        </p>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-card">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
            <span className="ss-eyebrow">{t('howItWorks.framework')}</span>
            <span className="text-sm text-slate-900">{COMPLIANCE.label}</span>
            <span className="font-mono text-[11px] text-slate-400">{COMPLIANCE.circularRef}</span>
            <span className="font-mono text-[11px] text-slate-400">{t('howItWorks.reviewed', { date: COMPLIANCE.reviewed })}</span>
          </div>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">{t('gettingStarted.overviewBody')}</p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('gettingStarted.prereqTitle')}</h2>
        <div className="space-y-3">
          {[
            { icon: 'user', label: t('gettingStarted.prereq1Label'), desc: t('gettingStarted.prereq1Desc') },
            { icon: 'upload', label: t('gettingStarted.prereq2Label'), desc: t('gettingStarted.prereq2Desc') },
            { icon: 'lock', label: t('gettingStarted.prereq3Label'), desc: t('gettingStarted.prereq3Desc') },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 border border-slate-200">
                <Icon name={item.icon} className="h-4 w-4 text-slate-600" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('gettingStarted.quickStartTitle')}</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-3">{t('gettingStarted.quickStartBody')}</p>

        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <Link to="/signup" className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-soft transition-all duration-200">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 border border-slate-200">
              <span className="font-mono text-xs text-slate-600">01</span>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('gettingStarted.quickUpload')}</p>
              <p className="text-xs text-slate-500">{t('gettingStarted.quickUploadDesc')}</p>
            </div>
          </Link>
          <Link to="/policies" className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-soft transition-all duration-200">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 border border-slate-200">
              <span className="font-mono text-xs text-slate-600">02</span>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('gettingStarted.quickPolicy')}</p>
              <p className="text-xs text-slate-500">{t('gettingStarted.quickPolicyDesc')}</p>
            </div>
          </Link>
          <Link to="/check" className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:border-slate-300 hover:shadow-soft transition-all duration-200">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 border border-slate-200">
              <span className="font-mono text-xs text-slate-600">03</span>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('gettingStarted.quickCheck')}</p>
              <p className="text-xs text-slate-500">{t('gettingStarted.quickCheckDesc')}</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">{t('gettingStarted.fullGuide')}</h2>

        <Step n="01" icon="user" title={t('gettingStarted.step1Title')}>
          <p>{t('gettingStarted.step1Body1')}</p>
          <CodeBlock>{'Email:    admin@secureshield.in\nPassword: ChangeMe123!'}</CodeBlock>
          <p>{t('gettingStarted.step1Body2')}</p>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step1Tip1')}</Tip>
            <Tip>{t('gettingStarted.step1Tip2')}</Tip>
          </div>
          <Link to="/signup" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            {t('gettingStarted.step1Link')} <span>→</span>
          </Link>
        </Step>

        <Step n="02" icon="upload" title={t('gettingStarted.step2Title')}>
          <p>{t('gettingStarted.step2Body1')}</p>
          <ol className="list-decimal list-inside space-y-1.5 ml-2">
            <li>{t('gettingStarted.step2Step1')}</li>
            <li>{t('gettingStarted.step2Step2')}</li>
            <li>{t('gettingStarted.step2Step3')}</li>
            <li>{t('gettingStarted.step2Step4')}</li>
          </ol>
          <p className="mt-3">{t('gettingStarted.step2Body2')}</p>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step2Tip1')}</Tip>
            <Tip>{t('gettingStarted.step2Tip2')}</Tip>
            <Tip>{t('gettingStarted.step2Tip3')}</Tip>
            <Tip>{t('gettingStarted.step2Tip4')}</Tip>
          </div>
          <Link to="/policies" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            {t('gettingStarted.step2Link')} <span>→</span>
          </Link>
        </Step>

        <Step n="03" icon="eye" title={t('gettingStarted.step3Title')}>
          <p>{t('gettingStarted.step3Body1')}</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>{t('gettingStarted.step3Item1')}</li>
            <li>{t('gettingStarted.step3Item2')}</li>
            <li>{t('gettingStarted.step3Item3')}</li>
            <li>{t('gettingStarted.step3Item4')}</li>
            <li>{t('gettingStarted.step3Item5')}</li>
          </ul>
          <p className="mt-3">{t('gettingStarted.step3Body2')}</p>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step3Tip1')}</Tip>
            <Tip>{t('gettingStarted.step3Tip2')}</Tip>
          </div>
        </Step>

        <Step n="04" icon="shield" title={t('gettingStarted.step4Title')}>
          <p>{t('gettingStarted.step4Body1')}</p>
          <CodeBlock>{'Procedure:    Cataract Surgery\nRoom Type:    Single AC\nRoom Cost:    ₹5,000 / day\nStay Duration: 3 days\nTotal Claim:  ₹85,000'}</CodeBlock>
          <p className="mt-3">{t('gettingStarted.step4Body2')}</p>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step4Tip1')}</Tip>
            <Tip>{t('gettingStarted.step4Tip2')}</Tip>
            <Tip>{t('gettingStarted.step4Tip3')}</Tip>
          </div>
          <Link to="/check" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            {t('gettingStarted.step4Link')} <span>→</span>
          </Link>
        </Step>

        <Step n="05" icon="check" title={t('gettingStarted.step5Title')}>
          <p>{t('gettingStarted.step5Body1')}</p>
          <div className="grid sm:grid-cols-3 gap-3 my-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
              <p className="font-mono text-xs text-emerald-700 uppercase">Approved</p>
              <p className="text-sm text-slate-900 mt-1">{t('gettingStarted.verdictApproved')}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
              <p className="font-mono text-xs text-amber-700 uppercase">Partial</p>
              <p className="text-sm text-slate-900 mt-1">{t('gettingStarted.verdictPartial')}</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
              <p className="font-mono text-xs text-red-700 uppercase">Denied</p>
              <p className="text-sm text-slate-900 mt-1">{t('gettingStarted.verdictDenied')}</p>
            </div>
          </div>
          <p>{t('gettingStarted.step5Body2')}</p>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step5Tip1')}</Tip>
            <Tip>{t('gettingStarted.step5Tip2')}</Tip>
            <Tip>{t('gettingStarted.step5Tip3')}</Tip>
          </div>
        </Step>

        <Step n="06" icon="scale" title={t('gettingStarted.step6Title')}>
          <p>{t('gettingStarted.step6Body1')}</p>
          <ol className="list-decimal list-inside space-y-1.5 ml-2">
            <li>{t('gettingStarted.step6Step1')}</li>
            <li>{t('gettingStarted.step6Step2')}</li>
            <li>{t('gettingStarted.step6Step3')}</li>
            <li>{t('gettingStarted.step6Step4')}</li>
          </ol>
          <p className="mt-3">{t('gettingStarted.step6Body2')}</p>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step6Tip1')}</Tip>
            <Tip>{t('gettingStarted.step6Tip2')}</Tip>
          </div>
          <Link to="/disputes" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            {t('gettingStarted.step6Link')} <span>→</span>
          </Link>
        </Step>

        <Step n="07" icon="columns" title={t('gettingStarted.step7Title')}>
          <p>{t('gettingStarted.step7Body1')}</p>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step7Tip1')}</Tip>
            <Tip>{t('gettingStarted.step7Tip2')}</Tip>
            <Tip>{t('gettingStarted.step7Tip3')}</Tip>
          </div>
          <Link to="/compare" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            {t('gettingStarted.step7Link')} <span>→</span>
          </Link>
        </Step>

        <Step n="08" icon="chat" title={t('gettingStarted.step8Title')}>
          <p>{t('gettingStarted.step8Body1')}</p>
          <CodeBlock>{'Example questions:\n• "What is a waiting period?"\n• "Is cataract surgery covered?"\n• "What does sub-limit mean?"\n• "How do I file a grievance?"'}</CodeBlock>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step8Tip1')}</Tip>
            <Tip>{t('gettingStarted.step8Tip2')}</Tip>
          </div>
          <Link to="/chat" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            {t('gettingStarted.step8Link')} <span>→</span>
          </Link>
        </Step>

        <Step n="09" icon="clock" title={t('gettingStarted.step9Title')}>
          <p>{t('gettingStarted.step9Body1')}</p>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step9Tip1')}</Tip>
            <Tip>{t('gettingStarted.step9Tip2')}</Tip>
          </div>
          <Link to="/history" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            {t('gettingStarted.step9Link')} <span>→</span>
          </Link>
        </Step>

        <Step n="10" icon="gear" title={t('gettingStarted.step10Title')}>
          <p>{t('gettingStarted.step10Body1')}</p>
          <p>{t('gettingStarted.step10Body2')}</p>
          <CodeBlock>{'Free LLM providers:\n• Cerebras  → cloud.cerebras.ai (free tier)\n• Groq      → console.groq.com (free tier)\n• OpenRouter → openrouter.ai (free tier)'}</CodeBlock>
          <div className="space-y-1.5 mt-2">
            <Tip>{t('gettingStarted.step10Tip1')}</Tip>
            <Tip>{t('gettingStarted.step10Tip2')}</Tip>
          </div>
          <Link to="/settings" className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700">
            {t('gettingStarted.step10Link')} <span>→</span>
          </Link>
        </Step>
      </section>

      <section className="mb-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 border border-slate-200 text-slate-600">
              <span className="font-mono text-xs">₹</span>
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('gettingStarted.planHintTitle')}</p>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{t('gettingStarted.planHintDesc')}</p>
              <Link to="/plans" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                {t('gettingStarted.planHintLink')} →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">{t('gettingStarted.faqTitle')}</h2>
        <div className="space-y-4">
          {[
            { q: 'gettingStarted.faq1Q', a: 'gettingStarted.faq1A' },
            { q: 'gettingStarted.faq2Q', a: 'gettingStarted.faq2A' },
            { q: 'gettingStarted.faq3Q', a: 'gettingStarted.faq3A' },
            { q: 'gettingStarted.faq4Q', a: 'gettingStarted.faq4A' },
            { q: 'gettingStarted.faq5Q', a: 'gettingStarted.faq5A' },
            { q: 'gettingStarted.faq6Q', a: 'gettingStarted.faq6A' },
          ].map((faq, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-card">
              <p className="text-sm font-medium text-slate-900">{t(faq.q)}</p>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{t(faq.a)}</p>
            </div>
          ))}
        </div>
      </section>

      <Disclaimer />
    </div>
  );
};

export default GettingStartedPage;

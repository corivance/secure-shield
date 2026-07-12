import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';

const STEPS = [
  {
    n: '01',
    icon: 'user',
    titleKey: 'gettingStarted.step1Title',
    descKey: 'gettingStarted.step1Desc',
    link: '/signup',
    linkKey: 'gettingStarted.step1Link',
    tips: [
      { key: 'gettingStarted.step1Tip1' },
      { key: 'gettingStarted.step1Tip2' },
    ],
  },
  {
    n: '02',
    icon: 'upload',
    titleKey: 'gettingStarted.step2Title',
    descKey: 'gettingStarted.step2Desc',
    link: '/policies',
    linkKey: 'gettingStarted.step2Link',
    tips: [
      { key: 'gettingStarted.step2Tip1' },
      { key: 'gettingStarted.step2Tip2' },
      { key: 'gettingStarted.step2Tip3' },
    ],
  },
  {
    n: '03',
    icon: 'shield',
    titleKey: 'gettingStarted.step3Title',
    descKey: 'gettingStarted.step3Desc',
    link: '/check',
    linkKey: 'gettingStarted.step3Link',
    tips: [
      { key: 'gettingStarted.step3Tip1' },
      { key: 'gettingStarted.step3Tip2' },
      { key: 'gettingStarted.step3Tip3' },
    ],
  },
  {
    n: '04',
    icon: 'eye',
    titleKey: 'gettingStarted.step4Title',
    descKey: 'gettingStarted.step4Desc',
    link: null,
    tips: [
      { key: 'gettingStarted.step4Tip1' },
      { key: 'gettingStarted.step4Tip2' },
      { key: 'gettingStarted.step4Tip3' },
    ],
  },
  {
    n: '05',
    icon: 'scale',
    titleKey: 'gettingStarted.step5Title',
    descKey: 'gettingStarted.step5Desc',
    link: '/disputes',
    linkKey: 'gettingStarted.step5Link',
    tips: [
      { key: 'gettingStarted.step5Tip1' },
      { key: 'gettingStarted.step5Tip2' },
    ],
  },
  {
    n: '06',
    icon: 'columns',
    titleKey: 'gettingStarted.step6Title',
    descKey: 'gettingStarted.step6Desc',
    link: '/compare',
    linkKey: 'gettingStarted.step6Link',
    tips: [
      { key: 'gettingStarted.step6Tip1' },
      { key: 'gettingStarted.step6Tip2' },
    ],
  },
  {
    n: '07',
    icon: 'chat',
    titleKey: 'gettingStarted.step7Title',
    descKey: 'gettingStarted.step7Desc',
    link: '/chat',
    linkKey: 'gettingStarted.step7Link',
    tips: [
      { key: 'gettingStarted.step7Tip1' },
      { key: 'gettingStarted.step7Tip2' },
    ],
  },
  {
    n: '08',
    icon: 'clock',
    titleKey: 'gettingStarted.step8Title',
    descKey: 'gettingStarted.step8Desc',
    link: '/history',
    linkKey: 'gettingStarted.step8Link',
    tips: [
      { key: 'gettingStarted.step8Tip1' },
    ],
  },
];

export const GettingStartedSteps = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {STEPS.map((step) => (
        <div key={step.n} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
          <div className="flex items-start gap-5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200 font-mono text-sm">
              {step.n}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <Icon name={step.icon} className="h-5 w-5 text-indigo-600 shrink-0" />
                <h3 className="text-base font-semibold text-slate-900">{t(step.titleKey)}</h3>
              </div>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{t(step.descKey)}</p>

              {step.tips.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                      <span className="text-emerald-600 mt-1 shrink-0">•</span>
                      <span>{t(tip.key)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {step.link && (
                <Link
                  to={step.link}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  {t(step.linkKey)}
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

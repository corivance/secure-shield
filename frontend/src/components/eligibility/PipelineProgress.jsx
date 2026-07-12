import { useTranslation } from 'react-i18next';
import { humanizeTool, humanizeAgent, toolDescription } from '../../constants/pipelineTools.js';

export const PipelineProgress = ({ steps = [], running }) => {
  const { t } = useTranslation();
  if (!steps.length && !running) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        {running && <span className="ss-dot" />}
        <p className="ss-eyebrow">{running ? t('eligibility.agentsAtWork') : t('eligibility.pipelineTrace')}</p>
      </div>
      <ol className="space-y-3 relative">
        <span className="absolute left-[5px] top-1 bottom-1 w-px bg-slate-200" aria-hidden />
        {steps.map((s, i) => {
          const primary = s.tool ? humanizeTool(s.tool) : humanizeAgent(s.agent);
          const does = s.tool ? toolDescription(s.tool) : '';
          return (
            <li key={i} className="flex gap-3 text-sm relative">
              <span
                className={`z-10 mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${s.status === 'failure' ? 'bg-red-500' : 'bg-emerald-500'}`}
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-slate-900">{primary}</span>
                  {s.tool && <span className="text-[11px] text-slate-400">{humanizeAgent(s.agent)}</span>}
                  {s.durationMs != null && (
                    <span className="font-mono text-[11px] text-slate-300">{s.durationMs < 1 ? '<1' : s.durationMs}ms</span>
                  )}
                </div>
                {does && <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">{does}</p>}
              </div>
            </li>
          );
        })}
        {running && (
          <li className="flex items-center gap-3 text-sm relative text-slate-400">
            <span className="z-10 h-2.5 w-2.5 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin shrink-0" />
            <span className="text-[11px] font-medium uppercase tracking-wider">{t('eligibility.decisionEngineComputing')}</span>
          </li>
        )}
      </ol>
    </div>
  );
};

import { useTranslation } from 'react-i18next';
import { humanizeTool, humanizeAgent, toolDescription } from '../../constants/pipelineTools.js';

// Live pipeline step feed shown while a check runs (and the recorded steps after).
export const PipelineProgress = ({ steps = [], running }) => {
  const { t } = useTranslation();
  if (!steps.length && !running) return null;
  return (
    <div className="ss-card p-6">
      <div className="flex items-center gap-2 mb-4">
        {running && <span className="ss-dot" />}
        <p className="ss-eyebrow">{running ? t('eligibility.agentsAtWork') : t('eligibility.pipelineTrace')}</p>
      </div>
      <ol className="space-y-3 relative">
        <span className="absolute left-[5px] top-1 bottom-1 w-px bg-gray/50" aria-hidden />
        {steps.map((s, i) => {
          const primary = s.tool ? humanizeTool(s.tool) : humanizeAgent(s.agent);
          const does = s.tool ? toolDescription(s.tool) : '';
          return (
            <li key={i} className="flex gap-3 text-sm relative">
              <span
                className={`z-10 mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${s.status === 'failure' ? 'bg-taupe' : 'bg-softgreen'}`}
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-ink">{primary}</span>
                  {s.tool && <span className="text-[11px] text-charcoal/50">{humanizeAgent(s.agent)}</span>}
                  {s.durationMs != null && (
                    <span className="font-mono text-[11px] text-charcoal/45">{s.durationMs < 1 ? '<1' : s.durationMs}ms</span>
                  )}
                </div>
                {does && <p className="text-[12px] text-charcoal/70 mt-0.5 leading-snug">{does}</p>}
              </div>
            </li>
          );
        })}
        {running && (
          <li className="flex items-center gap-3 text-sm relative text-charcoal">
            <span className="z-10 h-2.5 w-2.5 rounded-full border-2 border-gray/60 border-t-taupe animate-spin shrink-0" />
            <span className="font-mono text-[11px] uppercase tracking-eyebrow">{t('eligibility.decisionEngineComputing')}</span>
          </li>
        )}
      </ol>
    </div>
  );
};

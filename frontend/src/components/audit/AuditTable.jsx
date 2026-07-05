import { useTranslation } from 'react-i18next';
import { humanizeTool, humanizeAgent } from '../../constants/pipelineTools.js';

export const AuditTable = ({ entries = [] }) => {
  const { t } = useTranslation();
  return (
    <div className="ss-card overflow-x-auto">
      <table className="w-full text-sm min-w-[680px]">
        <thead>
          <tr className="border-b border-gray/60">
            <th className="text-left px-5 py-3 ss-eyebrow font-normal">{t('audit.colRun')}</th>
            <th className="text-left px-5 py-3 ss-eyebrow font-normal">{t('audit.colAgent')}</th>
            <th className="text-left px-5 py-3 ss-eyebrow font-normal">{t('audit.colTool')}</th>
            <th className="text-left px-5 py-3 ss-eyebrow font-normal">{t('audit.colOutput')}</th>
            <th className="text-right px-5 py-3 ss-eyebrow font-normal">{t('audit.colMs')}</th>
            <th className="text-center px-5 py-3 ss-eyebrow font-normal">{t('audit.colStatus')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray/40">
          {entries.map((e) => (
            <tr key={e._id} className="hover:bg-paleblue/20 transition-colors">
              <td className="px-5 py-3 font-mono text-[11px] text-charcoal/70">{e.pipelineRunId?.slice(0, 12)}</td>
              <td className="px-5 py-3 text-ink">{humanizeAgent(e.agent)}</td>
              <td className="px-5 py-3 text-charcoal" title={e.tool || ''}>{e.tool ? humanizeTool(e.tool) : '—'}</td>
              <td className="px-5 py-3 text-charcoal max-w-xs truncate">{e.outputSummary}</td>
              <td className="px-5 py-3 text-right font-mono tabular-nums text-charcoal">{e.durationMs}</td>
              <td className="px-5 py-3 text-center">
                {e.status === 'success' ? <span className="text-softgreen">✓</span> : <span className="text-taupe">✕</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

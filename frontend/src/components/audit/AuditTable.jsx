import { useTranslation } from 'react-i18next';
import { humanizeTool, humanizeAgent } from '../../constants/pipelineTools.js';

export const AuditTable = ({ entries = [] }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-card">
      <table className="w-full text-sm min-w-[680px]">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('audit.colRun')}</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('audit.colAgent')}</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('audit.colTool')}</th>
            <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('audit.colOutput')}</th>
            <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('audit.colMs')}</th>
            <th className="text-center px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">{t('audit.colStatus')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((e) => (
            <tr key={e._id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3 font-mono text-[11px] text-slate-400">{e.pipelineRunId?.slice(0, 12)}</td>
              <td className="px-5 py-3 text-slate-700">{humanizeAgent(e.agent)}</td>
              <td className="px-5 py-3 text-slate-500" title={e.tool || ''}>{e.tool ? humanizeTool(e.tool) : '—'}</td>
              <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{e.outputSummary}</td>
              <td className="px-5 py-3 text-right font-mono tabular-nums text-slate-500">{e.durationMs}</td>
              <td className="px-5 py-3 text-center">
                {e.status === 'success' ? <span className="text-emerald-600">✓</span> : <span className="text-red-500">✕</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

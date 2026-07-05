// Agent 4 — Grievance Agent. Builds a legally-backed dispute: precedent search,
// drafted letter, and a polished PDF report.
import { searchIrdaiPrecedents, draftGrievanceLetter } from '../tools/grievanceTools.js';
import { generateClaimReportPdf } from '../tools/reportTool.js';

export const runGrievanceAgent = async ({ user, policy, check, audit }) => {
  const query = `${check.verdict} ${policy.planName} ${(check.breakdown || []).filter((b) => b.triggered).map((b) => b.label || b.phase).join(' ')}`;

  let started = Date.now();
  const precedents = await searchIrdaiPrecedents(query, 5);
  await audit.log({ agent: 'GrievanceAgent', tool: 'search_irdai_precedents', input: query, output: { count: precedents.length }, startedAt: started });

  started = Date.now();
  const { letter, degraded } = await draftGrievanceLetter({ user, policy, check, precedents });
  await audit.log({ agent: 'GrievanceAgent', tool: 'draft_grievance_letter', input: 'case+precedents', output: { degraded, chars: letter.length }, startedAt: started });

  started = Date.now();
  const reportFile = await generateClaimReportPdf({ user, policy, check, letter, precedents });
  await audit.log({ agent: 'GrievanceAgent', tool: 'generate_claim_report_pdf', input: 'letter+breakdown', output: { reportFile }, startedAt: started });

  return { precedents, letter, reportFile };
}

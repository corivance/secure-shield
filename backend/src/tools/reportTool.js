import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { complianceFramework } from '../data/complianceFramework.js';

const require = createRequire(import.meta.url);

export const REPORTS_DIR = path.resolve(process.cwd(), 'reports');

const ensureDir = () => {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// generate_claim_report_pdf — polished PDF (PDFKit) with the rule-by-rule
// breakdown and the grievance letter. Returns the filename (not a path).
export const generateClaimReportPdf = ({ user, policy, check, letter, precedents }) => {
  ensureDir();
  const PDFDocument = require('pdfkit');
  const filename = `claim-report-${check._id || 'draft'}-${check.pipelineRunId || 'run'}.pdf`;
  const filePath = path.join(REPORTS_DIR, filename);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).fillColor('#000000').text('SecureShield — Claim Assessment & Grievance Report', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#73787C').text(`Generated for ${user.fullName} · Policy: ${policy.planName} (${policy.insurer})`);
    doc.moveDown();

    doc.fontSize(14).fillColor('#000000').text('Verdict');
    doc.fontSize(12).fillColor('#554940').text(
      `${String(check.verdict).toUpperCase()} · Coverage ${check.coveragePercent}% · Eligible ₹${check.eligibleAmount} of ₹${check.claimedAmount} claimed`
    );
    doc.moveDown();

    doc.fontSize(14).fillColor('#000000').text('Rule-by-rule breakdown');
    doc.moveDown(0.3);
    for (const b of check.breakdown || []) {
      const mark = b.triggered ? '•' : '◦';
      doc.fontSize(10).fillColor(b.triggered ? '#554940' : '#73787C')
        .text(`${mark} [${b.phase}] ${b.message || b.label || ''}${b.clauseRef ? ` (clause ${b.clauseRef})` : ''}`);
    }
    doc.moveDown();

    if (precedents?.length) {
      doc.fontSize(14).fillColor('#000000').text('Supporting precedents');
      doc.moveDown(0.3);
      for (const p of precedents) {
        doc.fontSize(10).fillColor('#000000').text(p.citation, { continued: false });
        doc.fontSize(9).fillColor('#73787C').text(p.holding);
        doc.moveDown(0.2);
      }
      doc.moveDown(0.5);
    }

    if (letter) {
      doc.addPage();
      doc.fontSize(14).fillColor('#000000').text('Formal Grievance Letter');
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000000').text(letter, { align: 'left' });
    }

    // Compliance reference + disclaimer footer.
    doc.moveDown(1.5);
    doc.fontSize(8).fillColor('#73787C').text(
      `Framework: ${complianceFramework.framework} (${complianceFramework.circularRef}), reviewed ${complianceFramework.lastReviewed}.`
    );
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor('#73787C').text(complianceFramework.disclaimer, { align: 'left' });

    doc.end();
    stream.on('finish', () => resolve(filename));
    stream.on('error', reject);
  });
}

import { useTranslation } from 'react-i18next';
import { PrecedentList } from './PrecedentList.jsx';
import { Disclaimer } from '../common/Disclaimer.jsx';
import { Icon } from '../common/Icon.jsx';

const STATUS_ICON = {
  queued: 'clock',
  processing: 'activity',
  ready: 'check',
  failed: 'xcircle',
};

export const DisputePanel = ({ dispute, onDownload, downloading }) => {
  const { t } = useTranslation();
  if (!dispute) return null;
  const statusIcon = STATUS_ICON[dispute.status] || 'clock';
  const statusLabel = STATUS_ICON[dispute.status]
    ? t(`disputes.status.${dispute.status}`)
    : dispute.status;
  return (
    <div className="space-y-5">
      <div className="ss-card p-6 flex items-center justify-between gap-4">
        <div>
          <p className="ss-eyebrow mb-1.5">{t('disputes.pipeline')}</p>
          <p className="ss-display text-lg text-ink flex items-center gap-2">
            <Icon name={statusIcon} className="h-4 w-4 text-taupe" />
            {statusLabel}
          </p>
        </div>
        {dispute.status === 'ready' && dispute.reportFile && (
          <button className="ss-btn-primary" onClick={() => onDownload(dispute.reportFile)} disabled={downloading}>
            {downloading ? t('disputes.preparing') : (<><Icon name="download" className="h-4 w-4" /> {t('disputes.downloadReport')}</>)}
          </button>
        )}
      </div>

      {dispute.error && (
        <div className="rounded-xl border border-taupe/40 bg-beige/15 text-taupe px-4 py-3 text-sm">{dispute.error}</div>
      )}

      <PrecedentList precedents={dispute.precedents} />

      {dispute.letter && (
        <div className="ss-card p-6">
          <p className="ss-eyebrow mb-3 flex items-center gap-2"><Icon name="pen" className="h-3.5 w-3.5" /> {t('disputes.letterHeading')}</p>
          <pre className="text-sm text-charcoal whitespace-pre-wrap font-sans leading-relaxed">{dispute.letter}</pre>
        </div>
      )}

      <Disclaimer className="px-1" />
    </div>
  );
};

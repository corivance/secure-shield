import { useTranslation } from 'react-i18next';

const COLORS = { approved: '#10B981', partial: '#F59E0B', denied: '#EF4444' };

export const CoverageRing = ({ percent = 0, verdict = 'partial', size = 140 }) => {
  const { t } = useTranslation();
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const stroke = 10;
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const sweep = 0.75;
  const arc = circ * sweep;
  const offset = arc - (pct / 100) * arc;
  const color = COLORS[verdict] || '#64748B';
  const rotation = 135;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arc} ${circ}`}
        transform={`rotate(${rotation} ${cx} ${cy})`}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arc} ${circ}`}
        strokeDashoffset={offset}
        transform={`rotate(${rotation} ${cx} ${cy})`}
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.2,0.7,0.2,1)' }}
      />
      <text
        x="50%"
        y="47%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-slate-900 font-display"
        fontSize="30"
        fontWeight="600"
      >
        {pct}%
      </text>
      <text
        x="50%"
        y="64%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#94A3B8"
        fontSize="9.5"
        letterSpacing="3"
        style={{ textTransform: 'uppercase' }}
      >
        {t('common.covered')}
      </text>
    </svg>
  );
};

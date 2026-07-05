// CoverageRing — an instrument-style gauge for the % of a claim covered.
// 270° sweep with a hairline tick track, in palette colours only.
import { useTranslation } from 'react-i18next';

const COLORS = { approved: '#879A77', partial: '#C9AD93', denied: '#554940' };

export const CoverageRing = ({ percent = 0, verdict = 'partial', size = 140 }) => {
  const { t } = useTranslation();
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const stroke = 10;
  const r = (size - stroke) / 2 - 6;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const sweep = 0.75; // 270° arc
  const arc = circ * sweep;
  const offset = arc - (pct / 100) * arc;
  const color = COLORS[verdict] || '#554940';
  // Rotate so the gap sits at the bottom (start at 135°).
  const rotation = 135;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#C5C6C7"
        strokeOpacity="0.55"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arc} ${circ}`}
        transform={`rotate(${rotation} ${cx} ${cy})`}
      />
      {/* Value */}
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
        className="fill-ink font-display"
        fontSize="30"
        fontWeight="500"
      >
        {pct}%
      </text>
      <text
        x="50%"
        y="64%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#73787C"
        fontSize="9.5"
        letterSpacing="3"
        style={{ textTransform: 'uppercase' }}
      >
        {t('common.covered')}
      </text>
    </svg>
  );
};

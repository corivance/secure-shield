export const StatTile = ({ label, value, hint, accent = 'ink' }) => {
  const accentClass = { ink: 'text-ink', softgreen: 'text-softgreen', taupe: 'text-taupe', beige: 'text-beige' }[accent] || 'text-ink';
  return (
    <div className="rounded-2xl border border-gray/60 bg-white/50 px-4 py-3.5">
      <p className="ss-eyebrow">{label}</p>
      <p className={`ss-display text-[26px] leading-none mt-2 ${accentClass}`}>{value}</p>
      {hint && <p className="text-charcoal text-xs mt-1.5">{hint}</p>}
    </div>
  );
};

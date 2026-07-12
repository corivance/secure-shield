export const StatTile = ({ label, value, hint, accent = 'ink' }) => {
  const accentClass = {
    ink: 'text-slate-900',
    softgreen: 'text-emerald-600',
    taupe: 'text-amber-600',
    beige: 'text-amber-600',
  }[accent] || 'text-slate-900';
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
      <p className="ss-eyebrow">{label}</p>
      <p className={`text-2xl font-semibold leading-none mt-2 ${accentClass}`}>{value}</p>
      {hint && <p className="text-slate-400 text-xs mt-1.5">{hint}</p>}
    </div>
  );
};

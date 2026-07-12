export const PageHeader = ({ title, subtitle, actions, eyebrow }) => {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="ss-eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-1.5 max-w-xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

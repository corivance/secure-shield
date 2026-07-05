export const PageHeader = ({ title, subtitle, actions, eyebrow }) => {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div className="min-w-0">
        {eyebrow && <p className="ss-eyebrow mb-2.5">{eyebrow}</p>}
        <h1 className="ss-display text-[30px] md:text-[36px] leading-[1.05] text-ink">{title}</h1>
        {subtitle && <p className="text-charcoal text-sm mt-2.5 max-w-xl leading-relaxed">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
};

import { useTranslation } from 'react-i18next';

const formatClauseRef = (ref) => {
  if (!ref) return '';
  return ref
    .replace(/^(\d+)\.([a-z]+)\.([ivx]+)$/i, 'Section $1($2)($3)')
    .replace(/^(\d+)\.([a-z]+)$/i, 'Section $1($2)')
    .replace(/^(\d+)$/i, 'Section $1');
};

export const RuleList = ({ rules = [] }) => {
  const { t } = useTranslation();

  const describe = (rule) => {
    const p = rule.params || {};
    switch (rule.type) {
      case 'room_rent':
        return p.percentOfSumInsured != null
          ? t('ruleList.roomRentPercent', { percent: p.percentOfSumInsured })
          : t('ruleList.roomRentAbsolute', { amount: p.absolutePerDay });
      case 'sub_limit':
        return t('ruleList.subLimit', { cap: Number(p.cap || 0).toLocaleString('en-IN'), procedure: p.procedure || rule.label });
      case 'waiting_period':
        return t('ruleList.waitingPeriod', { months: p.months, procedure: p.procedure || rule.label });
      case 'co_pay':
        return t('ruleList.coPay', { percent: p.percent });
      case 'deductible':
        return t('ruleList.deductible', { amount: Number(p.amount || 0).toLocaleString('en-IN') });
      case 'exclusion': {
        const match = p.match || rule.label;
        const capitalized = match.charAt(0).toUpperCase() + match.slice(1);
        return t('ruleList.exclusion', { match: capitalized });
      }
      default:
        return rule.label;
    }
  };

  if (!rules.length) return <p className="text-charcoal text-sm">{t('ruleList.noRules')}</p>;
  return (
    <ul className="divide-y divide-gray">
      {rules.map((rule, i) => (
        <li key={i} className="py-3 flex items-start justify-between gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wide text-charcoal">{t(`ruleTypes.${rule.type}`, rule.type)}</span>
            <p className="text-sm text-ink">{describe(rule)}</p>
          </div>
          {rule.clauseRef && <span className="text-[11px] text-charcoal whitespace-nowrap">{formatClauseRef(rule.clauseRef) || t('ruleList.clause', { ref: rule.clauseRef })}</span>}
        </li>
      ))}
    </ul>
  );
}

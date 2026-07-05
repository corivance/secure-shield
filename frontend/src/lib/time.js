// Compact relative-time formatter ("just now", "5m", "3h", "2d", or a date).
export const timeAgo = (input) => {
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 45) return 'just now';
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.round(secs / 86400)}d ago`;
  return new Date(input).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

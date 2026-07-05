// Minimal structured logger — no extra deps.
const ts = () => {
  return new Date().toISOString();
}

const emit = (level, args) => {
  const line = `[${ts()}] [${level}]`;
  // eslint-disable-next-line no-console
  (level === 'ERROR' ? console.error : console.log)(line, ...args);
}

export const logger = {
  info: (...args) => emit('INFO', args),
  warn: (...args) => emit('WARN', args),
  error: (...args) => emit('ERROR', args),
  debug: (...args) => process.env.NODE_ENV !== 'production' && emit('DEBUG', args),
};

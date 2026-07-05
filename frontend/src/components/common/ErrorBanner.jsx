import { Icon } from './Icon.jsx';

export const ErrorBanner = ({ error }) => {
  if (!error) return null;
  const message = error.message || String(error);
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-taupe/40 bg-taupe/10 px-4 py-3 text-sm text-taupe">
      <Icon name="alert" className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

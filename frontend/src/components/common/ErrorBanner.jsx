import { Icon } from './Icon.jsx';

export const ErrorBanner = ({ error }) => {
  if (!error) return null;
  const message = error.message || String(error);
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <Icon name="alert" className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

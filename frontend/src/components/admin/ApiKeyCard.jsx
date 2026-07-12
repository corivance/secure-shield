import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../common/Icon.jsx';
import { ErrorBanner } from '../common/ErrorBanner.jsx';

const STATUS = {
  live: { labelKey: 'admin.apiKeys.statusActive', dot: 'bg-emerald-500', text: 'text-emerald-600', accent: 'bg-emerald-500' },
  disabled: { labelKey: 'admin.apiKeys.statusDisabled', dot: 'bg-amber-500', text: 'text-amber-600', accent: 'bg-amber-500' },
  unset: { labelKey: 'admin.apiKeys.statusUnset', dot: 'bg-slate-300', text: 'text-slate-400', accent: 'bg-slate-300' },
};

export const ApiKeyCard = ({ apiKey, useUpdate }) => {
  const { t } = useTranslation();
  const update = useUpdate();
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState(false);

  const state = apiKey.isSet ? (apiKey.enabled ? 'live' : 'disabled') : 'unset';
  const s = STATUS[state];

  const save = (e) => {
    e.preventDefault();
    if (!value.trim()) return;
    update.mutate(
      { keyName: apiKey.keyName, value: value.trim() },
      { onSuccess: () => { setValue(''); setEditing(false); } }
    );
  };
  const toggleEnabled = () => update.mutate({ keyName: apiKey.keyName, enabled: !apiKey.enabled });
  const clearKey = () => update.mutate({ keyName: apiKey.keyName, value: '' }, { onSuccess: () => setEditing(false) });

  const showForm = !apiKey.isSet || editing;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex shadow-card">
      <span className={`w-1 shrink-0 ${s.accent}`} aria-hidden />
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 bg-slate-50 font-display text-lg text-slate-600">
              {apiKey.label?.[0] || '·'}
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900 leading-tight">{apiKey.label}</p>
              <p className="text-sm text-slate-500 mt-0.5">{apiKey.purpose}</p>
              <p className="font-mono text-[10.5px] text-slate-400 mt-1">{apiKey.keyName}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider shrink-0 ${s.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {t(s.labelKey)}
          </span>
        </div>

        <ErrorBanner error={update.error} />

        {showForm ? (
          <form onSubmit={save} className="mt-4 flex flex-wrap items-center gap-2">
            <input
              className="ss-input flex-1 min-w-[200px]"
              type="password"
              placeholder={apiKey.isSet ? t('admin.apiKeys.enterNewKey') : t('admin.apiKeys.pasteKey')}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
              autoFocus={editing}
            />
            <button type="submit" className="ss-btn-primary" disabled={update.isPending || !value.trim()}>
              {update.isPending ? t('common.saving') : t('common.save')}
            </button>
            {apiKey.isSet && (
              <button type="button" className="ss-btn-ghost" onClick={() => { setEditing(false); setValue(''); }}>
                {t('common.cancel')}
              </button>
            )}
          </form>
        ) : (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
            <span className="font-mono text-sm text-slate-400 tracking-[0.25em] select-none">••••••••••••</span>
            <div className="flex items-center gap-3">
              <button className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 uppercase tracking-wider" onClick={() => setEditing(true)}>
                {t('admin.apiKeys.replace')}
              </button>
              <button className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 uppercase tracking-wider" onClick={clearKey} disabled={update.isPending}>
                {t('admin.apiKeys.clear')}
              </button>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <a className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700" href={apiKey.url} target="_blank" rel="noreferrer">
            {t('admin.apiKeys.getKey')} <Icon name="upload" className="h-3 w-3 rotate-90" />
          </a>
          {apiKey.isSet && (
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
              {t('admin.apiKeys.enabledLabel')}
              <button
                type="button"
                role="switch"
                aria-checked={apiKey.enabled}
                onClick={toggleEnabled}
                disabled={update.isPending}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${apiKey.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${apiKey.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </label>
          )}
        </div>
      </div>
    </div>
  );
};

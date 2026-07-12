import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal.jsx';
import { Spinner } from '../common/Spinner.jsx';
import { ErrorBanner } from '../common/ErrorBanner.jsx';
import { Icon } from '../common/Icon.jsx';
import { useRegulationUpdates, useInsertCirculars } from '../../hooks/useAdmin.js';
import { timeAgo } from '../../lib/time.js';

export const RegulationUpdatesModal = ({ onClose }) => {
  const { t } = useTranslation();
  const { data, isFetching, error, refetch } = useRegulationUpdates(true);
  const insert = useInsertCirculars();

  const [selected, setSelected] = useState(() => new Set());
  const [added, setAdded] = useState(() => new Set());

  useEffect(() => {
    setSelected(new Set());
    setAdded(new Set());
  }, [data?.fetchedAt]);

  const items = data?.items || [];
  const inLibrary = (it) => it.status === 'inserted' || it.status === 'existing' || added.has(it.url);
  const selectable = items.filter((it) => !inLibrary(it));
  const allSelected = selectable.length > 0 && selectable.every((it) => selected.has(it.url));

  const toggle = (url) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(selectable.map((it) => it.url)));

  const doInsert = () => {
    const chosen = items.filter((it) => selected.has(it.url)).map((it) => ({ title: it.title, url: it.url }));
    if (!chosen.length) return;
    insert.mutate(chosen, {
      onSuccess: (res) => {
        setAdded((prev) => {
          const next = new Set(prev);
          (res.results || []).forEach((r) => {
            if (r.status === 'inserted' || r.status === 'existing') next.add(r.url);
          });
          return next;
        });
        setSelected(new Set());
      },
    });
  };

  return (
    <Modal
      title={t('admin.regulations.syncTitle')}
      eyebrow={t('admin.regulations.syncEyebrow')}
      onClose={onClose}
      footer={
        <>
          <button className="ss-btn-ghost mr-auto" onClick={() => refetch()} disabled={isFetching || insert.isPending}>
            <Icon name="refresh" className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            {isFetching ? t('admin.regulations.syncing') : t('admin.regulations.resync')}
          </button>
          <button className="ss-btn-secondary" onClick={onClose}>{t('admin.regulations.done')}</button>
          <button className="ss-btn-primary" onClick={doInsert} disabled={insert.isPending || selected.size === 0}>
            {insert.isPending ? t('admin.regulations.inserting') : t('admin.regulations.insertSelected', { count: selected.size })}
          </button>
        </>
      }
    >
      {isFetching ? (
        <Spinner label={t('admin.regulations.syncingFrom')} />
      ) : error ? (
        <ErrorBanner error={error} />
      ) : data?.ok === false ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {data.error || t('admin.regulations.couldNotFetch')}
        </div>
      ) : data?.ok ? (
        <div className="space-y-3">
          <ErrorBanner error={insert.error} />
          {data.inserted > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
              {t('admin.regulations.autoAdded', { count: data.inserted })}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 ss-eyebrow cursor-pointer">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={!selectable.length} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              {t('admin.regulations.selectAll', { count: selectable.length })}
            </label>
            <span className="font-mono text-[10.5px] text-slate-400 shrink-0">
              {t('admin.regulations.found', { count: items.length })}{data.fetchedAt ? ` · ${timeAgo(data.fetchedAt)}` : ''}
            </span>
          </div>

          <ul className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {items.map((it, i) => {
              const done = inLibrary(it);
              return (
                <li key={i} className="flex items-start gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 transition-colors">
                  {done ? (
                    <span className="mt-0.5 shrink-0">
                      {it.health ? <Icon name="pulse" className="h-4 w-4 text-emerald-600" /> : <span className="text-slate-300">•</span>}
                    </span>
                  ) : (
                    <input
                      type="checkbox"
                      className="mt-1 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selected.has(it.url)}
                      onChange={() => toggle(it.url)}
                    />
                  )}
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 text-sm text-slate-700 hover:text-indigo-600 leading-snug break-words underline decoration-slate-200 hover:decoration-indigo-300 underline-offset-2"
                  >
                    {it.title} <span className="text-slate-300">↗</span>
                  </a>
                  {it.health && (
                    <span className="ss-tag shrink-0 text-emerald-600 bg-emerald-50 hidden sm:inline-flex">
                      <Icon name="pulse" className="h-3 w-3" /> {t('admin.regulations.health')}
                    </span>
                  )}
                  {done && <span className="ss-tag shrink-0 text-emerald-600 bg-emerald-50">{t('admin.regulations.added')}</span>}
                </li>
              );
            })}
          </ul>

          <p className="text-[11px] leading-relaxed text-slate-400">
            <span className="font-medium uppercase tracking-wider">{t('admin.regulations.noteLabel')}</span> {t('admin.regulations.noteBefore')}{' '}
            <strong className="text-slate-700">{t('admin.regulations.insertSelectedShort')}</strong> {t('admin.regulations.noteAfter')}
          </p>
        </div>
      ) : null}
    </Modal>
  );
};

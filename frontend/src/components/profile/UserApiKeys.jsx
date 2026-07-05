import { useTranslation, Trans } from 'react-i18next';
import { Spinner } from '../common/Spinner.jsx';
import { Icon } from '../common/Icon.jsx';
import { ApiKeyCard } from '../admin/ApiKeyCard.jsx';
import { useMyApiKeys, useUpdateMyApiKey, useRequestKeyAccess } from '../../hooks/useUserKeys.js';

// A user's own AI provider keys (Settings). Encrypted at rest; shows whether the
// shared admin key is available so it's not a burden to set one up.
export const UserApiKeys = () => {
  const { t } = useTranslation();
  const { data, isLoading } = useMyApiKeys();
  const request = useRequestKeyAccess();
  const keys = data?.keys || [];
  const canUseAdmin = Boolean(data?.canUseAdminKeys);
  const requested = Boolean(data?.keyAccessRequested);

  return (
    <div className="space-y-3">
      <div>
        <p className="ss-eyebrow">{t('profile.aiProviderKeys')}</p>
        <p className="text-sm text-charcoal mt-1 leading-relaxed">
          <Trans i18nKey="profile.aiProviderKeysDesc" components={{ strong: <strong className="text-ink" /> }} />
        </p>
      </div>

      {canUseAdmin ? (
        <div className="flex items-center gap-2 rounded-xl border border-softgreen/40 bg-softgreen/10 px-4 py-2.5 text-sm text-softgreen">
          <Icon name="check" className="h-4 w-4 shrink-0" />
          {t('profile.adminKeyAllowed')}
        </div>
      ) : (
        <div className="rounded-xl border border-gray/60 bg-paleblue/30 px-4 py-3">
          <p className="text-sm text-charcoal">
            {t('profile.noKeyPrompt')}
          </p>
          {requested ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-softgreen">
              <Icon name="check" className="h-4 w-4" /> {t('profile.requestSent')}
            </p>
          ) : (
            <button
              className="ss-btn-secondary mt-2"
              onClick={() => request.mutate(undefined)}
              disabled={request.isPending}
            >
              {request.isPending ? t('profile.sending') : t('profile.requestAdminKey')}
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <ApiKeyCard key={k.keyName} apiKey={k} useUpdate={useUpdateMyApiKey} />
          ))}
        </div>
      )}
    </div>
  );
};

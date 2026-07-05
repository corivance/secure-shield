import { NavLink } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from '../../constants/navigation.js';
import { currentUserAtom } from '../../store/authAtom.js';
import { Icon } from '../common/Icon.jsx';

const navClass = ({ isActive }) =>
  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
    isActive ? 'bg-paleblue/70 text-ink font-medium' : 'text-charcoal hover:bg-paleblue/40 hover:text-ink'
  }`;

const NavRow = ({ item, index, label }) => (
  <NavLink to={item.to} end={item.to === '/'} className={navClass}>
    {({ isActive }) => (
      <>
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-taupe transition-all duration-200 ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'
          }`}
        />
        <span className="font-mono text-[10.5px] tabular-nums text-charcoal/60 w-5">{index}</span>
        <span className="tracking-tightish">{label}</span>
      </>
    )}
  </NavLink>
);

export const Sidebar = () => {
  const { t } = useTranslation();
  const user = useAtomValue(currentUserAtom);
  const isSuperAdmin = user?.roleSlug === 'super-admin';

  return (
    <aside className="hidden md:flex w-[248px] shrink-0 flex-col sticky top-0 h-screen border-r border-gray/60 bg-white/60 backdrop-blur-2xl">
      {/* Wordmark */}
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-taupe text-white shadow-soft"><Icon name="shield" className="h-5 w-5" /></span>
          <div>
            <p className="ss-display text-[19px] leading-none text-ink">SecureShield</p>
            <p className="ss-eyebrow mt-1.5">Claim Intelligence</p>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="ss-rule" />
      </div>

      {/* Numbered technical nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item, i) => (
          <NavRow key={item.to} item={item} index={String(i + 1).padStart(2, '0')} label={t(item.key)} />
        ))}

        {isSuperAdmin && (
          <div className="pt-4 mt-3 border-t border-gray/50">
            <p className="ss-eyebrow px-3 pb-2 text-charcoal/60">{t('nav.admin')}</p>
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavRow key={item.to} item={item} index="·" label={t(item.key)} />
            ))}
          </div>
        )}
      </nav>

      {/* Status footer */}
      <div className="px-6 py-5 border-t border-gray/50">
        <div className="flex items-center gap-2">
          <span className="ss-dot" />
          <span className="font-mono text-[10.5px] uppercase tracking-eyebrow text-charcoal">Engine online</span>
        </div>
        <p className="ss-eyebrow mt-2 text-charcoal/60">5 Agents · 18 Tools</p>
      </div>
    </aside>
  );
};

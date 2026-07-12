import { NavLink } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useTranslation } from 'react-i18next';
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from '../../constants/navigation.js';
import { currentUserAtom } from '../../store/authAtom.js';
import { Icon } from '../common/Icon.jsx';

const navClass = ({ isActive }) =>
  `group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 ${
    isActive ? 'bg-indigo-50 text-indigo-600 font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
  }`;

const NavRow = ({ item, label }) => (
  <NavLink to={item.to} end={item.to === '/'} className={navClass}>
    {({ isActive }) => (
      <>
        <span
          className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-indigo-600 transition-all duration-150 ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
          }`}
        />
        <Icon name={item.icon} className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </>
    )}
  </NavLink>
);

export const Sidebar = () => {
  const { t } = useTranslation();
  const user = useAtomValue(currentUserAtom);
  const isSuperAdmin = user?.roleSlug === 'super-admin';

  return (
    <aside className="hidden md:flex w-[260px] shrink-0 flex-col sticky top-0 h-screen bg-white border-r border-slate-200">
      {/* Wordmark */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <Icon name="shield" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">SecureShield</p>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Claim Intelligence</p>
          </div>
        </div>
      </div>

      <div className="px-6">
        <div className="ss-rule" />
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.to} item={item} label={t(item.key)} />
        ))}

        {isSuperAdmin && (
          <div className="pt-4 mt-3 border-t border-slate-100">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-3 pb-2">{t('nav.admin')}</p>
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavRow key={item.to} item={item} label={t(item.key)} />
            ))}
          </div>
        )}
      </nav>

      {/* Status footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="ss-dot" />
          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Engine online</span>
        </div>
        <p className="text-[10px] font-medium text-slate-300 uppercase tracking-wider mt-1.5">5 Agents · 18 Tools</p>
      </div>
    </aside>
  );
};

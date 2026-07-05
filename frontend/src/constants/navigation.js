// Sidebar navigation model. In a full RBAC build this resolves from GET /menus/my;
// here it is static but mirrors the feature set.
export const NAV_ITEMS = [
  { to: '/', key: 'nav.dashboard', label: 'Dashboard', icon: 'home' },
  { to: '/policies', key: 'nav.policies', label: 'Policies', icon: 'doc' },
  { to: '/check', key: 'nav.check', label: 'Check Eligibility', icon: 'shield' },
  { to: '/history', key: 'nav.history', label: 'History', icon: 'clock' },
  { to: '/disputes', key: 'nav.disputes', label: 'Disputes', icon: 'scale' },
  { to: '/chat', key: 'nav.chat', label: 'Chat Assistant', icon: 'chat' },
  { to: '/audit', key: 'nav.audit', label: 'Audit Trail', icon: 'list' },
  { to: '/notifications', key: 'nav.notifications', label: 'Notifications', icon: 'bell' },
  { to: '/compare', key: 'nav.compare', label: 'Compare Policies', icon: 'columns' },
  { to: '/compliance', key: 'nav.compliance', label: 'Compliance', icon: 'shield' },
  { to: '/plans', key: 'nav.plans', label: 'Plans', icon: 'card' },
  { to: '/how-it-works', key: 'nav.how', label: 'How It Works', icon: 'info' },
  { to: '/getting-started', key: 'nav.gettingStarted', label: 'Getting Started', icon: 'clipboard' },
  { to: '/settings', key: 'nav.settings', label: 'Settings', icon: 'gear' },
];

// Super-admin only — rendered as a separate section, gated by role in the sidebar.
export const ADMIN_NAV_ITEMS = [
  { to: '/admin/users', key: 'adminNav.users', label: 'Users', icon: 'users' },
  { to: '/admin/regulations', key: 'adminNav.regulations', label: 'Regulations', icon: 'book' },
  { to: '/admin/plans', key: 'adminNav.plans', label: 'Plans', icon: 'card' },
  { to: '/admin/api-keys', key: 'adminNav.apiKeys', label: 'API Keys', icon: 'lock' },
];

export const ROOM_TYPES = ['General', 'Semi-Private', 'Private', 'Single AC', 'Deluxe', 'Suite', 'ICU'];
export const ADMISSION_TYPES = ['Planned', 'Emergency'];

export const VERDICT_META = {
  approved: { label: 'Approved', icon: 'check', color: 'softgreen' },
  partial: { label: 'Partial', icon: 'alert', color: 'beige' },
  denied: { label: 'Denied', icon: 'xcircle', color: 'taupe' },
};

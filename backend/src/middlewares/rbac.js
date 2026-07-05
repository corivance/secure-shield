import { AppError } from '../utils/AppError.js';

// Database-driven RBAC stub. In a full deployment the permission set resolves
// from the user's role; here every authenticated user holds the member
// permission set, with the sanctioned super-admin bypass.
const MEMBER_PERMISSIONS = new Set([
  'policy.create',
  'policy.read',
  'eligibility.run',
  'eligibility.read',
  'dispute.create',
  'chat.use',
  'audit.read',
]);

export const requirePermission = (slug) => {
  return (req, res, next) => {
    // Only sanctioned hardcoded role check: super-admin bypass.
    if (req.user?.roleSlug === 'super-admin') return next();
    if (MEMBER_PERMISSIONS.has(slug)) return next();
    return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN', { slug }));
  };
}

// requireSuperAdmin — gate admin-only endpoints (user management, regulation editing).
export const requireSuperAdmin = (req, res, next) => {
  if (req.user?.roleSlug === 'super-admin') return next();
  return next(new AppError('Super-admin access required', 403, 'FORBIDDEN'));
};

// planGate — gate a feature behind the user's plan.
export const planGate = (feature) => {
  return (req, res, next) => {
    if (req.user?.roleSlug === 'super-admin') return next();
    // All current features available on the free plan.
    void feature;
    return next();
  };
}

// Single source of truth for endpoints — no hardcoded URLs in pages/components.
export const API_BASE = '/api';

export const ENDPOINTS = {
  auth: {
    signup: '/auth/signup',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
    profile: '/auth/profile',
    changePassword: '/auth/change-password',
    apiKeys: '/auth/me/api-keys',
    apiKey: (keyName) => `/auth/me/api-keys/${keyName}`,
    requestApiKey: '/auth/me/api-keys/request',
  },
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    readAll: '/notifications/read-all',
    read: (id) => `/notifications/${id}/read`,
  },
  compliance: {
    regulations: '/regulations',
  },
  plans: {
    list: '/plans',
    checkout: '/plans/checkout',
    verify: '/plans/verify',
  },
  admin: {
    apiKeys: '/admin/api-keys',
    apiKey: (keyName) => `/admin/api-keys/${keyName}`,
    users: '/admin/users',
    user: (id) => `/admin/users/${id}`,
    regulations: '/admin/regulations',
    regulation: (id) => `/admin/regulations/${id}`,
    plans: '/admin/plans',
    plan: (id) => `/admin/plans/${id}`,
    translations: '/admin/translations',
    fetchRegulationUpdates: '/admin/regulations/fetch-updates',
    insertCirculars: '/admin/regulations/insert-circulars',
    extractCircular: '/admin/regulations/extract-circular',
  },
  system: {
    health: '/health',
    info: '/system-info',
    autoKey: '/auto-key',
  },
  policy: {
    upload: '/upload-policy',
    list: '/policies',
    detail: (id) => `/policies/${id}`,
    update: (id) => `/policies/${id}`,
    remove: (id) => `/policies/${id}`,
  },
  eligibility: {
    check: '/check-eligibility',
    history: '/history',
    detail: (id) => `/checks/${id}`,
  },
  dispute: {
    create: '/dispute-claim',
    detail: (id) => `/disputes/${id}`,
    download: (filename) => `/download-report/${filename}`,
  },
  chat: {
    ask: '/chat',
    history: '/chat/history',
  },
  audit: {
    trail: '/audit-trail',
    run: (runId) => `/audit-trail/${runId}`,
  },
  compare: {
    create: '/compare',
    list: '/comparisons',
    detail: (id) => `/comparisons/${id}`,
    remove: (id) => `/comparisons/${id}`,
  },
};

import axios from 'axios';
import { API_BASE, ENDPOINTS } from '../constants/apiEndpoints.js';

const TOKEN_KEY = 'ss_access_token';
const REFRESH_KEY = 'ss_refresh_token';
const APIKEY_KEY = 'ss_api_key';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  getApiKey: () => localStorage.getItem(APIKEY_KEY),
  set: ({ accessToken, refreshToken }) => {
    if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  setApiKey: (k) => localStorage.setItem(APIKEY_KEY, k),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// Authenticated client. Every request attaches the JWT, with an X-API-Key
// fallback for local/CLI/MCP use when no session exists.
export const apiClient = axios.create({ baseURL: API_BASE });

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const apiKey = tokenStore.getApiKey();
    if (apiKey) config.headers['X-API-Key'] = apiKey;
  }
  return config;
});

// A bare client without interceptors (used for refresh + public calls).
export const bareClient = axios.create({ baseURL: API_BASE });

let refreshing = null;

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    if (status === 401 && !original._retry && tokenStore.getRefresh()) {
      original._retry = true;
      try {
        refreshing =
          refreshing ||
          bareClient.post(ENDPOINTS.auth.refresh, { refreshToken: tokenStore.getRefresh() });
        const { data } = await refreshing;
        refreshing = null;
        tokenStore.set(data.data);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(original);
      } catch (e) {
        refreshing = null;
        tokenStore.clear();
        if (typeof window !== 'undefined') window.location.assign('/login');
        return Promise.reject(e);
      }
    }
    return Promise.reject(error);
  }
);

// Normalize the API error contract into a thrown Error with code/details.
export const toApiError = (err) => {
  const body = err?.response?.data;
  const message = body?.message || err.message || 'Request failed';
  const out = new Error(message);
  out.code = body?.error?.code || 'UNKNOWN';
  out.details = body?.error?.details || {};
  out.status = err?.response?.status;
  return out;
}

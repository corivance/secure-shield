import { atom } from 'jotai';
import { tokenStore } from '../lib/apiClient.js';

// UI/client auth state only (never server data — TanStack Query owns that).
export const currentUserAtom = atom(null);

export const isAuthenticatedAtom = atom((get) => Boolean(get(currentUserAtom)) || Boolean(tokenStore.get()));

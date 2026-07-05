import { atom } from 'jotai';

// Transient UI state.
export const sidebarOpenAtom = atom(true);
export const toastAtom = atom(null); // { type, message }
export const pipelineStepsAtom = atom([]); // live agent-step feed for the check page

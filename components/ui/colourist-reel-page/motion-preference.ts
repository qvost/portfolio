import { useSyncExternalStore } from 'react';

const media = typeof window === 'undefined' ? null : window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe = (notify: () => void) => {
  media?.addEventListener('change', notify);
  return () => media?.removeEventListener('change', notify);
};
const getSnapshot = () => media?.matches ?? true;

/** Subscribe explicitly so mounted effects respond to preference changes. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

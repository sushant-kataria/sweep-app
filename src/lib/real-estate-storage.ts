import type { RealEstateSession } from './real-estate-types';

const KEY = 'sweep_real_estate_session';

export function saveRealEstateSession(session: RealEstateSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function loadRealEstateSession(): RealEstateSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RealEstateSession;
  } catch {
    return null;
  }
}

export function clearRealEstateSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
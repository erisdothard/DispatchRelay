import { useState, useCallback } from 'react';

const CONSENT_KEY = 'fx-gps-consent';

interface GpsConsent {
  granted: boolean;
  timestamp: string;
}

function readConsent(): GpsConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GpsConsent;
  } catch {
    return null;
  }
}

export function useGpsConsent() {
  const [consent, setConsent] = useState<GpsConsent | null>(readConsent);

  const hasConsented = consent?.granted === true;

  const grantConsent = useCallback(() => {
    const c: GpsConsent = { granted: true, timestamp: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(c));
    setConsent(c);
  }, []);

  const revokeConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    setConsent(null);
  }, []);

  return { hasConsented, grantConsent, revokeConsent };
}

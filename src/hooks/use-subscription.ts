'use client';

import { useCallback, useEffect, useState } from 'react';

export type SubscriptionState = {
  loading: boolean;
  signedIn: boolean;
  pro: boolean;
  email: string | null;
  subscriptionStatus: string | null;
  refresh: () => Promise<void>;
};

export function useSubscription(): SubscriptionState {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [pro, setPro] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/me/subscription');
      const data = await res.json();
      setSignedIn(Boolean(data.signedIn));
      setPro(Boolean(data.pro));
      setEmail(data.email ?? null);
      setSubscriptionStatus(data.subscriptionStatus ?? null);
    } catch {
      setSignedIn(false);
      setPro(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loading, signedIn, pro, email, subscriptionStatus, refresh };
}

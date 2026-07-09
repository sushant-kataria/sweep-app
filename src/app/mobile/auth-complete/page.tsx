'use client';

import { useEffect, useState } from 'react';

/**
 * Client landing after WorkOS cookie session is established.
 * Fetches a bearer token and deep-links back into the iOS app.
 */
export default function MobileAuthCompleteClient() {
  const [status, setStatus] = useState<'working' | 'done' | 'error'>('working');
  const [message, setMessage] = useState('Finishing sign-in…');

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch('/api/mobile/token', { method: 'POST', credentials: 'include' });
        const data = (await res.json()) as { accessToken?: string; error?: string; user?: { email?: string } };
        if (!res.ok || !data.accessToken) {
          throw new Error(data.error || 'Could not mint mobile token');
        }
        if (cancelled) return;
        setStatus('done');
        setMessage('Returning to Sweep…');
        const email = data.user?.email ? `&email=${encodeURIComponent(data.user.email)}` : '';
        window.location.href = `sweep://auth?token=${encodeURIComponent(data.accessToken)}${email}`;
      } catch (error) {
        if (cancelled) return;
        const text = error instanceof Error ? error.message : 'Sign-in failed';
        setStatus('error');
        setMessage(text);
        window.location.href = `sweep://auth?error=${encodeURIComponent(text)}`;
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-dvh flex items-center justify-center bg-black text-white px-6">
      <div className="max-w-sm text-center space-y-3">
        <p className="font-pixel text-2xl tracking-wide">Sweep</p>
        <p className="text-sm text-white/70">{message}</p>
        {status === 'error' && (
          <p className="text-xs text-red-300">You can close this window and try again in the app.</p>
        )}
      </div>
    </main>
  );
}

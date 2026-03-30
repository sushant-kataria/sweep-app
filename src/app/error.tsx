'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-8 gap-6">
      <h2 className="text-white/60 text-sm font-mono">Something went wrong</h2>
      <div className="w-full max-w-xl bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="text-red-400 text-xs font-mono break-all">{error.message}</p>
        {error.stack && (
          <pre className="mt-3 text-red-400/50 text-[10px] font-mono overflow-x-auto whitespace-pre-wrap">
            {error.stack}
          </pre>
        )}
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 text-xs text-white/50 border border-white/10 rounded-lg hover:bg-white/5"
      >
        Try again
      </button>
    </div>
  );
}

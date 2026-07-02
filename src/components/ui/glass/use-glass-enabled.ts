'use client';

import { useEffect, useState } from 'react';

const GLASS_MEDIA = '(max-width: 1023px)';

function prefersReducedTransparency(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
}

/**
 * Liquid glass is enabled on mobile/tablet when transparency is allowed.
 * Desktop keeps existing flat chrome until later phases.
 */
export function useGlassEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(GLASS_MEDIA);
    const rt = window.matchMedia('(prefers-reduced-transparency: reduce)');

    const update = () => {
      setEnabled(mq.matches && !rt.matches);
    };

    update();
    mq.addEventListener('change', update);
    rt.addEventListener('change', update);
    return () => {
      mq.removeEventListener('change', update);
      rt.removeEventListener('change', update);
    };
  }, []);

  return enabled;
}

export { prefersReducedTransparency, GLASS_MEDIA };

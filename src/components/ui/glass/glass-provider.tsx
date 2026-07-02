'use client';

import { GlassFilters } from 'glass-refraction';

type Props = {
  children: React.ReactNode;
};

/**
 * Mounts SVG refraction filters once at the app root.
 * Softer displacement on mobile for scroll performance.
 */
export function GlassProvider({ children }: Props) {
  return (
    <>
      <GlassFilters scale={6} strongScale={11} baseFrequency="0.014 0.011" numOctaves={2} seed={42} />
      {children}
    </>
  );
}

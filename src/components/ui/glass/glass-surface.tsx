'use client';

import { Glass } from 'glass-refraction';
import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useGlassEnabled } from '@/components/ui/glass/use-glass-enabled';

type Props<T extends ElementType = 'div'> = {
  as?: T;
  className?: string;
  children?: ReactNode;
  /** Apply refraction SVG filter (mobile chrome). */
  refract?: boolean;
  /** Force glass even on desktop (hero/marketing). */
  force?: boolean;
};

export function GlassSurface<T extends ElementType = 'div'>({
  as,
  className,
  children,
  refract = true,
  force = false,
}: Props<T>) {
  const glassEnabled = useGlassEnabled();
  const Comp = (as ?? 'div') as ElementType;

  if (!glassEnabled && !force) {
    return <Comp className={className}>{children}</Comp>;
  }

  return (
    <Glass
      as={Comp}
      variant="glass"
      className={cn('sweep-glass-surface', refract && 'sweep-glass-refract', className)}
    >
      {children}
    </Glass>
  );
}

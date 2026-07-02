'use client';

import { GlassPill as GlassPillPrimitive } from 'glass-refraction';
import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useGlassEnabled } from '@/components/ui/glass/use-glass-enabled';

type Props<T extends ElementType = 'span'> = {
  as?: T;
  className?: string;
  children?: ReactNode;
  force?: boolean;
};

export function GlassPill<T extends ElementType = 'span'>({
  as,
  className,
  children,
  force = false,
}: Props<T>) {
  const glassEnabled = useGlassEnabled();
  const Comp = (as ?? 'span') as ElementType;

  if (!glassEnabled && !force) {
    return <Comp className={className}>{children}</Comp>;
  }

  return (
    <GlassPillPrimitive as={Comp} className={cn('sweep-glass-pill', className)}>
      {children}
    </GlassPillPrimitive>
  );
}

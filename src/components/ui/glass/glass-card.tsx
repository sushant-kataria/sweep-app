'use client';

import { GlassCard as GlassCardPrimitive } from 'glass-refraction';
import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useGlassEnabled } from '@/components/ui/glass/use-glass-enabled';

type Props<T extends ElementType = 'div'> = {
  as?: T;
  className?: string;
  children?: ReactNode;
  hoverable?: boolean;
  refract?: boolean;
  force?: boolean;
};

export function GlassCard<T extends ElementType = 'div'>({
  as,
  className,
  children,
  hoverable = true,
  refract = false,
  force = false,
}: Props<T>) {
  const glassEnabled = useGlassEnabled();
  const Comp = (as ?? 'div') as ElementType;

  if (!glassEnabled && !force) {
    return <Comp className={className}>{children}</Comp>;
  }

  return (
    <GlassCardPrimitive
      as={Comp}
      hoverable={hoverable}
      className={cn('sweep-glass-card', refract && 'sweep-glass-refract', className)}
    >
      {children}
    </GlassCardPrimitive>
  );
}

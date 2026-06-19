'use client';

import { useEffect, useRef, useState } from 'react';

const WORD = 'Sweep';
const LETTER_MS = 140;
const PAUSE_MS = 900;

type Phase = 'forward' | 'reverse';

type AnimState = {
  phase: Phase;
  count: number;
};

type SweepWordmarkProps = {
  className?: string;
};

function nextAnimState(current: AnimState): { state: AnimState; delay: number; done: boolean } {
  if (current.phase === 'forward') {
    if (current.count < WORD.length) {
      return { state: { phase: 'forward', count: current.count + 1 }, delay: LETTER_MS, done: false };
    }
    return { state: { phase: 'reverse', count: 0 }, delay: PAUSE_MS, done: false };
  }

  if (current.count < WORD.length) {
    return { state: { phase: 'reverse', count: current.count + 1 }, delay: LETTER_MS, done: false };
  }

  return { state: { phase: 'reverse', count: WORD.length }, delay: 0, done: true };
}

export function SweepWordmark({ className = '' }: SweepWordmarkProps) {
  const [anim, setAnim] = useState<AnimState>({ phase: 'forward', count: 0 });
  const animRef = useRef(anim);

  animRef.current = anim;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;

      const result = nextAnimState(animRef.current);
      if (result.done) return;

      setAnim(result.state);
      timer = setTimeout(tick, result.delay);
    };

    timer = setTimeout(tick, LETTER_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const visible = new Set<number>();
  if (anim.phase === 'forward') {
    for (let i = 0; i < anim.count; i++) visible.add(i);
  } else {
    for (let i = 0; i < anim.count; i++) {
      visible.add(WORD.length - 1 - i);
    }
  }

  return (
    <span className={`sweep-wordmark inline-flex items-center ${className}`} aria-label="Sweep">
      {WORD.split('').map((letter, i) => (
        <span
          key={i}
          className={`sweep-wordmark-letter ${visible.has(i) ? 'sweep-wordmark-letter--on' : ''}`}
        >
          {visible.has(i) ? letter : '\u00A0'}
        </span>
      ))}
    </span>
  );
}
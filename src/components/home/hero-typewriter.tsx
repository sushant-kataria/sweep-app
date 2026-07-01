'use client';

import { useEffect, useState } from 'react';

const WORDS = ['Equity', 'Finance', 'Stock', 'Real Estate'] as const;
const FINAL_WORD = 'your asset';
const TYPE_MS = 72;
const DELETE_MS = 40;
const PAUSE_MS = 2200;

type Phase = 'words' | 'finale' | 'done';

export function HeroTypewriter() {
  const [phase, setPhase] = useState<Phase>('words');
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (phase === 'done') return;

    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'finale') {
      if (text === FINAL_WORD) {
        setPhase('done');
        return;
      }
      timer = setTimeout(() => setText(FINAL_WORD.slice(0, text.length + 1)), TYPE_MS);
      return () => clearTimeout(timer);
    }

    const target = WORDS[wordIndex];
    const isLastWord = wordIndex === WORDS.length - 1;

    if (!deleting && text === target) {
      timer = setTimeout(() => setDeleting(true), PAUSE_MS);
    } else if (deleting && text === '') {
      timer = setTimeout(() => {
        setDeleting(false);
        if (isLastWord) setPhase('finale');
        else setWordIndex((i) => i + 1);
      }, TYPE_MS);
    } else if (deleting) {
      timer = setTimeout(() => setText(target.slice(0, text.length - 1)), DELETE_MS);
    } else {
      timer = setTimeout(() => setText(target.slice(0, text.length + 1)), TYPE_MS);
    }

    return () => clearTimeout(timer);
  }, [text, deleting, wordIndex, phase]);

  return (
    <span className="home-hero-typewriter-line">
      <span className="home-hero-title-accent" aria-live="polite">
        for <span className="home-hero-typewriter-word">{text}</span>
      </span>
      {phase !== 'done' && (
        <span className="home-hero-typewriter-cursor" aria-hidden>
          |
        </span>
      )}
    </span>
  );
}
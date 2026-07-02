'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_STORAGE_KEY = 'sweep-finance-split';
const MIN_RATIO = 0.12;
const MAX_RATIO = 0.88;
const DEFAULT_RATIO = 0.58;

type Orientation = 'horizontal' | 'vertical';

type Props = {
  start: React.ReactNode;
  end: React.ReactNode;
  /** Initial start-pane share (0–1). Defaults to 0.58. */
  defaultRatio?: number;
  /** localStorage key for persisted split ratio. */
  storageKey?: string;
};

export function FinanceSplitView({
  start,
  end,
  defaultRatio = DEFAULT_RATIO,
  storageKey = DEFAULT_STORAGE_KEY,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const [dragging, setDragging] = useState(false);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const ratioRef = useRef(ratio);

  ratioRef.current = ratio;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const n = parseFloat(saved);
      if (Number.isFinite(n)) setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, n)));
    } else {
      setRatio(defaultRatio);
    }
  }, [defaultRatio, storageKey]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setOrientation(mq.matches ? 'horizontal' : 'vertical');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const updateRatio = useCallback((clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const raw =
      orientation === 'horizontal'
        ? (clientX - rect.left) / rect.width
        : (clientY - rect.top) / rect.height;
    setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, raw)));
  }, [orientation]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => updateRatio(e.clientX, e.clientY);
    const onUp = () => {
      setDragging(false);
      localStorage.setItem(storageKey, String(ratioRef.current));
      document.body.classList.remove('finance-split-dragging', 'finance-split-dragging--vertical');
    };

    document.body.classList.add('finance-split-dragging');
    if (orientation === 'vertical') document.body.classList.add('finance-split-dragging--vertical');
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.classList.remove('finance-split-dragging', 'finance-split-dragging--vertical');
    };
  }, [dragging, updateRatio, orientation]);

  const startPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
    updateRatio(e.clientX, e.clientY);
  };

  const resetSplit = () => {
    setRatio(defaultRatio);
    localStorage.setItem(storageKey, String(defaultRatio));
  };

  const startPct = `${ratio * 100}%`;
  const endPct = `${(1 - ratio) * 100}%`;

  return (
    <div
      ref={containerRef}
      className={`finance-split finance-split--${orientation} ${dragging ? 'finance-split--active' : ''}`}
    >
      <div
        className="finance-split-pane finance-split-pane--start"
        style={orientation === 'horizontal' ? { width: startPct } : { height: startPct }}
      >
        {start}
      </div>

      <div
        role="separator"
        aria-orientation={orientation === 'horizontal' ? 'vertical' : 'horizontal'}
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={Math.round(MIN_RATIO * 100)}
        aria-valuemax={Math.round(MAX_RATIO * 100)}
        className="finance-split-handle"
        onPointerDown={startPointer}
        onDoubleClick={resetSplit}
        title="Drag to resize · double-click to reset"
      >
        <span className="finance-split-handle-grip" aria-hidden />
      </div>

      <div
        className="finance-split-pane finance-split-pane--end"
        style={orientation === 'horizontal' ? { width: endPct } : { height: endPct }}
      >
        {end}
      </div>
    </div>
  );
}
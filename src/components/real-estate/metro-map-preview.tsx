'use client';

import { dealScoreColor, type MapMetroLite } from '@/lib/real-estate-market/map-data';

type Theme = 'light' | 'dark';

/** Rough US bounds for preview dot placement. */
function project(lat: number, lng: number, w: number, h: number) {
  const x = ((lng + 130) / 65) * w;
  const y = ((50 - lat) / 27) * h;
  return { x: Math.max(8, Math.min(w - 8, x)), y: Math.max(8, Math.min(h - 8, y)) };
}

type Props = {
  metros: MapMetroLite[];
  theme: Theme;
};

export function MetroMapPreview({ metros, theme }: Props) {
  const w = 800;
  const h = 420;

  return (
    <div className="re-map-preview" aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} className="re-map-preview-svg" preserveAspectRatio="xMidYMid slice">
        <rect width={w} height={h} className="re-map-preview-bg" />
        {metros.map((m) => {
          const { x, y } = project(m.lat, m.lng, w, h);
          return (
            <circle
              key={m.slug}
              cx={x}
              cy={y}
              r={9}
              fill={dealScoreColor(m.dealScoreTop ?? 50)}
              className="re-map-preview-dot"
            />
          );
        })}
      </svg>
      <div className="re-map-preview-label">
        <span className="re-map-preview-spinner" />
        Loading interactive map…
      </div>
    </div>
  );
}

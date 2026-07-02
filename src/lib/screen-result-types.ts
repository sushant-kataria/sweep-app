/** Screener.in-style result row for finance screen pages. */

import type { FreeSamplePreview } from '@/lib/free-tier-copy';

export type ScreenResultRow = {
  ticker: string;
  companyName: string;
  price: number | null;
  pe: number | null;
  /** Market cap in USD (full dollars). */
  marketCap: number | null;
  volume: number | null;
  changePct: number | null;
  /** Live scan score or screen-specific metric. */
  score: number | null;
  /** Human-readable signal (RSI value, crossover hint, etc.). */
  signal: string | null;
  rsi: number | null;
};

export type ScreenColumnId =
  | 'price'
  | 'pe'
  | 'marketCap'
  | 'volume'
  | 'changePct'
  | 'score'
  | 'signal'
  | 'rsi';

export type ScreenColumnDef = {
  id: ScreenColumnId;
  label: string;
  /** Screen-specific column label override (e.g. "Piotski Scr"). */
  altLabel?: string;
};

export const DEFAULT_SCREEN_COLUMNS: ScreenColumnDef[] = [
  { id: 'price', label: 'CMP $' },
  { id: 'pe', label: 'P/E' },
  { id: 'marketCap', label: 'Mar Cap $B' },
  { id: 'volume', label: 'Volume' },
  { id: 'changePct', label: 'Change %' },
];

export type ScreenResultsPayload = {
  id: string;
  title: string;
  description: string;
  formula?: string;
  defaultQuery: string;
  live: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
  columns: ScreenColumnDef[];
  rows: ScreenResultRow[];
  /** True when a live screen fell back to its starter ticker list. */
  fallback?: boolean;
  scanNote?: string;
  /** Structured free-tier sample metadata for UI. */
  samplePreview?: FreeSamplePreview;
  /** Free tier preview — full results require Pro. */
  preview?: boolean;
};

import type { ScreenResultRow } from './screen-result-types';

export type QueryField =
  | 'price'
  | 'pe'
  | 'marketCap'
  | 'volume'
  | 'changePct'
  | 'rsi'
  | 'score';

type QueryClause = {
  field: QueryField;
  op: '>' | '>=' | '<' | '<=' | '=' | '!=';
  value: number;
};

const FIELD_ALIASES: Record<string, QueryField> = {
  price: 'price',
  cmp: 'price',
  'last price': 'price',
  pe: 'pe',
  'p/e': 'pe',
  'price to earning': 'pe',
  'price to earnings': 'pe',
  'market cap': 'marketCap',
  'mar cap': 'marketCap',
  marketcap: 'marketCap',
  volume: 'volume',
  'change %': 'changePct',
  change: 'changePct',
  'change pct': 'changePct',
  rsi: 'rsi',
  score: 'score',
  'piotroski score': 'score',
  'piotski scr': 'score',
  'piotski score': 'score',
  fscore: 'score',
  'f-score': 'score',
};

/** Default editable query per screen (US market units: cap in billions). */
export const SCREEN_DEFAULT_QUERIES: Record<string, string> = {
  'piotroski-scan': 'Piotroski score >= 8',
  'magic-formula': 'P/E < 25 AND Market cap > 10',
  'coffee-can-portfolio': 'P/E < 35 AND Market cap > 50',
  'garp-stocks': 'P/E < 40 AND Market cap > 5',
  'quality-businesses': 'P/E < 30 AND Market cap > 20',
  'darvas-scan': 'Price > 10 AND Volume > 100000',
  'golden-crossover': 'Market cap > 10',
  'bearish-crossovers': 'Market cap > 5',
  'price-volume-action': 'Volume > 100000',
  'rsi-oversold': 'RSI < 30',
  'breakout-stocks': 'Price > 10 AND Volume > 100000',
  'stocks-near-200-dma': 'Market cap > 50',
  'companies-creating-new-high': 'Market cap > 10',
  'low-from-52w-high': 'Market cap > 1',
  'good-stocks-near-52w-low': 'Volume > 300000 AND Market cap > 1',
  'highest-dividend-yield': 'Market cap > 5',
  'fcf-yield': 'Market cap > 10',
  'value-stocks': 'P/E < 20 AND Market cap > 1',
  'debt-free-companies': 'Market cap > 20',
  'undervalued-stocks': 'P/E < 15 AND Market cap > 2',
  'bluest-blue-chips': 'Market cap > 100',
  'growth-stocks': 'P/E < 50 AND Market cap > 10',
  'fundamentally-strong': 'P/E < 35 AND Market cap > 20',
  'canslim-style': 'Market cap > 5',
  'peter-lynch-growth': 'P/E < 35 AND Market cap > 2',
};

export function getDefaultScreenQuery(screenId: string, formula?: string): string {
  return SCREEN_DEFAULT_QUERIES[screenId] ?? formula ?? 'Market cap > 1';
}

function normalizeField(raw: string): QueryField | null {
  const key = raw.trim().toLowerCase().replace(/\s+/g, ' ');
  return FIELD_ALIASES[key] ?? null;
}

function parseClause(part: string): QueryClause | null {
  const trimmed = part.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(.+?)\s*(>=|<=|!=|=|>|<)\s*(-?\d+(?:\.\d+)?)\s*$/i);
  if (!match) return null;

  const field = normalizeField(match[1]);
  if (!field) return null;

  return {
    field,
    op: match[2] as QueryClause['op'],
    value: Number(match[3]),
  };
}

export function parseScreenQuery(query: string): QueryClause[] {
  const normalized = query.replace(/\n/g, ' ').trim();
  if (!normalized) return [];

  const parts = normalized.split(/\s+AND\s+/i);
  const clauses: QueryClause[] = [];

  for (const part of parts) {
    const clause = parseClause(part);
    if (clause) clauses.push(clause);
  }

  return clauses;
}

function rowValue(row: ScreenResultRow, field: QueryField): number | null {
  switch (field) {
    case 'price':
      return row.price;
    case 'pe':
      return row.pe;
    case 'marketCap':
      return row.marketCap != null ? row.marketCap / 1e9 : null;
    case 'volume':
      return row.volume;
    case 'changePct':
      return row.changePct;
    case 'rsi':
      return row.rsi;
    case 'score':
      return row.score;
    default:
      return null;
  }
}

function compare(actual: number, op: QueryClause['op'], expected: number): boolean {
  switch (op) {
    case '>':
      return actual > expected;
    case '>=':
      return actual >= expected;
    case '<':
      return actual < expected;
    case '<=':
      return actual <= expected;
    case '=':
      return actual === expected;
    case '!=':
      return actual !== expected;
    default:
      return false;
  }
}

export function filterRowsByQuery(rows: ScreenResultRow[], query: string): ScreenResultRow[] {
  const clauses = parseScreenQuery(query);
  if (clauses.length === 0) return rows;

  return rows.filter((row) =>
    clauses.every((clause) => {
      const value = rowValue(row, clause.field);
      if (value == null || !Number.isFinite(value)) return false;
      return compare(value, clause.op, clause.value);
    }),
  );
}

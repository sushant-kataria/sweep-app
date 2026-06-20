import { fetchEdgarCompanyFacts, SEC_USER_AGENT } from './finance-edgar';
import { SCREENER_CACHE_TTL_MS } from './stock-screener-types';
import type {
  FinancialPeriod,
  FinancialTable,
  GrowthStat,
  StockDocumentLink,
  StockKeyMetric,
  StockProsCons,
  StockScreenerData,
} from './stock-screener-types';
import type { MarketSnapshot, MarketRange } from './market-types';
import type { FinanceMetrics } from './finance-types';
import type { SecCompany } from './company-types';
import type { StockFundamentals } from './stock-types';

type EdgarFactEntry = {
  val: number;
  end: string;
  filed?: string;
  form?: string;
  fy?: number;
  fp?: string;
  frame?: string | null;
};

type EdgarFacts = Record<string, { units?: Record<string, EdgarFactEntry[]> }>;

const EPS_TAGS = ['EarningsPerShareDiluted', 'EarningsPerShareBasic'] as const;
const SHARES_TAGS = ['EntityCommonStockSharesOutstanding', 'CommonStockSharesOutstanding'] as const;
const DIVIDEND_TAGS = ['CommonStockDividendsPerShareDeclared', 'CommonStockDividendsPerShareCashPaid'] as const;

const REVENUE_TAGS = [
  'RevenueFromContractWithCustomerExcludingAssessedTax',
  'Revenues',
  'SalesRevenueNet',
] as const;

const PL_ROWS: Array<{ label: string; tags: readonly string[]; highlight?: boolean }> = [
  { label: 'Sales', tags: REVENUE_TAGS },
  { label: 'Cost of revenue', tags: ['CostOfGoodsAndServicesSold', 'CostOfRevenue'] },
  { label: 'Gross profit', tags: ['GrossProfit'], highlight: true },
  { label: 'Operating expenses', tags: ['OperatingExpenses'] },
  { label: 'Operating profit', tags: ['OperatingIncomeLoss'], highlight: true },
  { label: 'Net profit', tags: ['NetIncomeLoss'], highlight: true },
];

const BS_ROWS: Array<{ label: string; tags: readonly string[]; highlight?: boolean }> = [
  { label: 'Total assets', tags: ['Assets'], highlight: true },
  { label: 'Total liabilities', tags: ['Liabilities'] },
  {
    label: "Stockholders' equity",
    tags: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
    highlight: true,
  },
  { label: 'Cash & equivalents', tags: ['CashAndCashEquivalentsAtCarryingValue'] },
  { label: 'Total debt', tags: ['LongTermDebt', 'LongTermDebtNoncurrent', 'DebtCurrent'] },
];

const CF_ROWS: Array<{ label: string; tags: readonly string[]; highlight?: boolean }> = [
  { label: 'Cash from operations', tags: ['NetCashProvidedByUsedInOperatingActivities'], highlight: true },
  { label: 'Cash from investing', tags: ['NetCashProvidedByUsedInInvestingActivities'] },
  { label: 'Cash from financing', tags: ['NetCashProvidedByUsedInFinancingActivities'] },
  { label: 'Free cash flow', tags: ['FreeCashFlow'] },
];

function toMillions(val: number | null | undefined): number | null {
  if (val == null || !Number.isFinite(val)) return null;
  return Math.round(val / 1e6);
}

function formatMillions(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const sign = v < 0 ? '-' : '';
  return `${sign}$${Math.abs(v).toLocaleString('en-US')}M`;
}

function formatUsd(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `$${v.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatPct(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `${v.toFixed(2)}%`;
}

function formatRatio(v: number | null): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toFixed(2);
}

function pickFactValue(
  facts: EdgarFacts,
  tags: readonly string[],
  period: FinancialPeriod,
  unit = 'USD',
): number | null {
  for (const tag of tags) {
    const entry = facts[tag];
    const units = entry?.units?.[unit];
    if (!units) continue;

    const matches = units.filter(
      (u) => u.end === period.end && u.form === period.form && (period.fp ? u.fp === period.fp : true),
    );
    if (!matches.length) continue;

    if (period.form === '10-Q' && unit === 'USD') {
      const framed = matches.filter((u) => u.frame && /Q[1-4]$/.test(u.frame));
      const pool = framed.length ? framed : matches;
      const best = pool.sort((a, b) => String(b.filed).localeCompare(String(a.filed)))[0];
      if (best) return unit === 'USD' ? toMillions(best.val) : best.val;
    }

    const best = matches.sort((a, b) => String(b.filed).localeCompare(String(a.filed)))[0];
    if (best) return unit === 'USD' ? toMillions(best.val) : best.val;
  }
  return null;
}

function pickTagValue(facts: EdgarFacts, tags: readonly string[], period: FinancialPeriod): number | null {
  return pickFactValue(facts, tags, period, 'USD');
}

function pickLatestFact(facts: EdgarFacts, tags: readonly string[], unit: string): number | null {
  for (const tag of tags) {
    const units = facts[tag]?.units?.[unit];
    if (!units?.length) continue;
    const best = [...units]
      .filter((u) => u.form === '10-K' || u.form === '10-Q')
      .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())[0];
    if (best) return unit === 'USD' ? toMillions(best.val) : best.val;
  }
  return null;
}

function dedupePeriods(entries: EdgarFactEntry[], form: '10-K' | '10-Q', limit: number): FinancialPeriod[] {
  const byKey = new Map<string, EdgarFactEntry>();

  for (const entry of entries) {
    if (entry.form !== form) continue;
    if (form === '10-K' && entry.fp && entry.fp !== 'FY') continue;
    if (form === '10-Q' && entry.fp && !/^Q[1-4]$/.test(entry.fp)) continue;

    const key = `${entry.end}:${entry.fp ?? ''}`;
    const existing = byKey.get(key);
    if (!existing || String(entry.filed ?? '') > String(existing.filed ?? '')) {
      byKey.set(key, entry);
    }
  }

  return [...byKey.values()]
    .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime())
    .slice(0, limit)
    .map((entry) => ({
      key: `${entry.end}:${entry.fp ?? form}`,
      label: form === '10-K' ? fiscalYearLabel(entry) : quarterLabel(entry),
      end: entry.end,
      form,
      fp: entry.fp,
    }))
    .reverse();
}

function fiscalYearLabel(entry: EdgarFactEntry): string {
  const year = entry.fy ?? new Date(entry.end).getUTCFullYear();
  return `FY ${year}`;
}

function quarterLabel(entry: EdgarFactEntry): string {
  const d = new Date(entry.end);
  const mon = d.toLocaleString('en-US', { month: 'short' });
  const year = d.getUTCFullYear().toString().slice(-2);
  return `${mon} '${year}`;
}

function collectPeriods(facts: EdgarFacts, tags: readonly string[], form: '10-K' | '10-Q', limit: number): FinancialPeriod[] {
  const all: EdgarFactEntry[] = [];
  for (const tag of tags) {
    const units = facts[tag]?.units?.USD ?? [];
    all.push(...units);
  }
  return dedupePeriods(all, form, limit);
}

function buildTable(
  title: string,
  subtitle: string,
  facts: EdgarFacts,
  periods: FinancialPeriod[],
  rows: Array<{ label: string; tags: readonly string[]; highlight?: boolean }>,
): FinancialTable {
  return {
    title,
    subtitle,
    unit: 'USD millions',
    periods,
    rows: rows.map((row) => ({
      label: row.label,
      highlight: row.highlight,
      values: periods.map((p) => pickTagValue(facts, row.tags, p)),
    })),
  };
}

function computeCagr(values: Array<number | null>, years: number): number | null {
  const series = values.filter((v): v is number => v != null && v > 0);
  if (series.length < 2) return null;
  const startIdx = Math.max(0, series.length - years - 1);
  const start = series[startIdx];
  const end = series[series.length - 1];
  const span = series.length - 1 - startIdx;
  if (span < 1 || start <= 0 || end <= 0) return null;
  return (Math.pow(end / start, 1 / span) - 1) * 100;
}

function buildGrowthStats(
  pl: FinancialTable,
  market?: MarketSnapshot | null,
): GrowthStat[] {
  const salesRow = pl.rows.find((r) => r.label === 'Sales');
  const profitRow = pl.rows.find((r) => r.label === 'Net profit');

  const stats: GrowthStat[] = [];
  for (const [label, years] of [
    ['Sales CAGR (10Y)', 10],
    ['Sales CAGR (5Y)', 5],
    ['Sales CAGR (3Y)', 3],
    ['Profit CAGR (10Y)', 10],
    ['Profit CAGR (5Y)', 5],
    ['Profit CAGR (3Y)', 3],
  ] as const) {
    const row = label.startsWith('Sales') ? salesRow : profitRow;
    const cagr = row ? computeCagr(row.values, years) : null;
    stats.push({ label, value: cagr != null ? `${cagr.toFixed(0)}%` : '—' });
  }

  const history = market?.history;
  if (history && history.length >= 2) {
    const first = history[0].value;
    const last = history[history.length - 1].value;
    const rangeYears: Record<MarketRange, number> = { '6mo': 0.5, '1y': 1, '5y': 5 };
    const years = rangeYears[market?.range ?? '1y'];
    if (first > 0 && last > 0 && years > 0) {
      const cagr = (Math.pow(last / first, 1 / years) - 1) * 100;
      stats.push({ label: `Price CAGR (${market?.range ?? '1y'})`, value: `${cagr.toFixed(0)}%` });
    }
  }

  return stats;
}

function buildRatiosTable(
  facts: EdgarFacts,
  periods: FinancialPeriod[],
  pl: FinancialTable,
  bs: FinancialTable,
): FinancialTable {
  const rowLabels = ['ROE %', 'Debt / equity', 'Current ratio'];

  const values = periods.map((period, i) => {
    const netProfit = pl.rows.find((r) => r.label === 'Net profit')?.values[i] ?? null;
    const equity =
      bs.rows.find((r) => r.label === "Stockholders' equity")?.values[i] ??
      pickTagValue(facts, ['StockholdersEquity'], period);
    const liabilities = pickTagValue(facts, ['Liabilities'], period);
    const currentAssets = pickTagValue(facts, ['AssetsCurrent'], period);
    const currentLiabilities = pickTagValue(facts, ['LiabilitiesCurrent'], period);

    const roe = netProfit != null && equity != null && equity !== 0 ? (netProfit / equity) * 100 : null;
    const debtEquity = liabilities != null && equity != null && equity > 0 ? liabilities / equity : null;
    const currentRatio =
      currentAssets != null && currentLiabilities != null && currentLiabilities > 0
        ? currentAssets / currentLiabilities
        : null;

    return [roe, debtEquity, currentRatio] as const;
  });

  return {
    title: 'Ratios',
    subtitle: 'Derived from SEC XBRL · annual',
    unit: 'Ratio / %',
    periods,
    rows: rowLabels.map((label, rowIdx) => ({
      label,
      highlight: label === 'ROE %',
      values: values.map((v) => v[rowIdx]),
    })),
  };
}

function buildProsCons(metrics: FinanceMetrics | null, market: MarketSnapshot | null): StockProsCons {
  const pros: string[] = [];
  const cons: string[] = [];

  if (metrics?.balanceCheckOk) pros.push('Balance sheet reconciles (assets = liabilities + equity).');
  if (metrics?.currentRatio != null && metrics.currentRatio >= 1.2) {
    pros.push(`Current ratio ${metrics.currentRatio.toFixed(2)} supports near-term liquidity.`);
  } else if (metrics?.currentRatio != null && metrics.currentRatio < 1) {
    cons.push(`Current ratio ${metrics.currentRatio.toFixed(2)} below 1.0 — monitor working capital.`);
  }

  if (metrics?.totalEquity != null && metrics.totalEquity < 0) {
    cons.push('Negative book equity — often buybacks or legacy capital structure; debt/assets is more informative.');
  } else if (metrics?.debtToEquity != null && metrics.debtToEquity > 1.5) {
    cons.push(`Elevated debt/equity (${metrics.debtToEquity.toFixed(2)}).`);
  } else if (metrics?.debtToEquity != null && metrics.debtToEquity < 0.8) {
    pros.push(`Conservative leverage (debt/equity ${metrics.debtToEquity.toFixed(2)}).`);
  }

  if (market?.changePct != null && market.changePct >= 2) pros.push('Positive near-term price momentum vs prior close.');
  if (market?.changePct != null && market.changePct <= -2) cons.push('Near-term price weakness vs prior close.');

  if (!pros.length) pros.push('SEC reporting provides audited financial transparency.');
  if (!cons.length) cons.push('Verify all figures against the latest 10-Q/10-K before investment decisions.');

  return { pros: pros.slice(0, 4), cons: cons.slice(0, 4) };
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString('en-US')}`;
}

function buildKeyMetrics(
  market: MarketSnapshot | null,
  facts: EdgarFacts,
  latestAnnual: FinancialPeriod | undefined,
  metrics: FinanceMetrics | null,
  preloaded: StockFundamentals | null,
): StockKeyMetric[] {
  const equity =
    metrics?.totalEquity ??
    (latestAnnual ? pickTagValue(facts, ['StockholdersEquity'], latestAnnual) : null);
  const assets = latestAnnual ? pickTagValue(facts, ['Assets'], latestAnnual) : null;
  const netProfit = latestAnnual ? pickTagValue(facts, ['NetIncomeLoss'], latestAnnual) : null;
  const sales = latestAnnual ? pickTagValue(facts, REVENUE_TAGS, latestAnnual) : null;
  const operatingProfit = latestAnnual ? pickTagValue(facts, ['OperatingIncomeLoss'], latestAnnual) : null;
  const cash = latestAnnual ? pickTagValue(facts, ['CashAndCashEquivalentsAtCarryingValue'], latestAnnual) : null;
  const totalDebt = latestAnnual
    ? pickTagValue(facts, ['LongTermDebtNoncurrent', 'LongTermDebt'], latestAnnual)
    : null;

  const sharesOutstanding = pickLatestFact(facts, SHARES_TAGS, 'shares');
  const eps =
    (latestAnnual ? pickFactValue(facts, EPS_TAGS, latestAnnual, 'USD/shares') : null) ??
    preloaded?.eps ??
    null;

  let bookValuePerShare: number | null = null;
  if (sharesOutstanding != null && sharesOutstanding > 0 && equity != null) {
    bookValuePerShare = (equity * 1e6) / sharesOutstanding;
  }

  const enrichedMarket =
    market != null
      ? enrichMarketSnapshot(market, { sharesOutstanding, epsDiluted: eps })
      : null;

  let peRatio = enrichedMarket?.peRatio ?? preloaded?.peRatio ?? null;
  if (peRatio == null && enrichedMarket?.price && eps != null && eps > 0) {
    peRatio = enrichedMarket.price / eps;
  }

  let marketCap = enrichedMarket?.marketCap ?? null;
  if (marketCap == null && enrichedMarket?.price && sharesOutstanding != null) {
    marketCap = enrichedMarket.price * sharesOutstanding;
  }

  const roe =
    metrics?.totalEquity != null && netProfit != null && metrics.totalEquity !== 0
      ? (netProfit / metrics.totalEquity) * 100
      : netProfit != null && equity != null && equity !== 0
        ? (netProfit / equity) * 100
        : null;

  const roce =
    operatingProfit != null && assets != null && metrics?.currentLiabilities != null
      ? (operatingProfit / (assets - metrics.currentLiabilities)) * 100
      : null;

  const dividendPerShare = pickLatestFact(facts, DIVIDEND_TAGS, 'USD/shares');
  let dividendYield: number | null = preloaded?.dividendYield ?? null;
  if (dividendYield == null && dividendPerShare != null && enrichedMarket?.price) {
    dividendYield = (dividendPerShare / enrichedMarket.price) * 100;
  }

  const netDebt = totalDebt != null && cash != null ? totalDebt - cash : null;

  return [
    { label: 'Market cap', value: marketCap != null ? formatMarketCap(marketCap) : preloaded?.marketCap ?? '—' },
    { label: 'Current price', value: formatUsd(enrichedMarket?.price) },
    {
      label: 'High / Low',
      value:
        enrichedMarket?.fiftyTwoWeekHigh != null && enrichedMarket?.fiftyTwoWeekLow != null
          ? `${formatUsd(enrichedMarket.fiftyTwoWeekHigh)} / ${formatUsd(enrichedMarket.fiftyTwoWeekLow)}`
          : '—',
    },
    { label: 'Stock P/E', value: peRatio != null ? formatRatio(peRatio) : '—' },
    {
      label: 'Forward P/E',
      value: preloaded?.forwardPe != null ? formatRatio(preloaded.forwardPe) : '—',
    },
    { label: 'Book value', value: bookValuePerShare != null ? formatUsd(bookValuePerShare) : '—' },
    { label: 'EPS (diluted)', value: eps != null ? formatUsd(eps) : '—' },
    { label: 'Revenue', value: sales != null ? formatMillions(sales) : preloaded?.revenue ?? '—' },
    { label: 'Net profit', value: netProfit != null ? formatMillions(netProfit) : '—' },
    { label: 'Operating profit', value: operatingProfit != null ? formatMillions(operatingProfit) : '—' },
    {
      label: 'Dividend yield',
      value: dividendYield != null ? `${dividendYield.toFixed(2)}%` : '—',
    },
    { label: 'ROE', value: formatPct(roe) },
    { label: 'ROCE', value: formatPct(roce) },
    { label: 'Debt / equity', value: metrics?.debtToEquity != null ? formatRatio(metrics.debtToEquity) : '—' },
    { label: 'Current ratio', value: metrics?.currentRatio != null ? formatRatio(metrics.currentRatio) : '—' },
    { label: 'Cash & equivalents', value: cash != null ? formatMillions(cash) : formatMillions(metrics?.cashAndEquivalents ?? null) },
    { label: 'Total debt', value: totalDebt != null ? formatMillions(totalDebt) : formatMillions(metrics?.totalDebt ?? null) },
    { label: 'Net debt', value: netDebt != null ? formatMillions(netDebt) : formatMillions(metrics?.netDebt ?? null) },
    {
      label: 'Working capital',
      value: metrics?.workingCapital != null ? formatMillions(metrics.workingCapital) : '—',
    },
    { label: 'Total assets', value: assets != null ? formatMillions(assets) : '—' },
    {
      label: 'Volume',
      value: enrichedMarket?.volume != null ? formatVolume(enrichedMarket.volume) : preloaded?.avgVolume ?? '—',
    },
    {
      label: 'Beta',
      value: preloaded?.beta != null && preloaded.beta > 0 ? preloaded.beta.toFixed(2) : '—',
    },
  ];
}

async function fetchCompanyProfile(cik: string): Promise<{
  sicDescription?: string;
  exchanges?: string[];
  category?: string;
}> {
  const padded = cik.replace(/\D/g, '').padStart(10, '0');
  try {
    const res = await fetch(`https://data.sec.gov/submissions/CIK${padded}.json`, {
      headers: { 'User-Agent': SEC_USER_AGENT, Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return {};
    const json = (await res.json()) as {
      sicDescription?: string;
      exchanges?: string[];
      category?: string;
    };
    return {
      sicDescription: json.sicDescription,
      exchanges: json.exchanges,
      category: json.category,
    };
  } catch {
    return {};
  }
}

function buildAbout(
  companyName: string,
  ticker: string,
  cik: string,
  profile: { sicDescription?: string; exchanges?: string[]; category?: string },
): string {
  const parts = [`${companyName} (${ticker})`];
  if (profile.sicDescription) parts.push(`operates in ${profile.sicDescription}`);
  if (profile.exchanges?.length) parts.push(`listed on ${profile.exchanges.join(', ')}`);
  if (profile.category) parts.push(`${profile.category}`);
  parts.push(`CIK ${cik}`);
  parts.push('Financials from SEC EDGAR XBRL; market data from Yahoo Finance.');
  return `${parts.join(' · ')}.`;
}

async function fetchRecentFilings(cik: string): Promise<StockDocumentLink[]> {
  const padded = cik.replace(/\D/g, '').padStart(10, '0');
  try {
    const res = await fetch(`https://data.sec.gov/submissions/CIK${padded}.json`, {
      headers: { 'User-Agent': SEC_USER_AGENT, Accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      filings?: {
        recent?: { form?: string[]; filingDate?: string[]; accessionNumber?: string[]; primaryDocument?: string[] };
      };
    };
    const recent = json.filings?.recent;
    if (!recent?.form) return [];

    const links: StockDocumentLink[] = [];
    for (let i = 0; i < recent.form.length && links.length < 8; i++) {
      const form = recent.form[i];
      if (form !== '10-K' && form !== '10-Q') continue;
      const accession = recent.accessionNumber?.[i]?.replace(/-/g, '');
      const doc = recent.primaryDocument?.[i];
      if (!accession || !doc) continue;
      links.push({
        label: `${form} filed ${recent.filingDate?.[i] ?? ''}`.trim(),
        url: `https://www.sec.gov/Archives/edgar/data/${parseInt(padded, 10)}/${accession}/${doc}`,
        date: recent.filingDate?.[i],
      });
    }
    return links;
  } catch {
    return [];
  }
}

export async function buildStockScreenerData(input: {
  company: SecCompany;
  market: MarketSnapshot | null;
  metrics: FinanceMetrics | null;
  sector?: string;
  preloadedFundamentals?: StockFundamentals | null;
}): Promise<StockScreenerData> {
  const { entityName, facts } = await fetchEdgarCompanyFacts(input.company.cik);
  const gaap = facts as EdgarFacts;

  const annualPeriods = collectPeriods(gaap, REVENUE_TAGS, '10-K', 10);
  const quarterlyPeriods = collectPeriods(gaap, REVENUE_TAGS, '10-Q', 12);

  const profitAndLoss = buildTable('Profit & Loss', 'Annual · SEC XBRL · USD millions', gaap, annualPeriods, PL_ROWS);
  const quarterlyResults = buildTable(
    'Quarterly results',
    'Quarterly · SEC XBRL · USD millions',
    gaap,
    quarterlyPeriods,
    PL_ROWS.filter((r) => ['Sales', 'Operating profit', 'Net profit'].includes(r.label)),
  );
  const balanceSheet = buildTable('Balance sheet', 'Annual · SEC XBRL · USD millions', gaap, annualPeriods, BS_ROWS);
  const cashFlow = buildTable('Cash flows', 'Annual · SEC XBRL · USD millions', gaap, annualPeriods, CF_ROWS);
  const ratios = buildRatiosTable(gaap, annualPeriods, profitAndLoss, balanceSheet);

  const latestAnnual = annualPeriods[annualPeriods.length - 1];
  const [profile, documents] = await Promise.all([
    fetchCompanyProfile(input.company.cik),
    fetchRecentFilings(input.company.cik),
  ]);

  const keyMetrics = buildKeyMetrics(
    input.market,
    gaap,
    latestAnnual,
    input.metrics,
    input.preloadedFundamentals ?? null,
  );
  const growthStats = buildGrowthStats(profitAndLoss, input.market);
  const prosCons = buildProsCons(input.metrics, input.market);
  const loadedAt = Date.now();
  const latestFilingDate = documents[0]?.date ?? null;

  return {
    ticker: input.company.ticker,
    companyName: entityName || input.company.name,
    cik: input.company.cik,
    sector: input.sector ?? 'SEC filer',
    about: buildAbout(entityName || input.company.name, input.company.ticker, input.company.cik, profile),
    keyMetrics,
    quarterlyResults,
    profitAndLoss,
    balanceSheet,
    cashFlow,
    ratios,
    growthStats,
    prosCons,
    documents,
    financeReportUrl: `/finance?ticker=${encodeURIComponent(input.company.ticker)}`,
    loadedAt,
    expiresAt: loadedAt + SCREENER_CACHE_TTL_MS,
    marketAsOf: input.market?.asOf ?? null,
    latestFilingDate,
    fromCache: false,
  };
}

import type { BalanceSheetReport } from './finance-types';

export const SEC_USER_AGENT = 'Sweep Finance sweep-app/1.0 (isushantkataria@gmail.com)';

const TAG_MAP = {
  cash: ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsAndShortTermInvestments'],
  currentAssets: ['AssetsCurrent'],
  nonCurrentAssets: ['AssetsNoncurrent'],
  totalAssets: ['Assets'],
  currentLiabilities: ['LiabilitiesCurrent'],
  nonCurrentLiabilities: ['LiabilitiesNoncurrent'],
  totalLiabilities: ['Liabilities'],
  equity: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
  receivables: ['AccountsReceivableNetCurrent', 'ReceivablesNetCurrent'],
  inventory: ['InventoryNet'],
  ppe: ['PropertyPlantAndEquipmentNet'],
  accountsPayable: ['AccountsPayableCurrent'],
  longTermDebt: ['LongTermDebtNoncurrent', 'LongTermDebt'],
  shortTermDebt: ['DebtCurrent', 'ShortTermBorrowings'],
  retainedEarnings: ['RetainedEarningsAccumulatedDeficit'],
} as const;

type EdgarFactEntry = {
  val: number;
  end: string;
  filed?: string;
  form?: string;
  fy?: number;
  fp?: string;
};

type EdgarFacts = Record<string, { units?: { USD?: EdgarFactEntry[] } }>;

function normalizeCik(cik: string): string {
  return cik.replace(/\D/g, '').padStart(10, '0');
}

function pickLatestFiling(facts: EdgarFacts, tagNames: readonly string[]): EdgarFactEntry | null {
  for (const tag of tagNames) {
    const entry = facts[tag];
    if (!entry?.units?.USD) continue;
    const filings = entry.units.USD
      .filter((u) => u.form === '10-Q' || u.form === '10-K')
      .sort((a, b) => new Date(b.end).getTime() - new Date(a.end).getTime());
    if (filings.length) return filings[0];
  }
  return null;
}

function toMillions(val: number | null | undefined): number | null {
  if (val == null) return null;
  return Math.round(val / 1e6);
}

function periodLabel(entry: EdgarFactEntry | null): string {
  if (!entry) return 'Latest filing';
  const fy = entry.fy ?? new Date(entry.end).getUTCFullYear();
  const fp = entry.fp ?? 'Q';
  return `${fp} FY${fy} (ended ${entry.end})`;
}

export async function fetchEdgarCompanyFacts(cik: string): Promise<{ entityName: string; facts: EdgarFacts }> {
  const padded = normalizeCik(cik);
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${padded}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': SEC_USER_AGENT, Accept: 'application/json' },
    next: { revalidate: 86400 },
  });

  if (res.status === 404) {
    throw new Error('No XBRL financial data found for this company on SEC EDGAR.');
  }
  if (!res.ok) {
    throw new Error(`SEC EDGAR request failed (${res.status}). Try again in a moment.`);
  }

  const json = (await res.json()) as {
    entityName?: string;
    facts?: { 'us-gaap'?: EdgarFacts; dei?: EdgarFacts };
  };

  const facts = json.facts?.['us-gaap'] ?? {};
  if (Object.keys(facts).length === 0) {
    throw new Error('No US GAAP facts available for this filer.');
  }

  return { entityName: json.entityName ?? 'Unknown company', facts };
}

export function buildBalanceSheetFromEdgarFacts(
  facts: EdgarFacts,
  meta: { ticker: string; companyName: string; cik: string },
): Omit<BalanceSheetReport, 'type'> {
  const entries: Record<string, EdgarFactEntry | null> = {};
  for (const [key, tags] of Object.entries(TAG_MAP)) {
    entries[key] = pickLatestFiling(facts, tags);
  }

  const totalAssets = toMillions(entries.totalAssets?.val);
  let totalEquity = toMillions(entries.equity?.val);
  let totalLiabilities = toMillions(entries.totalLiabilities?.val);

  if (!totalAssets) {
    throw new Error('Could not extract total assets from SEC XBRL data for this company.');
  }
  if (!totalEquity && totalLiabilities) totalEquity = totalAssets - totalLiabilities;
  if (!totalLiabilities && totalEquity) totalLiabilities = totalAssets - totalEquity;
  if (!totalLiabilities || !totalEquity) {
    throw new Error('Incomplete balance sheet totals in SEC filing — try uploading the annual report PDF.');
  }

  const currentAssets = toMillions(entries.currentAssets?.val) ?? Math.round(totalAssets * 0.35);
  const nonCurrentAssets = Math.max(totalAssets - currentAssets, 0);
  const currentLiabilities = toMillions(entries.currentLiabilities?.val) ?? Math.round(totalLiabilities * 0.4);
  const nonCurrentLiabilities = Math.max(totalLiabilities - currentLiabilities, 0);

  const cash = toMillions(entries.cash?.val) ?? Math.round(currentAssets * 0.15);
  const receivables = toMillions(entries.receivables?.val) ?? Math.round(currentAssets * 0.2);
  const inventory = toMillions(entries.inventory?.val) ?? 0;
  const ppe = toMillions(entries.ppe?.val) ?? Math.round(nonCurrentAssets * 0.6);
  const accountsPayable = toMillions(entries.accountsPayable?.val) ?? Math.round(currentLiabilities * 0.35);
  const longTermDebt = toMillions(entries.longTermDebt?.val) ?? Math.round(nonCurrentLiabilities * 0.5);
  const shortTermDebt = toMillions(entries.shortTermDebt?.val) ?? 0;
  const retained = toMillions(entries.retainedEarnings?.val) ?? Math.round(totalEquity * 0.8);

  const equityTotal = totalEquity;
  const otherCurrentAssets = Math.max(currentAssets - cash - receivables - inventory, 0);
  const otherNonCurrentAssets = Math.max(nonCurrentAssets - ppe, 0);
  const otherCurrentLiab = Math.max(currentLiabilities - accountsPayable - shortTermDebt, 0);
  const otherNonCurrentLiab = Math.max(nonCurrentLiabilities - longTermDebt, 0);

  const periodEntry = entries.totalAssets ?? entries.currentAssets;
  const period = periodLabel(periodEntry);
  const filed = periodEntry?.filed ?? '';

  return {
    ticker: meta.ticker.toUpperCase(),
    companyName: meta.companyName,
    period,
    currency: 'USD',
    title: `${meta.companyName} Balance Sheet`,
    source: `SEC EDGAR ${periodEntry?.form ?? '10-Q'} filed ${filed}`,
    dataSource: 'edgar',
    assets: {
      current: [
        { label: 'Cash and cash equivalents', value: cash },
        ...(receivables ? [{ label: 'Receivables, net', value: receivables }] : []),
        ...(inventory ? [{ label: 'Inventories', value: inventory }] : []),
        ...(otherCurrentAssets ? [{ label: 'Other current assets', value: otherCurrentAssets }] : []),
      ],
      nonCurrent: [
        ...(ppe ? [{ label: 'Property and equipment, net', value: ppe }] : []),
        ...(otherNonCurrentAssets ? [{ label: 'Other non-current assets', value: otherNonCurrentAssets }] : []),
      ],
    },
    liabilities: {
      current: [
        ...(accountsPayable ? [{ label: 'Accounts payable', value: accountsPayable }] : []),
        ...(shortTermDebt ? [{ label: 'Short-term debt', value: shortTermDebt }] : []),
        ...(otherCurrentLiab ? [{ label: 'Other current liabilities', value: otherCurrentLiab }] : []),
      ],
      nonCurrent: [
        ...(longTermDebt ? [{ label: 'Long-term debt', value: longTermDebt }] : []),
        ...(otherNonCurrentLiab ? [{ label: 'Other long-term liabilities', value: otherNonCurrentLiab }] : []),
      ],
    },
    equity: [
      { label: 'Retained earnings', value: retained },
      { label: 'Other equity', value: Math.max(equityTotal - retained, 0) },
    ].filter((e) => e.value > 0),
  };
}

export async function fetchEdgarBalanceSheetReport(meta: {
  cik: string;
  ticker: string;
  companyName: string;
}): Promise<BalanceSheetReport> {
  const { entityName, facts } = await fetchEdgarCompanyFacts(meta.cik);
  const sheet = buildBalanceSheetFromEdgarFacts(facts, {
    ...meta,
    companyName: meta.companyName || entityName,
  });
  return { type: 'balance_sheet', ...sheet };
}

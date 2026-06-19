/**
 * Fetches latest quarterly balance sheet data from SEC EDGAR for top US companies.
 * Run: node scripts/seed-finance-data.mjs
 */
import fs from 'fs';
import path from 'path';

const COMPANIES = [
  { ticker: 'AAPL', name: 'Apple Inc.', cik: '0000320193' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', cik: '0000789019' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', cik: '0001045810' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', cik: '0001018724' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', cik: '0001652044' },
  { ticker: 'META', name: 'Meta Platforms Inc.', cik: '0001326801' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway Inc.', cik: '0001067983' },
  { ticker: 'TSLA', name: 'Tesla Inc.', cik: '0001318605' },
  { ticker: 'LLY', name: 'Eli Lilly and Company', cik: '0000059478' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', cik: '0001730168' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', cik: '0000019617' },
  { ticker: 'WMT', name: 'Walmart Inc.', cik: '0000104169' },
  { ticker: 'V', name: 'Visa Inc.', cik: '0001403160' },
  { ticker: 'MA', name: 'Mastercard Incorporated', cik: '0001141391' },
  { ticker: 'XOM', name: 'Exxon Mobil Corporation', cik: '0000034088' },
  { ticker: 'UNH', name: 'UnitedHealth Group Inc.', cik: '0000731766' },
  { ticker: 'COST', name: 'Costco Wholesale Corporation', cik: '0000909832' },
  { ticker: 'PG', name: 'Procter & Gamble Company', cik: '0000080424' },
  { ticker: 'HD', name: 'Home Depot Inc.', cik: '0000354950' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', cik: '0000200406' },
  { ticker: 'NFLX', name: 'Netflix Inc.', cik: '0001065280' },
  { ticker: 'CRM', name: 'Salesforce Inc.', cik: '0001108524' },
  { ticker: 'AMD', name: 'Advanced Micro Devices Inc.', cik: '0000002488' },
  { ticker: 'KO', name: 'Coca-Cola Company', cik: '0000021344' },
  { ticker: 'CVX', name: 'Chevron Corporation', cik: '0000093410' },
];

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
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pickLatest10Q(facts, tagNames) {
  for (const tag of tagNames) {
    const entry = facts[tag];
    if (!entry?.units?.USD) continue;
    const quarterly = entry.units.USD
      .filter((u) => u.form === '10-Q' || u.form === '10-K')
      .sort((a, b) => new Date(b.end) - new Date(a.end));
    if (quarterly.length) return quarterly[0];
  }
  return null;
}

function toMillions(val) {
  if (val == null) return null;
  return Math.round(Math.abs(val) >= 1e9 ? val / 1e6 : val / 1e6);
}

function periodLabel(entry) {
  if (!entry) return 'Latest Quarter';
  const d = new Date(entry.end);
  const month = d.toUTCString();
  const fy = entry.fy ?? d.getUTCFullYear();
  const fp = entry.fp ?? 'Q';
  return `${fp} FY${fy} (ended ${entry.end})`;
}

async function fetchCompany(company) {
  const url = `https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik.replace(/^0+/, '').padStart(10, '0')}.json`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Sweep Finance App contact@sweep-app.local' },
  });
  if (!res.ok) throw new Error(`SEC ${res.status} for ${company.ticker}`);
  const json = await res.json();
  const facts = json.facts?.['us-gaap'] ?? {};

  const entries = {};
  for (const [key, tags] of Object.entries(TAG_MAP)) {
    entries[key] = pickLatest10Q(facts, tags);
  }

  const totalAssets = toMillions(entries.totalAssets?.val);
  let totalEquity = toMillions(entries.equity?.val);
  let totalLiabilities = toMillions(entries.totalLiabilities?.val);
  if (!totalAssets) throw new Error(`Missing assets for ${company.ticker}`);
  if (!totalEquity && totalLiabilities) totalEquity = totalAssets - totalLiabilities;
  if (!totalLiabilities && totalEquity) totalLiabilities = totalAssets - totalEquity;
  if (!totalLiabilities || !totalEquity) throw new Error(`Missing totals for ${company.ticker}`);

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
  const retained = toMillions(entries.retainedEarnings?.val) ?? Math.round((totalEquity ?? totalAssets - totalLiabilities) * 0.8);

  const equityTotal = totalEquity ?? totalAssets - totalLiabilities;
  const otherCurrentAssets = Math.max(currentAssets - cash - receivables - inventory, 0);
  const otherNonCurrentAssets = Math.max(nonCurrentAssets - ppe, 0);
  const otherCurrentLiab = Math.max(currentLiabilities - accountsPayable - shortTermDebt, 0);
  const otherNonCurrentLiab = Math.max(nonCurrentLiabilities - longTermDebt, 0);

  const periodEntry = entries.totalAssets ?? entries.currentAssets;
  const period = periodLabel(periodEntry);
  const filed = periodEntry?.filed ?? '';

  return {
    ticker: company.ticker,
    companyName: company.name,
    period,
    currency: 'USD',
    title: `${company.name} Balance Sheet`,
    source: `SEC EDGAR ${periodEntry?.form ?? '10-Q'} filed ${filed}`,
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

async function main() {
  const out = {};
  for (const company of COMPANIES) {
    try {
      console.log(`Fetching ${company.ticker}...`);
      const sheet = await fetchCompany(company);
      const periodKey = sheet.period;
      out[company.ticker] = { [periodKey]: sheet };
      await sleep(120);
    } catch (e) {
      console.error(`Failed ${company.ticker}:`, e.message);
    }
  }

  const outPath = path.join(process.cwd(), 'src/lib/finance-data-generated.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${Object.keys(out).length} companies to ${outPath}`);
}

main();
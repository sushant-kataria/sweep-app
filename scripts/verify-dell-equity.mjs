import { fetchEdgarCompanyFacts, buildBalanceSheetFromEdgarFacts } from '../src/lib/finance-edgar.ts';
import { computeFinanceMetrics } from '../src/lib/finance-metrics.ts';

const { facts } = await fetchEdgarCompanyFacts('0001571996');
const report = {
  type: 'balance_sheet',
  ...buildBalanceSheetFromEdgarFacts(facts, {
    ticker: 'DELL',
    companyName: 'Dell Technologies Inc.',
    cik: '0001571996',
  }),
};
const metrics = computeFinanceMetrics(report);

console.log('equity lines:', report.equity);
console.log('totalEquity:', metrics.totalEquity);
console.log('equityRatio:', metrics.equityRatio?.toFixed(4));
console.log('debtToEquity:', metrics.debtToEquity);
console.log('balanceCheck:', metrics.balanceCheck);
console.log('balanceCheckOk:', metrics.balanceCheckOk);

if (metrics.totalEquity !== -1404) throw new Error(`Expected totalEquity -1404, got ${metrics.totalEquity}`);
if (!metrics.balanceCheckOk) throw new Error(`Expected balanced sheet, gap ${metrics.balanceCheck}`);
console.log('Dell equity verification passed.');

import { FINANCE_SCREENS } from '../src/lib/finance-screens.ts';
import { runScreenResults } from '../src/lib/stock-screen-engine.ts';
import { parseScreenQuery } from '../src/lib/screen-query.ts';

const issues = [];

for (const screen of FINANCE_SCREENS) {
  try {
    const result = await runScreenResults(screen.id, { limit: 25 });
    const parsed = parseScreenQuery(result.defaultQuery);
    const rowCount = result.rows.length;
    const total = result.total;
    const withPrice = result.rows.filter((r) => r.price != null).length;
    const withPe = result.rows.filter((r) => r.pe != null).length;
    const withCap = result.rows.filter((r) => r.marketCap != null).length;
    const withSignal = result.rows.filter((r) => r.signal).length;
    const withScore = result.rows.filter((r) => r.score != null).length;

    const problems = [];
    if (total === 0) problems.push('ZERO_RESULTS');
    if (rowCount > 0 && withPrice === 0) problems.push('NO_PRICES');
    if (screen.mode === 'live' && !result.live) problems.push('LIVE_FALLBACK');
    if (screen.mode === 'live' && withSignal === 0 && rowCount > 0) problems.push('NO_SIGNALS');
    if (parsed.length === 0 && result.defaultQuery.length > 40) problems.push('UNPARSEABLE_QUERY');
    if (screen.category === 'formulas' && screen.id !== 'piotroski-scan' && withScore > 0)
      problems.push('UNEXPECTED_SCORE');
    if (screen.id === 'piotroski-scan' && withScore === 0 && rowCount > 0) problems.push('NO_PIOTROSKI');

    const line = `${screen.id.padEnd(32)} live=${String(result.live).padEnd(5)} total=${String(total).padStart(3)} price=${withPrice}/${rowCount} pe=${withPe}/${rowCount} cap=${withCap}/${rowCount} ${problems.join(',') || 'OK'}`;
    console.log(line);
    if (problems.length) issues.push({ id: screen.id, problems, defaultQuery: result.defaultQuery });
  } catch (e) {
    console.log(`${screen.id.padEnd(32)} ERROR ${e.message}`);
    issues.push({ id: screen.id, problems: ['ERROR'], error: e.message });
  }
}

console.log('\n--- SUMMARY ---');
console.log(`Screens with issues: ${issues.length}/${FINANCE_SCREENS.length}`);
for (const i of issues) console.log(JSON.stringify(i));

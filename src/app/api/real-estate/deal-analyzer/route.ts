import { NextResponse } from 'next/server';

import { analyzeDeal } from '@/lib/real-estate-market/deal';
import { getMortgageRate } from '@/lib/real-estate-market/mortgage-rate';
import { requireProUserApi } from '@/lib/sweep-auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const user = await requireProUserApi();
  if (!user) {
    return NextResponse.json({ error: 'Pro subscription required for deal analyzer.' }, { status: 402 });
  }

  try {
    const body = await req.json();
    const purchasePrice = Number(body.purchasePrice);
    const downPaymentPct = Number(body.downPaymentPct ?? 20);
    const interestRate = Number(body.interestRate);
    const loanTermYears = Number(body.loanTermYears ?? 30);
    const monthlyRent = Number(body.monthlyRent);
    const monthlyExpenses = Number(body.monthlyExpenses ?? 0);

    if (!Number.isFinite(purchasePrice) || purchasePrice <= 0) {
      return NextResponse.json({ error: 'Valid purchase price required.' }, { status: 400 });
    }
    if (!Number.isFinite(monthlyRent) || monthlyRent < 0) {
      return NextResponse.json({ error: 'Valid monthly rent required.' }, { status: 400 });
    }

    let rate = interestRate;
    let source = 'User input';
    if (!Number.isFinite(rate) || rate <= 0) {
      const fetched = await getMortgageRate();
      rate = fetched.rate;
      source = fetched.source;
    }

    const result = analyzeDeal(
      {
        purchasePrice,
        downPaymentPct,
        interestRate: rate,
        loanTermYears,
        monthlyRent,
        monthlyExpenses,
        closingCostsPct: Number(body.closingCostsPct ?? 2),
      },
      source,
    );

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}

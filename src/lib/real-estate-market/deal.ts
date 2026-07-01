import type { DealAnalyzerInput, DealAnalyzerResult } from './types';

function monthlyPayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r * (1 + r) ** n) / ((1 + r) ** n - 1);
}

export function analyzeDeal(input: DealAnalyzerInput, mortgageRateSource: string): DealAnalyzerResult {
  const closingCostsPct = input.closingCostsPct ?? 2;
  const downPayment = input.purchasePrice * (input.downPaymentPct / 100);
  const closingCosts = input.purchasePrice * (closingCostsPct / 100);
  const loanAmount = Math.max(0, input.purchasePrice - downPayment);
  const monthlyMortgage = monthlyPayment(loanAmount, input.interestRate, input.loanTermYears);
  const monthlyCashFlow = input.monthlyRent - input.monthlyExpenses - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;
  const grossYield = input.purchasePrice > 0 ? ((input.monthlyRent * 12) / input.purchasePrice) * 100 : 0;
  const netYield =
    input.purchasePrice > 0
      ? (((input.monthlyRent - input.monthlyExpenses) * 12) / input.purchasePrice) * 100
      : 0;
  const capRate = netYield;
  const cashInvested = downPayment + closingCosts;
  const cashOnCash = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0;
  const breakEvenRent = input.monthlyExpenses + monthlyMortgage;

  let dealScore = 50;
  if (monthlyCashFlow > 0) dealScore += 20;
  else if (monthlyCashFlow > -200) dealScore += 5;
  else dealScore -= 15;
  if (cashOnCash >= 8) dealScore += 15;
  else if (cashOnCash >= 4) dealScore += 8;
  if (grossYield >= 7) dealScore += 10;
  else if (grossYield >= 5) dealScore += 5;
  dealScore = Math.max(0, Math.min(100, Math.round(dealScore)));

  return {
    purchasePrice: input.purchasePrice,
    downPayment,
    loanAmount,
    monthlyMortgage,
    monthlyRent: input.monthlyRent,
    monthlyExpenses: input.monthlyExpenses,
    monthlyCashFlow,
    annualCashFlow,
    grossYield,
    netYield,
    capRate,
    cashOnCash,
    breakEvenRent,
    dealScore,
    mortgageRateSource,
  };
}

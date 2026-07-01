export type ZipMarketRow = {
  zip: string;
  city: string | null;
  state: string;
  stateCode: string;
  metro: string;
  metroSlug: string;
  metroCode: string;
  medianSalePrice: number | null;
  medianListPrice: number | null;
  medianDom: number | null;
  homesSold: number | null;
  inventory: number | null;
  priceYoy: number | null;
  inventoryYoy: number | null;
  periodEnd: string;
  estMonthlyRent: number | null;
  grossYield: number | null;
  dataSource: string;
  dealScore: number;
};

export type MetroSummary = {
  slug: string;
  name: string;
  stateCode: string;
  zipCount: number;
  medianSalePrice: number | null;
  medianRent: number | null;
  medianYield: number | null;
  medianDom: number | null;
  priceYoy: number | null;
  zips: ZipMarketRow[];
};

export type RealEstateSeedData = {
  generatedAt: string;
  source: string;
  zipCount: number;
  metroCount: number;
  metros: MetroSummary[];
};

export type RealEstateScreenColumn = {
  id: string;
  label: string;
  align?: 'left' | 'right';
};

export type RealEstateScreenResultRow = {
  zip: string;
  city: string | null;
  metro: string;
  metroSlug: string;
  stateCode: string;
  medianSalePrice: number | null;
  estMonthlyRent: number | null;
  grossYield: number | null;
  medianDom: number | null;
  priceYoy: number | null;
  dealScore: number | null;
  signal: string | null;
};

export type RealEstateScreenResults = {
  screenId: string;
  title: string;
  description: string;
  formula: string;
  columns: RealEstateScreenColumn[];
  rows: RealEstateScreenResultRow[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  scanNote?: string;
  preview?: boolean;
};

export type DealAnalyzerInput = {
  purchasePrice: number;
  downPaymentPct: number;
  interestRate: number;
  loanTermYears: number;
  monthlyRent: number;
  monthlyExpenses: number;
  closingCostsPct?: number;
};

export type DealAnalyzerResult = {
  purchasePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyMortgage: number;
  monthlyRent: number;
  monthlyExpenses: number;
  monthlyCashFlow: number;
  annualCashFlow: number;
  grossYield: number;
  netYield: number;
  capRate: number;
  cashOnCash: number;
  breakEvenRent: number;
  dealScore: number;
  mortgageRateSource: string;
};

export type RealEstateScreen = {
  id: string;
  title: string;
  description: string;
  formula: string;
  category: string;
};

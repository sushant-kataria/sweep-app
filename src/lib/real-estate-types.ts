export type RealEstateProperty = {
  id: string;
  ownerName: string;
  address: string;
  propertyType: string;
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet: number;
  yearBuilt: number;
  status: string;
  rentalIncome?: number;
};

export type RealEstateListing = {
  id: string;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  propertyType: string;
  url: string;
};

export type RealEstateMarket = {
  id: string;
  name: string;
  metro: string;
  medianPrice: number;
  medianRent: number;
  inventory: number;
  daysOnMarket: number;
  yoyChange: number;
  capRate: number;
};

export type RealEstateMetrics = {
  totalValue: number;
  totalIncome: number;
  avgCapRate: number;
  occupancyRate: number;
  avgDaysOnMarket: number;
  yoyAppreciation: number;
  propertyCount: number;
};

export type RealEstateAnalysis = {
  executiveSummary: string;
  keyHighlights: string[];
  marketAssessment: string;
  yieldAssessment: string;
  strengths: string[];
  riskFactors: string[];
  watchItems: string[];
};

export type RealEstateSession = {
  mode: 'market' | 'portfolio';
  market: RealEstateMarket;
  listings?: RealEstateListing[];
  portfolio?: RealEstateProperty[];
  metrics: RealEstateMetrics;
  analysis: RealEstateAnalysis;
  loadedAt: number;
};

export type RealEstateReportContext = {
  mode: 'market' | 'portfolio';
  market: RealEstateMarket;
  listings?: RealEstateListing[];
  portfolio?: RealEstateProperty[];
  metrics: RealEstateMetrics;
  analysis: RealEstateAnalysis;
};
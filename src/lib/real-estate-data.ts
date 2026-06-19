import type {
  RealEstateAnalysis,
  RealEstateListing,
  RealEstateMarket,
  RealEstateMetrics,
  RealEstateProperty,
} from './real-estate-types';

export const DEFAULT_MARKET_ID = 'la';

export const MARKET_OPTIONS: RealEstateMarket[] = [
  {
    id: 'la',
    name: 'Los Angeles',
    metro: 'Los Angeles-Long Beach-Anaheim, CA',
    medianPrice: 985000,
    medianRent: 3200,
    inventory: 12400,
    daysOnMarket: 38,
    yoyChange: 4.2,
    capRate: 4.1,
  },
  {
    id: 'austin',
    name: 'Austin',
    metro: 'Austin-Round Rock, TX',
    medianPrice: 485000,
    medianRent: 2100,
    inventory: 6800,
    daysOnMarket: 52,
    yoyChange: -1.8,
    capRate: 5.4,
  },
  {
    id: 'miami',
    name: 'Miami',
    metro: 'Miami-Fort Lauderdale, FL',
    medianPrice: 620000,
    medianRent: 2850,
    inventory: 9100,
    daysOnMarket: 44,
    yoyChange: 6.1,
    capRate: 4.8,
  },
  {
    id: 'nyc',
    name: 'New York',
    metro: 'New York-Newark-Jersey City, NY-NJ',
    medianPrice: 785000,
    medianRent: 3800,
    inventory: 15200,
    daysOnMarket: 41,
    yoyChange: 2.4,
    capRate: 3.6,
  },
];

const LISTINGS: Record<string, RealEstateListing[]> = {
  la: [
    { id: 'la-1', address: '1248 N Formosa Ave, West Hollywood', price: 875000, beds: 2, baths: 2, sqft: 1180, propertyType: 'Condo', url: '/homedetails/1248-N-Formosa-Ave' },
    { id: 'la-2', address: '4521 W 2nd St, Los Angeles', price: 1195000, beds: 3, baths: 2, sqft: 1640, propertyType: 'Single Family', url: '/homedetails/4521-W-2nd-St' },
    { id: 'la-3', address: '890 Marco Pl, Venice', price: 1450000, beds: 3, baths: 3, sqft: 1920, propertyType: 'Townhouse', url: '/homedetails/890-Marco-Pl' },
    { id: 'la-4', address: '2210 Hyperion Ave, Silver Lake', price: 725000, beds: 2, baths: 1, sqft: 980, propertyType: 'Condo', url: '/homedetails/2210-Hyperion-Ave' },
    { id: 'la-5', address: '3300 W Adams Blvd, Mid-City', price: 649000, beds: 3, baths: 2, sqft: 1420, propertyType: 'Single Family', url: '/homedetails/3300-W-Adams-Blvd' },
  ],
  austin: [
    { id: 'atx-1', address: '2104 E 6th St, Austin', price: 525000, beds: 3, baths: 2, sqft: 1580, propertyType: 'Single Family', url: '/homedetails/2104-E-6th-St' },
    { id: 'atx-2', address: '4512 Duval St, Austin', price: 445000, beds: 2, baths: 2, sqft: 1120, propertyType: 'Condo', url: '/homedetails/4512-Duval-St' },
    { id: 'atx-3', address: '8801 Brodie Ln, South Austin', price: 389000, beds: 3, baths: 2, sqft: 1340, propertyType: 'Single Family', url: '/homedetails/8801-Brodie-Ln' },
    { id: 'atx-4', address: '1200 Barton Springs Rd, Austin', price: 675000, beds: 2, baths: 2, sqft: 1050, propertyType: 'Condo', url: '/homedetails/1200-Barton-Springs-Rd' },
  ],
  miami: [
    { id: 'mia-1', address: '1450 Brickell Ave, Miami', price: 720000, beds: 2, baths: 2, sqft: 1240, propertyType: 'Condo', url: '/homedetails/1450-Brickell-Ave' },
    { id: 'mia-2', address: '8920 SW 72nd Ct, Kendall', price: 565000, beds: 4, baths: 3, sqft: 2180, propertyType: 'Single Family', url: '/homedetails/8920-SW-72nd-Ct' },
    { id: 'mia-3', address: '3100 Collins Ave, Miami Beach', price: 1250000, beds: 2, baths: 2, sqft: 1380, propertyType: 'Condo', url: '/homedetails/3100-Collins-Ave' },
    { id: 'mia-4', address: '450 NW 42nd Ave, Coral Gables', price: 890000, beds: 3, baths: 2, sqft: 1760, propertyType: 'Single Family', url: '/homedetails/450-NW-42nd-Ave' },
  ],
  nyc: [
    { id: 'nyc-1', address: '245 E 10th St, East Village', price: 825000, beds: 1, baths: 1, sqft: 650, propertyType: 'Co-op', url: '/homedetails/245-E-10th-St' },
    { id: 'nyc-2', address: '88 Greenwich St, Financial District', price: 1150000, beds: 2, baths: 2, sqft: 980, propertyType: 'Condo', url: '/homedetails/88-Greenwich-St' },
    { id: 'nyc-3', address: '456 Bergen St, Brooklyn', price: 925000, beds: 3, baths: 2, sqft: 1420, propertyType: 'Townhouse', url: '/homedetails/456-Bergen-St' },
    { id: 'nyc-4', address: '1200 Dean St, Crown Heights', price: 695000, beds: 2, baths: 1, sqft: 880, propertyType: 'Condo', url: '/homedetails/1200-Dean-St' },
  ],
};

export const DEMO_PORTFOLIO: RealEstateProperty[] = [
  {
    id: 'p1',
    ownerName: 'Sweep Capital LLC',
    address: '1842 N Highland Ave, Los Angeles, CA',
    propertyType: 'Multifamily',
    purchaseDate: '2019-06-15',
    purchasePrice: 1250000,
    currentValue: 1680000,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2400,
    yearBuilt: 1962,
    status: 'Rented',
    rentalIncome: 8200,
  },
  {
    id: 'p2',
    ownerName: 'Sweep Capital LLC',
    address: '902 E 7th St, Austin, TX',
    propertyType: 'Single Family',
    purchaseDate: '2021-03-22',
    purchasePrice: 420000,
    currentValue: 495000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1580,
    yearBuilt: 1988,
    status: 'Rented',
    rentalIncome: 2800,
  },
  {
    id: 'p3',
    ownerName: 'Sweep Capital LLC',
    address: '1550 Meridian Ave, Miami Beach, FL',
    propertyType: 'Condo',
    purchaseDate: '2020-11-08',
    purchasePrice: 680000,
    currentValue: 790000,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1180,
    yearBuilt: 2005,
    status: 'Active',
    rentalIncome: 4500,
  },
  {
    id: 'p4',
    ownerName: 'Sweep Capital LLC',
    address: '88 Wyckoff St, Brooklyn, NY',
    propertyType: 'Townhouse',
    purchaseDate: '2017-09-01',
    purchasePrice: 890000,
    currentValue: 1120000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1720,
    yearBuilt: 1920,
    status: 'Rented',
    rentalIncome: 5200,
  },
];

const MARKET_ANALYSIS: Record<string, RealEstateAnalysis> = {
  la: {
    executiveSummary:
      'Los Angeles remains supply-constrained with strong owner-occupier demand and institutional rental appetite. Coastal submarkets command premiums while inland corridors offer better yield for value-add investors.',
    keyHighlights: [
      'Median home price near $985K with modest YoY appreciation.',
      'Inventory below pre-pandemic norms — sellers retain pricing power in prime ZIPs.',
      'Rent growth stabilized after 2022 spike; vacancy tight in urban core.',
    ],
    marketAssessment:
      'Buyer pool skews toward move-up and cash-heavy investors. New construction limited by zoning — supports long-term price floor.',
    yieldAssessment:
      'Cap rates near 4.1% on stabilized multifamily — compressed vs Sun Belt but offset by appreciation and rent growth optionality.',
    strengths: ['Diverse employment base', 'Scarce developable land', 'Institutional liquidity'],
    riskFactors: ['Insurance and tax escalation', 'Rent control expansion risk', 'Macro rate sensitivity'],
    watchItems: ['Active inventory trend', 'Westside condo absorption', 'Insurance premium shocks'],
  },
  austin: {
    executiveSummary:
      'Austin normalized after the 2021–2022 boom with expanded inventory and longer days on market. Tech employment stabilizes demand while investors focus on yield and value-add in suburban corridors.',
    keyHighlights: [
      'Median price near $485K — slight YoY softening after rapid appreciation.',
      'Days on market elevated vs coastal peers — more buyer leverage.',
      'Rental demand supported by university and tech hiring.',
    ],
    marketAssessment:
      'Transition from seller’s to balanced market. New supply in suburbs pressures older stock without renovations.',
    yieldAssessment:
      'Cap rates near 5.4% — attractive vs California with lower entry basis and stronger cash-on-cash profiles.',
    strengths: ['Population growth', 'Business-friendly climate', 'Relative affordability'],
    riskFactors: ['Supply wave in suburbs', 'Property tax reassessments', 'Tech hiring cycles'],
    watchItems: ['Months of supply', 'Build-to-rent deliveries', 'Travis County tax notices'],
  },
  miami: {
    executiveSummary:
      'Miami benefits from domestic migration, international capital, and limited waterfront supply. Condo market bifurcated between new construction premiums and older stock needing reserves.',
    keyHighlights: [
      'YoY appreciation leads major metros at +6.1%.',
      'Insurance and flood risk pricing increasingly embedded in underwriting.',
      'Luxury coastal assets attract global buyers — thin transaction volume.',
    ],
    marketAssessment:
      'Flight-to-quality in condos post-Surfside — newer buildings trade at widening premium.',
    yieldAssessment:
      'Short-term rental yields attractive in select zones; long-term cap rates near 4.8% on stabilized assets.',
    strengths: ['Tax-friendly profile', 'International demand', 'Tourism and services economy'],
    riskFactors: ['Insurance costs', 'Climate and flood exposure', 'Condo special assessments'],
    watchItems: ['Flood insurance renewals', 'New luxury inventory', 'Foreign buyer share'],
  },
  nyc: {
    executiveSummary:
      'New York City recovered post-pandemic with tight Manhattan rents and Brooklyn brownstone resilience. Co-op financing friction and transfer taxes shape transaction velocity.',
    keyHighlights: [
      'Median price near $785K with steady low-single-digit appreciation.',
      'Rental vacancy near historic lows — rent growth moderating from 2022 peaks.',
      'Office-to-residential conversions create selective supply relief.',
    ],
    marketAssessment:
      'Borough-level divergence: Manhattan luxury stable, outer boroughs offer better yield for small investors.',
    yieldAssessment:
      'Cap rates compressed near 3.6% — investors rely on appreciation and rent growth vs cash yield.',
    strengths: ['Deep renter pool', 'Transit-oriented demand', 'Institutional capital access'],
    riskFactors: ['Regulatory complexity', 'Transfer taxes', 'Co-op board risk'],
    watchItems: ['Rent stabilization policy', 'Office vacancy spillover', 'Jumbo mortgage rates'],
  },
};

const PORTFOLIO_ANALYSIS: RealEstateAnalysis = {
  executiveSummary:
    'The demo portfolio spans four Sun Belt and coastal markets with a blended value of $4.09M and $20.7K monthly gross rent. Diversification reduces single-market exposure while Austin and Miami drive yield.',
  keyHighlights: [
    'Portfolio appreciation of ~34% since acquisition basis.',
    'Weighted occupancy near 94% with one active listing in Miami Beach.',
    'Multifamily LA asset anchors appreciation; Austin provides highest cash yield.',
  ],
  marketAssessment:
    'Geographic mix balances appreciation (LA, NYC) with cash flow (Austin, Miami STR-capable condo).',
  yieldAssessment:
    'Blended cap rate near 5.2% on current values — above LA/NYC single-asset norms due to Texas weighting.',
  strengths: ['Market diversification', 'Positive rent roll', 'Value-add completed on Brooklyn townhouse'],
  riskFactors: ['Concentration in 4 assets', 'Miami insurance renewal', 'LA rent control exposure'],
  watchItems: ['Miami condo sale timeline', 'Austin property tax protest', 'LA rent increase caps'],
};

export function getMarket(id: string): RealEstateMarket | null {
  return MARKET_OPTIONS.find((m) => m.id === id) ?? null;
}

export function getListings(marketId: string): RealEstateListing[] {
  return LISTINGS[marketId] ?? [];
}

export function getMarketAnalysis(marketId: string): RealEstateAnalysis | null {
  return MARKET_ANALYSIS[marketId] ?? null;
}

export function getPortfolioAnalysis(): RealEstateAnalysis {
  return PORTFOLIO_ANALYSIS;
}

export function computeMarketMetrics(market: RealEstateMarket, listings: RealEstateListing[]): RealEstateMetrics {
  const totalValue = listings.reduce((sum, l) => sum + l.price, 0);
  const avgPrice = listings.length ? totalValue / listings.length : market.medianPrice;

  return {
    totalValue: avgPrice,
    totalIncome: market.medianRent,
    avgCapRate: market.capRate,
    occupancyRate: 96.2,
    avgDaysOnMarket: market.daysOnMarket,
    yoyAppreciation: market.yoyChange,
    propertyCount: listings.length,
  };
}

export function computePortfolioMetrics(properties: RealEstateProperty[]): RealEstateMetrics {
  const totalValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
  const totalIncome = properties.reduce((sum, p) => sum + (p.rentalIncome ?? 0), 0);
  const totalPurchase = properties.reduce((sum, p) => sum + p.purchasePrice, 0);
  const appreciation = totalPurchase > 0 ? ((totalValue - totalPurchase) / totalPurchase) * 100 : 0;
  const rented = properties.filter((p) => p.status.toLowerCase() === 'rented').length;

  return {
    totalValue,
    totalIncome,
    avgCapRate: totalValue > 0 ? (totalIncome * 12 / totalValue) * 100 : 0,
    occupancyRate: properties.length ? (rented / properties.length) * 100 : 0,
    avgDaysOnMarket: 0,
    yoyAppreciation: appreciation,
    propertyCount: properties.length,
  };
}
// components/dashboard/property-portfolio.tsx
'use client';

type Property = {
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

type PropertyPortfolioProps = {
  properties: Property[];
};

export const PropertyPortfolio = ({ properties }: PropertyPortfolioProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateAge = (yearBuilt: number) => {
    return new Date().getFullYear() - yearBuilt;
  };

  const calculateAppreciation = (purchase: number, current: number) => {
    const appreciation = ((current - purchase) / purchase) * 100;
    return appreciation.toFixed(2);
  };

  const calculateYearsOwned = (purchaseDate: string) => {
    const purchase = new Date(purchaseDate);
    const now = new Date();
    const years = (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return years.toFixed(1);
  };

  const totalPortfolioValue = properties.reduce((sum, prop) => sum + prop.currentValue, 0);
  const totalPurchasePrice = properties.reduce((sum, prop) => sum + prop.purchasePrice, 0);
  const totalAppreciation = totalPortfolioValue - totalPurchasePrice;
  const totalMonthlyIncome = properties.reduce((sum, prop) => sum + (prop.rentalIncome || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'rented':
        return 'text-sky-600 dark:text-sky-400';
      case 'for sale':
        return 'text-amber-600 dark:text-amber-400';
      case 'sold':
        return 'text-neutral-500 dark:text-neutral-400';
      default:
        return 'text-[var(--v-chart-fg)]';
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-[var(--v-chart-card-border)] bg-white p-4 text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]">
      <div className="border-b border-[var(--v-chart-card-border)] pb-3">
        <h3 className="mb-3 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">
          property portfolio dashboard
        </h3>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded bg-neutral-100/80 p-2 dark:bg-white/[0.06]">
            <div className="mb-1 text-[var(--v-chart-muted)]">total properties</div>
            <div className="text-lg font-bold text-[var(--v-chart-fg)]">{properties.length}</div>
          </div>
          <div className="rounded bg-neutral-100/80 p-2 dark:bg-white/[0.06]">
            <div className="mb-1 text-[var(--v-chart-muted)]">portfolio value</div>
            <div className="text-lg font-bold text-[var(--v-chart-fg)]">
              {formatCurrency(totalPortfolioValue)}
            </div>
          </div>
          <div className="rounded bg-neutral-100/80 p-2 dark:bg-white/[0.06]">
            <div className="mb-1 text-[var(--v-chart-muted)]">total appreciation</div>
            <div
              className={`text-lg font-bold ${totalAppreciation >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
            >
              {formatCurrency(totalAppreciation)}
            </div>
          </div>
          <div className="rounded bg-neutral-100/80 p-2 dark:bg-white/[0.06]">
            <div className="mb-1 text-[var(--v-chart-muted)]">monthly income</div>
            <div className="text-lg font-bold text-[var(--v-chart-fg)]">
              {formatCurrency(totalMonthlyIncome)}
            </div>
          </div>
        </div>
      </div>

      <div className="max-h-96 space-y-3 overflow-y-auto">
        {properties.map((property) => {
          const appreciation = parseFloat(
            calculateAppreciation(property.purchasePrice, property.currentValue)
          );

          return (
            <div
              key={property.id}
              className="space-y-2 rounded border border-[var(--v-chart-card-border)] bg-neutral-100/50 p-3 dark:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--v-chart-fg)]">{property.address}</div>
                  <div className="mt-0.5 text-xs text-[var(--v-chart-muted)]">
                    owner: {property.ownerName} | id: {property.id}
                  </div>
                </div>
                <div className={`rounded px-2 py-1 text-xs font-bold ${getStatusColor(property.status)}`}>
                  {property.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[var(--v-chart-muted)]">type: </span>
                  <span className="text-[var(--v-chart-fg)]">{property.propertyType}</span>
                </div>
                <div>
                  <span className="text-[var(--v-chart-muted)]">built: </span>
                  <span className="text-[var(--v-chart-fg)]">
                    {property.yearBuilt} ({calculateAge(property.yearBuilt)} yrs old)
                  </span>
                </div>
                <div>
                  <span className="text-[var(--v-chart-muted)]">size: </span>
                  <span className="text-[var(--v-chart-fg)]">
                    {property.squareFeet.toLocaleString()} sqft
                  </span>
                </div>
                {property.bedrooms && property.bathrooms && (
                  <div>
                    <span className="text-[var(--v-chart-muted)]">beds/baths: </span>
                    <span className="text-[var(--v-chart-fg)]">
                      {property.bedrooms}bd / {property.bathrooms}ba
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-[var(--v-chart-card-border)] pt-2 text-xs">
                <div>
                  <div className="text-[var(--v-chart-muted)]">purchase price</div>
                  <div className="font-bold text-[var(--v-chart-fg)]">
                    {formatCurrency(property.purchasePrice)}
                  </div>
                  <div className="text-[var(--v-chart-empty)]">
                    {property.purchaseDate} ({calculateYearsOwned(property.purchaseDate)} yrs)
                  </div>
                </div>
                <div>
                  <div className="text-[var(--v-chart-muted)]">current value</div>
                  <div className="font-bold text-[var(--v-chart-fg)]">
                    {formatCurrency(property.currentValue)}
                  </div>
                  <div
                    className={`text-xs ${appreciation >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {appreciation >= 0 ? '+' : ''}
                    {appreciation}% appreciation
                  </div>
                </div>
                {property.rentalIncome && (
                  <div className="col-span-2 mt-2">
                    <div className="text-[var(--v-chart-muted)]">rental income</div>
                    <div className="font-bold text-[var(--v-chart-fg)]">
                      {formatCurrency(property.rentalIncome)}/month
                      <span className="ml-2 text-xs font-normal text-[var(--v-chart-muted)]">
                        ({formatCurrency(property.rentalIncome * 12)}/year)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// components/dashboard/zillow-listings.tsx
'use client';

import { useState } from 'react';

type ZillowListingsProps = {
  properties: any[];
  totalResults: number;
  searchCriteria: {
    location: string;
    listingType: string;
    priceMin?: number;
    priceMax?: number;
    bedsMin?: number;
  };
  error?: string;
  onPropertySelectAction?: (url: string) => void;
};

const shell =
  'rounded-lg border border-[var(--v-chart-card-border)] bg-white text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]';

export const ZillowListings = ({
  properties,
  totalResults,
  searchCriteria,
  error,
  onPropertySelectAction,
}: ZillowListingsProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const formatCurrency = (value: number, currency?: string) => {
    const validCurrency = currency && currency.length === 3 && currency !== '$' ? currency : 'USD';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `$${value.toLocaleString()}`;
    }
  };

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property.id);
    if (onPropertySelectAction && property.url) {
      let fullUrl = property.url;
      if (!fullUrl.startsWith('http')) {
        fullUrl = fullUrl.startsWith('/')
          ? `https://www.zillow.com${fullUrl}`
          : `https://www.zillow.com/${fullUrl}`;
      }
      onPropertySelectAction(fullUrl);
    }
  };

  if (error) {
    return (
      <div className={`${shell} p-4`}>
        <h3 className="mb-2 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">
          property search results
        </h3>
        <div className="text-xs text-red-600 dark:text-red-400 leading-relaxed whitespace-pre-wrap">
          {error}
        </div>
        <div className="mt-2 text-xs text-[var(--v-chart-muted)]">
          Location: {searchCriteria.location} | Type: {searchCriteria.listingType}
        </div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className={`${shell} p-4`}>
        <h3 className="mb-2 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">
          property search results
        </h3>
        <div className="text-xs text-[var(--v-chart-muted)]">No properties found matching your criteria</div>
      </div>
    );
  }

  return (
    <div className={`${shell} space-y-3 p-4`}>
      <div className="border-b border-[var(--v-chart-card-border)] pb-3">
        <h3 className="mb-2 font-mono text-sm font-semibold text-[var(--v-chart-fg)]">
          property search results
        </h3>
        <div className="text-xs text-[var(--v-chart-muted)]">
          Found {properties.length} properties in {searchCriteria.location}
        </div>
        <div className="mt-1 text-xs text-[var(--v-chart-empty)]">
          {searchCriteria.listingType === 'forRent' ? 'For Rent' : 'For Sale'}
          {searchCriteria.priceMin && ` • From ${formatCurrency(searchCriteria.priceMin)}`}
          {searchCriteria.priceMax && ` • Up to ${formatCurrency(searchCriteria.priceMax)}`}
          {searchCriteria.bedsMin && ` • ${searchCriteria.bedsMin}+ beds`}
        </div>
        <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
          ✓ Sorted by price (lowest first) • ✓ Only showing properties with valid prices
        </div>
      </div>

      {properties.length >= 20 && (
        <div className="border-t border-[var(--v-chart-card-border)] pt-2 text-center text-xs text-[var(--v-chart-empty)]">
          Showing first {properties.length} results (sorted by price)
        </div>
      )}

      <div className="max-h-[500px] space-y-2 overflow-y-auto">
        {properties.map((property, index) => (
          <div
            key={property.id || index}
            onClick={() => handlePropertyClick(property)}
            className={`cursor-pointer rounded border p-3 transition-all ${selectedProperty === property.id ? 'border-[var(--v-chart-tick)] bg-neutral-200/80 dark:border-white/30 dark:bg-white/10' : 'border-[var(--v-chart-card-border)] bg-neutral-100/60 hover:bg-neutral-200/80 dark:border-white/10 dark:bg-white/[0.05] dark:hover:bg-white/10'}`}
          >
            <div className="flex gap-3">
              {property.image && (
                <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded">
                  <img
                    src={property.image}
                    alt={property.addressRaw || 'Property'}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-start justify-between">
                  <div className="text-sm font-bold text-[var(--v-chart-fg)]">
                    {formatCurrency(property.price, property.currency)}
                    {searchCriteria.listingType === 'forRent' && (
                      <span className="text-xs font-normal text-[var(--v-chart-muted)]">/mo</span>
                    )}
                  </div>
                  {property.status && (
                    <div className="rounded bg-neutral-200 px-2 py-0.5 text-xs text-neutral-800 dark:bg-white/10 dark:text-white/80">
                      {property.status}
                    </div>
                  )}
                </div>

                <div className="mb-2 truncate text-xs text-[var(--v-chart-tick)]">
                  {property.addressRaw || property.address?.street || 'Address not available'}
                </div>

                <div className="flex gap-3 text-xs text-[var(--v-chart-muted)]">
                  {property.beds && <div>{property.beds} bed{property.beds > 1 ? 's' : ''}</div>}
                  {property.baths && <div>{property.baths} bath{property.baths > 1 ? 's' : ''}</div>}
                  {property.area && <div>{property.area.toLocaleString()} sqft</div>}
                </div>

                {property.brokerName && (
                  <div className="mt-1 truncate text-xs text-[var(--v-chart-empty)]">{property.brokerName}</div>
                )}
              </div>
            </div>

            <div className="mt-2 text-right text-xs text-[var(--v-chart-empty)]">click to view full details →</div>
          </div>
        ))}
      </div>

      {properties.length < totalResults && (
        <div className="border-t border-[var(--v-chart-card-border)] pt-2 text-center text-xs text-[var(--v-chart-empty)]">
          Showing {properties.length} of {totalResults.toLocaleString()} results
        </div>
      )}
    </div>
  );
};

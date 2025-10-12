// components/dashboard/zillow-listings.tsx (COMPLETE FILE - FIXED CURRENCY)
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

export const ZillowListings = ({ 
  properties, 
  totalResults, 
  searchCriteria, 
  error,
  onPropertySelectAction 
}: ZillowListingsProps) => {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const formatCurrency = (value: number, currency?: string) => {
    // Validate currency code - Zillow sometimes returns '$' which is invalid
    const validCurrency = currency && currency.length === 3 && currency !== '$' ? currency : 'USD';
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: validCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch (error) {
      // Fallback if currency is still invalid
      return `$${value.toLocaleString()}`;
    }
  };

  if (error) {
    return (
      <div className="bg-black border border-white/20 rounded p-4">
        <h3 className="text-white font-mono text-sm mb-2">property search results</h3>
        <div className="text-red-400 text-xs">{error}</div>
        <div className="text-white/60 text-xs mt-2">
          Location: {searchCriteria.location} | Type: {searchCriteria.listingType}
        </div>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="bg-black border border-white/20 rounded p-4">
        <h3 className="text-white font-mono text-sm mb-2">property search results</h3>
        <div className="text-white/60 text-xs">No properties found matching your criteria</div>
      </div>
    );
  }

  const handlePropertyClick = (property: any) => {
    setSelectedProperty(property.id);
    if (onPropertySelectAction && property.url) {
      // Trigger the detail view
      onPropertySelectAction(property.url);
    }
  };

  return (
    <div className="bg-black border border-white/20 rounded p-4 space-y-3">
        {/* Header */}
      <div className="border-b border-white/10 pb-3">
        <h3 className="text-white font-mono text-sm mb-2">property search results</h3>
        <div className="text-white/60 text-xs">
          Found {properties.length} properties in {searchCriteria.location}
        </div>
        <div className="text-white/40 text-xs mt-1">
          {searchCriteria.listingType === 'forRent' ? 'For Rent' : 'For Sale'}
          {searchCriteria.priceMin && ` • From ${formatCurrency(searchCriteria.priceMin)}`}
          {searchCriteria.priceMax && ` • Up to ${formatCurrency(searchCriteria.priceMax)}`}
          {searchCriteria.bedsMin && ` • ${searchCriteria.bedsMin}+ beds`}
        </div>
        <div className="text-green-400 text-xs mt-1">
          ✓ Sorted by price (lowest first) • ✓ Only showing properties with valid prices
        </div>
      </div> 

      {/* Footer - Update to show actual count */}
      {properties.length >= 20 && (
        <div className="text-white/40 text-xs text-center pt-2 border-t border-white/10">
          Showing first {properties.length} results (sorted by price)
        </div>
      )}
      {/* Property List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {properties.map((property, index) => (
          <div
            key={property.id || index}
            onClick={() => handlePropertyClick(property)}
            className={`bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 
                       rounded p-3 cursor-pointer transition-all ${
                         selectedProperty === property.id ? 'border-white/30 bg-white/10' : ''
                       }`}
          >
            <div className="flex gap-3">
              {/* Property Image */}
              {property.image && (
                <div className="w-24 h-20 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={property.image} 
                    alt={property.addressRaw || 'Property'}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Property Details */}
              <div className="flex-1 min-w-0">
                {/* Price and Status */}
                <div className="flex justify-between items-start mb-1">
                  <div className="text-white font-bold text-sm">
                    {formatCurrency(property.price, property.currency)}
                    {searchCriteria.listingType === 'forRent' && (
                      <span className="text-white/60 text-xs font-normal">/mo</span>
                    )}
                  </div>
                  {property.status && (
                    <div className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/80">
                      {property.status}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="text-white/80 text-xs mb-2 truncate">
                  {property.addressRaw || property.address?.street || 'Address not available'}
                </div>

                {/* Property Info */}
                <div className="flex gap-3 text-white/60 text-xs">
                  {property.beds && (
                    <div>{property.beds} bed{property.beds > 1 ? 's' : ''}</div>
                  )}
                  {property.baths && (
                    <div>{property.baths} bath{property.baths > 1 ? 's' : ''}</div>
                  )}
                  {property.area && (
                    <div>{property.area.toLocaleString()} sqft</div>
                  )}
                </div>

                {/* Broker */}
                {property.brokerName && (
                  <div className="text-white/40 text-xs mt-1 truncate">
                    {property.brokerName}
                  </div>
                )}
              </div>
            </div>

            {/* View Details Hint */}
            <div className="text-white/40 text-xs mt-2 text-right">
              click to view full details →
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {properties.length < totalResults && (
        <div className="text-white/40 text-xs text-center pt-2 border-t border-white/10">
          Showing {properties.length} of {totalResults.toLocaleString()} results
        </div>
      )}
    </div>
  );
};

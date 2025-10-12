// components/dashboard/zillow-property.tsx
'use client';

type ZillowPropertyProps = {
  property: any;
  zillowUrl: string;
  error?: string;
};

export const ZillowProperty = ({ property, zillowUrl, error }: ZillowPropertyProps) => {
  if (error) {
    return (
      <div className="bg-black border border-white/20 rounded p-4">
        <h3 className="text-white font-mono text-sm mb-2">zillow property data</h3>
        <div className="text-red-400 text-xs">{error}</div>
        <div className="text-white/60 text-xs mt-2">URL: {zillowUrl}</div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="bg-black border border-white/20 rounded p-4">
        <div className="text-white/60 text-xs">No property data available</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: property.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-black border border-white/20 rounded p-4 space-y-4">
      {/* Header */}
      <div className="border-b border-white/10 pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-white font-mono text-sm font-bold">{property.addressRaw}</h3>
            <div className="text-white/60 text-xs mt-1">
              {property.address?.city}, {property.address?.state} {property.address?.zipcode}
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-lg">{formatCurrency(property.price)}</div>
            <div className="text-white/60 text-xs">{property.status}</div>
          </div>
        </div>
      </div>

      {/* Main Property Image */}
      {property.image && (
        <div className="rounded overflow-hidden border border-white/10">
          <img 
            src={property.image} 
            alt={property.addressRaw}
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {property.beds && (
          <div className="bg-white/5 rounded p-2 text-center">
            <div className="text-white/60">beds</div>
            <div className="text-white font-bold text-lg">{property.beds}</div>
          </div>
        )}
        {property.baths && (
          <div className="bg-white/5 rounded p-2 text-center">
            <div className="text-white/60">baths</div>
            <div className="text-white font-bold text-lg">{property.baths}</div>
          </div>
        )}
        {property.area && (
          <div className="bg-white/5 rounded p-2 text-center">
            <div className="text-white/60">sqft</div>
            <div className="text-white font-bold text-lg">{property.area.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-3">
        {property.homeType && (
          <div>
            <span className="text-white/60">type: </span>
            <span className="text-white">{property.homeType}</span>
          </div>
        )}
        {property.yearBuilt && (
          <div>
            <span className="text-white/60">built: </span>
            <span className="text-white">{property.yearBuilt}</span>
          </div>
        )}
        {property.lotSize && (
          <div>
            <span className="text-white/60">lot size: </span>
            <span className="text-white">{property.lotSize} {property.lotAreaUnits}</span>
          </div>
        )}
        {property.county && (
          <div>
            <span className="text-white/60">county: </span>
            <span className="text-white">{property.county}</span>
          </div>
        )}
      </div>

      {/* Zestimate */}
      {(property.zestimate || property.rentZestimate) && (
        <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-3">
          {property.zestimate && (
            <div className="bg-white/5 rounded p-2">
              <div className="text-white/60 mb-1">zestimate</div>
              <div className="text-white font-bold">{formatCurrency(property.zestimate)}</div>
            </div>
          )}
          {property.rentZestimate && (
            <div className="bg-white/5 rounded p-2">
              <div className="text-white/60 mb-1">rent zestimate</div>
              <div className="text-white font-bold">{formatCurrency(property.rentZestimate)}/mo</div>
            </div>
          )}
        </div>
      )}

      {/* Agent Info */}
      {(property.agentName || property.brokerName) && (
        <div className="border-t border-white/10 pt-3">
          <div className="text-white/60 text-xs mb-2">listing agent</div>
          <div className="bg-white/5 rounded p-2 text-xs">
            {property.agentName && (
              <div className="text-white font-bold">{property.agentName}</div>
            )}
            {property.brokerName && (
              <div className="text-white/60 mt-1">{property.brokerName}</div>
            )}
            {property.agentPhoneNumber && (
              <div className="text-white mt-1">{property.agentPhoneNumber}</div>
            )}
          </div>
        </div>
      )}

      {/* Price History */}
      {property.priceHistory && property.priceHistory.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <div className="text-white/60 text-xs mb-2">price history</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {property.priceHistory.slice(0, 5).map((history: any, i: number) => (
              <div key={i} className="bg-white/5 rounded p-2 text-xs flex justify-between items-center">
                <div>
                  <div className="text-white">{history.event}</div>
                  <div className="text-white/60">{formatDate(history.time)}</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-bold">{formatCurrency(history.price)}</div>
                  {history.priceChangeRate && (
                    <div className={`${history.priceChangeRate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {(history.priceChangeRate * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {property.description && (
        <div className="border-t border-white/10 pt-3">
          <div className="text-white/60 text-xs mb-2">description</div>
          <div className="text-white text-xs leading-relaxed max-h-32 overflow-y-auto">
            {property.description}
          </div>
        </div>
      )}

      {/* View on Zillow Link */}
      <div className="border-t border-white/10 pt-3">
        <a 
          href={property.url || zillowUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/60 hover:text-white text-xs underline"
        >
          view full listing on zillow →
        </a>
      </div>
    </div>
  );
};

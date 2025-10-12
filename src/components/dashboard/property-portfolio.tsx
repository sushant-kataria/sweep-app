// components/dashboard/property-portfolio.tsx (COMPLETE FILE)
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
      case 'active': return 'text-green-400';
      case 'rented': return 'text-blue-400';
      case 'for sale': return 'text-yellow-400';
      case 'sold': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="bg-black border border-white/20 rounded p-4 space-y-4">
      <div className="border-b border-white/10 pb-3">
        <h3 className="text-white font-mono text-sm mb-3">property portfolio dashboard</h3>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/60 mb-1">total properties</div>
            <div className="text-white font-bold text-lg">{properties.length}</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/60 mb-1">portfolio value</div>
            <div className="text-white font-bold text-lg">{formatCurrency(totalPortfolioValue)}</div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/60 mb-1">total appreciation</div>
            <div className={`font-bold text-lg ${totalAppreciation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalAppreciation)}
            </div>
          </div>
          <div className="bg-white/5 rounded p-2">
            <div className="text-white/60 mb-1">monthly income</div>
            <div className="text-white font-bold text-lg">{formatCurrency(totalMonthlyIncome)}</div>
          </div>
        </div>
      </div>

      {/* Individual Properties */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {properties.map((property) => {
          const appreciation = parseFloat(calculateAppreciation(property.purchasePrice, property.currentValue));
          
          return (
            <div key={property.id} className="bg-white/5 border border-white/10 rounded p-3 space-y-2">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="text-white font-bold text-sm">{property.address}</div>
                  <div className="text-white/60 text-xs mt-0.5">
                    owner: {property.ownerName} | id: {property.id}
                  </div>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor(property.status)}`}>
                  {property.status}
                </div>
              </div>

              {/* Property Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-white/60">type: </span>
                  <span className="text-white">{property.propertyType}</span>
                </div>
                <div>
                  <span className="text-white/60">built: </span>
                  <span className="text-white">{property.yearBuilt} ({calculateAge(property.yearBuilt)} yrs old)</span>
                </div>
                <div>
                  <span className="text-white/60">size: </span>
                  <span className="text-white">{property.squareFeet.toLocaleString()} sqft</span>
                </div>
                {property.bedrooms && property.bathrooms && (
                  <div>
                    <span className="text-white/60">beds/baths: </span>
                    <span className="text-white">{property.bedrooms}bd / {property.bathrooms}ba</span>
                  </div>
                )}
              </div>

              {/* Financial Details */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-white/10 pt-2">
                <div>
                  <div className="text-white/60">purchase price</div>
                  <div className="text-white font-bold">{formatCurrency(property.purchasePrice)}</div>
                  <div className="text-white/40 text-xs">
                    {property.purchaseDate} ({calculateYearsOwned(property.purchaseDate)} yrs)
                  </div>
                </div>
                <div>
                  <div className="text-white/60">current value</div>
                  <div className="text-white font-bold">{formatCurrency(property.currentValue)}</div>
                  <div className={`text-xs ${appreciation >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {appreciation >= 0 ? '+' : ''}{appreciation}% appreciation
                  </div>
                </div>
                {property.rentalIncome && (
                  <div className="col-span-2 mt-2">
                    <div className="text-white/60">rental income</div>
                    <div className="text-white font-bold">
                      {formatCurrency(property.rentalIncome)}/month
                      <span className="text-white/60 font-normal text-xs ml-2">
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

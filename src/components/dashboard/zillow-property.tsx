// components/dashboard/zillow-property.tsx
'use client';

type ZillowPropertyProps = {
  property: any;
  zillowUrl: string;
  error?: string;
};

const shell =
  'rounded-lg border border-[var(--v-chart-card-border)] bg-white text-[var(--v-chart-fg)] dark:bg-[var(--v-chart-card-bg)]';

const nested = 'rounded bg-neutral-100/80 dark:bg-white/[0.06]';

export const ZillowProperty = ({ property, zillowUrl, error }: ZillowPropertyProps) => {
  if (error) {
    return (
      <div className={`${shell} space-y-3 p-4`}>
        <h3 className="font-mono text-sm font-semibold text-[var(--v-chart-fg)]">zillow property data</h3>
        <div className="text-xs text-red-600 dark:text-red-400">{error}</div>
        <div className="mt-2 text-xs text-[var(--v-chart-muted)]">
          <div className="mb-2">URL: {zillowUrl}</div>
          <div className={`${nested} mt-2 p-2 text-xs`}>
            <div className="mb-1 text-[var(--v-chart-tick)]">Possible issues:</div>
            <ul className="list-inside list-disc space-y-1 text-[var(--v-chart-muted)]">
              <li>Property may have been removed from Zillow</li>
              <li>Property URL might be incorrect</li>
              <li>API rate limit reached (try again in a moment)</li>
            </ul>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.open(zillowUrl, '_blank')}
          className="mt-1 text-xs text-[var(--v-chart-muted)] underline hover:text-[var(--v-chart-fg)]"
        >
          view original listing on zillow →
        </button>
      </div>
    );
  }

  if (!property) {
    return (
      <div className={`${shell} p-4`}>
        <div className="text-xs text-[var(--v-chart-muted)]">No property data available</div>
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
    <div className={`${shell} space-y-4 p-4`}>
      <div className="border-b border-[var(--v-chart-card-border)] pb-3">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-mono text-sm font-bold text-[var(--v-chart-fg)]">{property.addressRaw}</h3>
            <div className="mt-1 text-xs text-[var(--v-chart-muted)]">
              {property.address?.city}, {property.address?.state} {property.address?.zipcode}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-[var(--v-chart-fg)]">{formatCurrency(property.price)}</div>
            <div className="text-xs text-[var(--v-chart-muted)]">{property.status}</div>
          </div>
        </div>
      </div>

      {property.image && (
        <div className="overflow-hidden rounded border border-[var(--v-chart-card-border)]">
          <img src={property.image} alt={property.addressRaw} className="h-48 w-full object-cover" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-xs">
        {property.beds && (
          <div className={`${nested} p-2 text-center`}>
            <div className="text-[var(--v-chart-muted)]">beds</div>
            <div className="text-lg font-bold text-[var(--v-chart-fg)]">{property.beds}</div>
          </div>
        )}
        {property.baths && (
          <div className={`${nested} p-2 text-center`}>
            <div className="text-[var(--v-chart-muted)]">baths</div>
            <div className="text-lg font-bold text-[var(--v-chart-fg)]">{property.baths}</div>
          </div>
        )}
        {property.area && (
          <div className={`${nested} p-2 text-center`}>
            <div className="text-[var(--v-chart-muted)]">sqft</div>
            <div className="text-lg font-bold text-[var(--v-chart-fg)]">{property.area.toLocaleString()}</div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-[var(--v-chart-card-border)] pt-3 text-xs">
        {property.homeType && (
          <div>
            <span className="text-[var(--v-chart-muted)]">type: </span>
            <span className="text-[var(--v-chart-fg)]">{property.homeType}</span>
          </div>
        )}
        {property.yearBuilt && (
          <div>
            <span className="text-[var(--v-chart-muted)]">built: </span>
            <span className="text-[var(--v-chart-fg)]">{property.yearBuilt}</span>
          </div>
        )}
        {property.lotSize && (
          <div>
            <span className="text-[var(--v-chart-muted)]">lot size: </span>
            <span className="text-[var(--v-chart-fg)]">
              {property.lotSize} {property.lotAreaUnits}
            </span>
          </div>
        )}
        {property.county && (
          <div>
            <span className="text-[var(--v-chart-muted)]">county: </span>
            <span className="text-[var(--v-chart-fg)]">{property.county}</span>
          </div>
        )}
      </div>

      {(property.zestimate || property.rentZestimate) && (
        <div className="grid grid-cols-2 gap-2 border-t border-[var(--v-chart-card-border)] pt-3 text-xs">
          {property.zestimate && (
            <div className={`${nested} p-2`}>
              <div className="mb-1 text-[var(--v-chart-muted)]">zestimate</div>
              <div className="font-bold text-[var(--v-chart-fg)]">{formatCurrency(property.zestimate)}</div>
            </div>
          )}
          {property.rentZestimate && (
            <div className={`${nested} p-2`}>
              <div className="mb-1 text-[var(--v-chart-muted)]">rent zestimate</div>
              <div className="font-bold text-[var(--v-chart-fg)]">
                {formatCurrency(property.rentZestimate)}/mo
              </div>
            </div>
          )}
        </div>
      )}

      {(property.agentName || property.brokerName) && (
        <div className="border-t border-[var(--v-chart-card-border)] pt-3">
          <div className="mb-2 text-xs text-[var(--v-chart-muted)]">listing agent</div>
          <div className={`${nested} p-2 text-xs`}>
            {property.agentName && <div className="font-bold text-[var(--v-chart-fg)]">{property.agentName}</div>}
            {property.brokerName && <div className="mt-1 text-[var(--v-chart-muted)]">{property.brokerName}</div>}
            {property.agentPhoneNumber && (
              <div className="mt-1 text-[var(--v-chart-fg)]">{property.agentPhoneNumber}</div>
            )}
          </div>
        </div>
      )}

      {property.priceHistory && property.priceHistory.length > 0 && (
        <div className="border-t border-[var(--v-chart-card-border)] pt-3">
          <div className="mb-2 text-xs text-[var(--v-chart-muted)]">price history</div>
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {property.priceHistory.slice(0, 5).map((history: any, i: number) => (
              <div key={i} className={`${nested} flex items-center justify-between p-2 text-xs`}>
                <div>
                  <div className="text-[var(--v-chart-fg)]">{history.event}</div>
                  <div className="text-[var(--v-chart-muted)]">{formatDate(history.time)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[var(--v-chart-fg)]">{formatCurrency(history.price)}</div>
                  {history.priceChangeRate && (
                    <div
                      className={
                        history.priceChangeRate > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      }
                    >
                      {(history.priceChangeRate * 100).toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {property.description && (
        <div className="border-t border-[var(--v-chart-card-border)] pt-3">
          <div className="mb-2 text-xs text-[var(--v-chart-muted)]">description</div>
          <div className="max-h-32 overflow-y-auto text-xs leading-relaxed text-[var(--v-chart-tick)]">
            {property.description}
          </div>
        </div>
      )}

      <div className="border-t border-[var(--v-chart-card-border)] pt-3">
        <a
          href={property.url || zillowUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--v-chart-muted)] underline hover:text-[var(--v-chart-fg)]"
        >
          view full listing on zillow →
        </a>
      </div>
    </div>
  );
};

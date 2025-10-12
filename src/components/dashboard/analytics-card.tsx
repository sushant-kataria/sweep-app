// components/dashboard/analytics-card.tsx (ENSURE THIS IS ALSO CORRECT)
type AnalyticsProps = {
    views: number;
    clicks: number;
    conversions: number;
    timeRange: string;
  };
  
  export const AnalyticsCard = ({ views, clicks, conversions, timeRange }: AnalyticsProps) => {
    return (
      <div className="bg-black border border-white/20 rounded p-4">
        <h3 className="text-white font-mono text-sm mb-3">analytics ({timeRange})</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/60">views</span>
            <span className="text-white">{views.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/60">clicks</span>
            <span className="text-white">{clicks.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-white/60">conversions</span>
            <span className="text-white">{conversions.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };
  
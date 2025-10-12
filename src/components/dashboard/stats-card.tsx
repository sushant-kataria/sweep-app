// components/dashboard/stats-card.tsx
type StatsProps = {
    title: string;
    stats: Array<{
      label: string;
      value: string;
      change?: string;
    }>;
  };
  
  export const StatsCard = ({ title, stats }: StatsProps) => {
    return (
      <div className="bg-black border border-white/20 rounded p-4">
        <h3 className="text-white font-mono text-sm mb-3">{title}</h3>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="border border-white/10 rounded p-2">
              <div className="text-xs font-mono text-white/60 mb-1">{stat.label}</div>
              <div className="text-sm font-mono text-white">{stat.value}</div>
              {stat.change && (
                <div className="text-xs font-mono text-white/60 mt-1">{stat.change}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
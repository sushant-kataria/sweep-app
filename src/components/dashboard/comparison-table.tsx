// components/dashboard/comparison-table.tsx
type ComparisonProps = {
    title: string;
    items: Array<{
      name: string;
      metrics: Record<string, number | string>;
    }>;
  };
  
  export const ComparisonTable = ({ title, items }: ComparisonProps) => {
    if (!items.length) return null;
    
    const metricKeys = Object.keys(items[0].metrics);
    
    return (
      <div className="bg-black border border-white/20 rounded p-4">
        <h3 className="text-white font-mono text-sm mb-3">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left text-white py-2 pr-2">Name</th>
                {metricKeys.map(key => (
                  <th key={key} className="text-right text-white/60 py-2 px-2">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-white/10">
                  <td className="text-white py-2 pr-2">{item.name}</td>
                  {metricKeys.map(key => (
                    <td key={key} className="text-right text-white/80 py-2 px-2">
                      {typeof item.metrics[key] === 'number'
                        ? item.metrics[key].toLocaleString()
                        : item.metrics[key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
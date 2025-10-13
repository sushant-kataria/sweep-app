'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';

import { BarChartPro } from '@/components/dashboard/bar-chart-pro';
import { LineChartPro } from '@/components/dashboard/line-chart-pro';
import { PieChartPro } from '@/components/dashboard/pie-chart-pro';
import { AreaChartPro } from '@/components/dashboard/area-chart-pro';
import { ComparisonTable } from '@/components/dashboard/comparison-table';
import { StatsCard } from '@/components/dashboard/stats-card';
import { BalanceSheet } from '@/components/dashboard/balance-sheet';
import { PropertyPortfolio } from '@/components/dashboard/property-portfolio';
import { ZillowProperty } from '@/components/dashboard/zillow-property';
import { ZillowListings } from '@/components/dashboard/zillow-listings';

type ChartOutput = { chartType: string; title: string; unit?: string; data: Array<{ label: string; value: number }>; };
type ComparisonOutput = { title: string; items: Array<{ name: string; metrics: Record<string, number | string>; }>; };
type StatsOutput = { title: string; stats: Array<{ label: string; value: string; change?: string; }>; };
type BalanceSheetOutput = {
  title: string; period: string; currency: string;
  assets: { current: Array<{ label: string; value: number }>; nonCurrent: Array<{ label: string; value: number }>; };
  liabilities: { current: Array<{ label: string; value: number }>; nonCurrent: Array<{ label: string; value: number }>; };
  equity: Array<{ label: string; value: number }>;
};
type PropertyPortfolioOutput = { properties: Array<any>; };
type ZillowPropertyOutput = { success?: boolean; property?: any; zillowUrl: string; error?: string; };
type ZillowListingsOutput = {
  success?: boolean; properties: any[]; totalResults: number;
  searchCriteria: { location: string; listingType: string; priceMin?: number; priceMax?: number; bedsMin?: number };
  error?: string;
};

export default function Chat() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [hasDashboardItems, setHasDashboardItems] = useState(false);

  const suggestions = [
    'show apple stock',
    'price of tesla',
    'find homes for sale in los angeles below $900000',
    'show walmart balance sheet',
    'compare top US companies by market cap',
      ];

  // Tracks if dashboard content exists in any message
  useEffect(() => {
    const toolTypes = [
      'tool-showBarChart', 'tool-showLineChart', 'tool-showPieChart', 'tool-showAreaChart', 'tool-showComparison',
      'tool-showStats', 'tool-showBalanceSheet', 'tool-showPropertyPortfolio', 'tool-showZillowProperty'
    ];
    const hasItems = messages.some((message) =>
      message.parts.some((part) =>
        toolTypes.includes(part.type) && 'state' in part && part.state === 'output-available'
      )
    );
    setHasDashboardItems(hasItems);
    // hide dashboard if there are no dashboard results
    if (!hasItems) setShowSidebar(false);
  }, [messages]);

  // Hide dashboard on every new query
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setShowSidebar(false);
    sendMessage({ text: input });
    setInput('');
  };

  const handleLogoClick = () => window.location.reload();

  // Loading steps for bottom loader
  const getLoadingSteps = () => {
    if (messages.length === 0) return [];
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return [];
    const steps: Array<{ name: string; status: 'pending' | 'loading' | 'complete' }> = [];
    const toolNameMap: Record<string, string> = {
      'tool-showBarChart': 'Creating bar chart',
      'tool-showLineChart': 'Creating line chart',
      'tool-showPieChart': 'Creating pie chart',
      'tool-showAreaChart': 'Creating area chart',
      'tool-showComparison': 'Building comparison table',
      'tool-showStats': 'Calculating statistics',
      'tool-showBalanceSheet': 'Generating balance sheet',
      'tool-showPropertyPortfolio': 'Loading property portfolio',
      'tool-showZillowProperty': 'Fetching Zillow data',
      'tool-searchZillowListings': 'Searching properties',
    };
    lastMessage.parts.forEach((part) => {
      if ('state' in part && part.type.startsWith('tool-')) {
        const toolName = toolNameMap[part.type] || part.type.replace('tool-show', 'Processing ');
        let stepStatus: 'pending' | 'loading' | 'complete' = 'pending';
        if (part.state === 'input-available' || part.state === 'input-streaming') {
          stepStatus = 'loading';
        } else if (part.state === 'output-available') {
          stepStatus = 'complete';
        }
        steps.push({ name: toolName, status: stepStatus });
      }
    });
    if (status === 'streaming') {
      const hasText = lastMessage.parts.some(p => p.type === 'text');
      if (hasText) {
        steps.push({ name: 'Writing response', status: 'loading' });
      } else if (steps.length === 0) {
        steps.push({ name: 'Thinking', status: 'loading' });
      }
    }
    return steps;
  };

  const loadingSteps = getLoadingSteps();

  // Dashboard rendering
  const renderDashboardItems = (message: any) => {
    return message.parts.map((part: any) => {
      const hasState = 'state' in part;
      const hasToolCallId = 'toolCallId' in part;
      if (!hasState || !hasToolCallId || part.state !== 'output-available') return null;
      const callId = part.toolCallId;
      if (part.type === 'tool-showBarChart') {
        const output = part.output as ChartOutput;
        return <BarChartPro key={callId} title={output.title} data={output.data} unit={output.unit} />;
      }
      if (part.type === 'tool-showLineChart') {
        const output = part.output as ChartOutput;
        return <LineChartPro key={callId} title={output.title} data={output.data} unit={output.unit} />;
      }
      if (part.type === 'tool-showPieChart') {
        const output = part.output as ChartOutput;
        return <PieChartPro key={callId} title={output.title} data={output.data} unit={output.unit} />;
      }
      if (part.type === 'tool-showAreaChart') {
        const output = part.output as ChartOutput;
        return <AreaChartPro key={callId} title={output.title} data={output.data} unit={output.unit} />;
      }
      if (part.type === 'tool-showComparison') {
        const output = part.output as ComparisonOutput;
        return <ComparisonTable key={callId} title={output.title} items={output.items} />;
      }
      if (part.type === 'tool-showStats') {
        const output = part.output as StatsOutput;
        return <StatsCard key={callId} title={output.title} stats={output.stats} />;
      }
      if (part.type === 'tool-showBalanceSheet') {
        const output = part.output as BalanceSheetOutput;
        return (
          <BalanceSheet key={callId} title={output.title} period={output.period}
            currency={output.currency} assets={output.assets} liabilities={output.liabilities} equity={output.equity}
          />
        );
      }
      if (part.type === 'tool-showPropertyPortfolio') {
        const output = part.output as PropertyPortfolioOutput;
        return <PropertyPortfolio key={callId} properties={output.properties} />;
      }
      if (part.type === 'tool-showZillowProperty') {
        const output = part.output as ZillowPropertyOutput;
        return <ZillowProperty key={callId} property={output.property} zillowUrl={output.zillowUrl} error={output.error} />;
      }
      return null;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header with responsive positioning */}
      {messages.length > 0 && (
  <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
    <div className={
      showSidebar
        ? "px-4 py-3 flex items-center"
        : "max-w-7xl mx-auto px-4 py-3 flex items-center justify-center"
    }>
      <button
        onClick={handleLogoClick}
        className="text-2xl font-mono hover:opacity-80 transition-opacity"
      >
        <span className="bg-gradient-to-r from-gray-600 via-white to-gray-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]">
          Sweep
        </span>
      </button>
    </div>
  </header>
)}


      <main className={`transition-all duration-300 ${showSidebar ? 'md:mr-[40%]' : 'mr-0'} ${messages.length > 0 ? 'pt-16' : ''}`}>
        <div className="max-w-3xl mx-auto px-4 pb-40 pt-8">

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-screen">
              <h1 className="text-7xl md:text-8xl font-mono mb-10 text-center relative overflow-hidden">
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-gray-600 via-white to-gray-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]">
                    Sweep
                  </span>
                </span>
              </h1>
              <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto mb-6 relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-white/5 text-white rounded-2xl pl-6 pr-12 py-4 border border-white/10 focus:border-white/20 focus:outline-none placeholder-gray-500 text-sm backdrop-blur-xl hover:bg-white/[0.07] transition-all"
                  placeholder="ask anything..."
                  autoComplete="off"
                  aria-label="Message input"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  aria-label="Submit message"
                  className="absolute right-4 top-1/2 -translate-y-1/2 size-8 rounded-lg p-0 bg-gradient-to-br from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-all duration-200 hover:shadow-lg hover:shadow-gray-700/50 flex items-center justify-center group"
                  tabIndex={-1}
                >
                  <Send className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                </button>
              </form>
              <div className="w-full max-w-md mx-auto">
                <div className="flex flex-col gap-2 items-center">
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="text-xs text-gray-400 hover:text-white px-3 py-2 rounded transition-colors"
                      tabIndex={0}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8">
              {messages.map((m, idx) => (
                <div key={m.id}>
                  {m.role === 'user' && (
                    <div className="py-6">
                      <p className="text-white text-base font-bold leading-relaxed">
                        {m.parts.filter((part) => part.type === 'text').map((part, index) => (
                          <span key={index}>{part.text}</span>
                        ))}
                      </p>
                    </div>
                  )}
                  {m.role === 'assistant' && (
                    <div className="py-6 space-y-4">
                      <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {m.parts.filter((part) => part.type === 'text').map((part, index) => (
                          <span key={index}>{part.text}</span>
                        ))}
                      </div>
                      {m.parts.map((part) => {
                        const hasState = 'state' in part;
                        const hasToolCallId = 'toolCallId' in part;
                        if (!hasState || !hasToolCallId) return null;
                        const callId = part.toolCallId;
                        if (part.type === 'tool-searchZillowListings' && part.state === 'output-available') {
                          const output = part.output as ZillowListingsOutput;
                          return (
                            <div key={callId} className="mt-4">
                              <ZillowListings
                                properties={output.properties || []}
                                totalResults={output.totalResults || 0}
                                searchCriteria={output.searchCriteria}
                                error={output.error}
                                onPropertySelectAction={(url) => { sendMessage({ text: `show zillow property ${url}` }); }}
                              />
                            </div>
                          );
                        }
                        return null;
                      })}
                      <div className="md:hidden space-y-4 mt-4">
                        {renderDashboardItems(m)}
                      </div>
                    </div>
                  )}
                  {idx < messages.length - 1 && (
                    <div className="border-b border-gray-800"></div>
                  )}
                </div>
              ))}
              {(status === 'streaming' || loadingSteps.some(s => s.status === 'loading')) && loadingSteps.length > 0 && (
                <div className="py-6 border-t border-gray-800">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                    <div className="text-white/60 text-xs mb-2">processing your request...</div>
                    {loadingSteps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {step.status === 'complete' && (
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                          </div>
                        )}
                        {step.status === 'loading' && (
                          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin flex-shrink-0" />
                        )}
                        {step.status === 'pending' && (
                          <div className="w-5 h-5 rounded-full bg-white/10 flex-shrink-0" />
                        )}
                        <div className={`text-xs ${
                          step.status === 'complete' ? 'text-green-400' :
                          step.status === 'loading' ? 'text-white' :
                          'text-white/40'
                        }`}>
                          {step.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {status === 'streaming' && loadingSteps.length === 0 && (
                <div className="py-6 border-t border-gray-800">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-4">
                  <p className="text-red-400 text-sm">
                    {error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('429')
                      ? 'Rate limit exceeded. Please wait a moment and try again.'
                      : 'An error occurred. Please try again.'}
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-xs text-white/60 hover:text-white underline"
                  >
                    refresh page
                  </button>
                </div>
              )}

              {/* Show/hide dashboard controls (desktop only) */}
              {hasDashboardItems && !showSidebar && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="hidden md:block text-xs text-gray-500 hover:text-white transition-colors text-center mt-3 w-full"
                >
                  [show dashboard]
                </button>
              )}
              {showSidebar && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="hidden md:block text-xs text-gray-500 hover:text-white transition-colors text-center mt-3 w-full"
                >
                  [hide dashboard]
                </button>
              )}
            </div>
          )}
        </div>
        {(messages.length > 0) && (
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-transparent pt-12 pb-6 z-30" style={{ marginRight: showSidebar ? 'calc(40%)' : '0' }}>
            <div className="max-w-3xl mx-auto px-4">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-white/5 text-white rounded-2xl pl-6 pr-12 py-4 border border-white/10 focus:border-white/20 focus:outline-none placeholder-gray-500 text-sm backdrop-blur-xl hover:bg-white/[0.07] transition-all"
                  placeholder="ask anything..."
                  disabled={status === 'streaming'}
                  autoComplete="off"
                  aria-label="Message input"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || status === 'streaming'}
                  aria-label="Submit message"
                  className="absolute right-4 top-1/2 -translate-y-1/2 size-8 rounded-lg p-0 bg-gradient-to-br from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-all duration-200 hover:shadow-lg hover:shadow-gray-700/50 flex items-center justify-center group"
                >
                  <Send className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
      <aside className={`hidden md:block fixed top-0 right-0 h-full w-[40%] bg-black border-l border-white/5 overflow-y-auto transform transition-transform duration-300 ease-in-out z-50 ${
        showSidebar ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 space-y-4">
          {messages.map((message) => renderDashboardItems(message))}
        </div>
      </aside>
    </div>
  );
}

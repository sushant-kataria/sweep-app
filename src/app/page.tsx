'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { Send, BarChart2, X, Search, MessageSquare, Code2 } from 'lucide-react';

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

type Mode = 'chat' | 'search' | 'code';

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

const modes: { id: Mode; label: string; icon: React.ReactNode; placeholder: string }[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    placeholder: 'Ask anything...',
  },
  {
    id: 'search',
    label: 'Search',
    icon: <Search className="w-3.5 h-3.5" />,
    placeholder: 'Search for information...',
  },
  {
    id: 'code',
    label: 'Code',
    icon: <Code2 className="w-3.5 h-3.5" />,
    placeholder: 'Ask a coding question...',
  },
];

function ImageWithLoader({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className="relative w-full max-w-sm rounded-xl overflow-hidden border border-white/10 bg-white/[0.03]" style={{ aspectRatio: '1' }}>
      {!loaded && !errored && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-white/15 border-t-white/50 animate-spin" />
          <span className="text-[10px] text-white/25 font-mono">generating...</span>
        </div>
      )}
      {errored && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-white/30">Failed to load image</span>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease' }}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
      />
    </div>
  );
}

const suggestionsByMode: Record<Mode, Array<{ label: string; icon: string }>> = {
  chat: [
    { label: 'Apple stock chart', icon: '📈' },
    { label: 'Cyberpunk portrait of a man', icon: '🎨' },
    { label: 'Homes for sale in LA below $900k', icon: '🏡' },
    { label: 'Walmart balance sheet', icon: '📊' },
    { label: 'Top US companies by market cap', icon: '🏢' },
  ],
  search: [
    { label: 'How does NVIDIA Nemotron work?', icon: '🤖' },
    { label: 'Latest developments in fusion energy', icon: '⚡' },
    { label: 'India vs China GDP comparison', icon: '🌏' },
    { label: 'History of the internet', icon: '🌐' },
    { label: 'SpaceX Starship program overview', icon: '🚀' },
  ],
  code: [
    { label: 'Build a REST API with FastAPI', icon: '🐍' },
    { label: 'React custom hook for debounce', icon: '⚛️' },
    { label: 'Implement binary search in TypeScript', icon: '🔍' },
    { label: 'Docker compose for Next.js + Postgres', icon: '🐳' },
    { label: 'Async/await vs Promise chaining', icon: '⚡' },
  ],
};

const toolTypes = [
  'tool-showBarChart', 'tool-showLineChart', 'tool-showPieChart', 'tool-showAreaChart', 'tool-showComparison',
  'tool-showStats', 'tool-showBalanceSheet', 'tool-showPropertyPortfolio', 'tool-showZillowProperty', 'tool-generateImage'
];

const toolNameMap: Record<string, string> = {
  'tool-showBarChart': 'Creating bar chart',
  'tool-showLineChart': 'Creating line chart',
  'tool-showPieChart': 'Creating pie chart',
  'tool-showAreaChart': 'Creating area chart',
  'tool-showComparison': 'Building comparison',
  'tool-showStats': 'Calculating stats',
  'tool-showBalanceSheet': 'Generating balance sheet',
  'tool-showPropertyPortfolio': 'Loading portfolio',
  'tool-showZillowProperty': 'Fetching property data',
  'tool-searchZillowListings': 'Searching properties',
  'tool-generateImage': 'Generating image',
};

const modeColors: Record<Mode, string> = {
  chat: 'text-white/80 border-white/30 bg-white/[0.08]',
  search: 'text-sky-300 border-sky-400/40 bg-sky-400/[0.08]',
  code: 'text-emerald-300 border-emerald-400/40 bg-emerald-400/[0.08]',
};

const modeInactiveColors: Record<Mode, string> = {
  chat: 'text-white/40 border-white/[0.08] bg-transparent hover:text-white/60 hover:border-white/20',
  search: 'text-white/40 border-white/[0.08] bg-transparent hover:text-sky-300/60 hover:border-sky-400/20',
  code: 'text-white/40 border-white/[0.08] bg-transparent hover:text-emerald-300/60 hover:border-emerald-400/20',
};

export default function Chat() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('chat');
  const [showSidebar, setShowSidebar] = useState(false);
  const [hasDashboardItems, setHasDashboardItems] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const outputs = messages.flatMap(message =>
      message.parts.filter(
        part => toolTypes.includes(part.type) && 'state' in part && part.state === 'output-available'
      )
    );
    const hasItems = outputs.length > 0;
    setHasDashboardItems(hasItems);
    if (!hasItems) setShowSidebar(false);
    else setShowSidebar(true);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const cleanText = (text: string) =>
    text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^#{1,6}\s+/gm, '');

  // AUTO-RETRY LOGIC
  useEffect(() => {
    const lastAssistant = messages[messages.length - 1];
    if (
      lastAssistant?.role === 'assistant' &&
      lastAssistant.parts.some(part => {
        if (!(part.type === 'text' && 'text' in part)) return false;
        const text = part.text.toLowerCase();
        const errorPatterns = [
          "could not be displayed", "incorrectly formatted",
          "i encountered an issue with the provided data", "data format error",
          "unable to display", "failed to display", "error displaying"
        ];
        return errorPatterns.some(p => text.includes(p)) && !part.text.includes("[auto-retried]");
      })
    ) {
      sendMessage({ text: "retry [auto-retried]" });
    }
  }, [messages, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setShowSidebar(false);
    sendMessage({ text: input }, { body: { mode } });
    setInput('');
  };

  const handleSuggestion = (label: string) => {
    sendMessage({ text: label }, { body: { mode } });
  };

  const getLoadingSteps = () => {
    if (messages.length === 0) return [];
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'assistant') return [];
    const steps: Array<{ name: string; status: 'pending' | 'loading' | 'complete' }> = [];

    lastMessage.parts.forEach((part) => {
      if ('state' in part && part.type.startsWith('tool-')) {
        const toolName = toolNameMap[part.type] || part.type.replace('tool-show', '');
        let stepStatus: 'pending' | 'loading' | 'complete' = 'pending';
        if (part.state === 'input-available' || part.state === 'input-streaming') stepStatus = 'loading';
        else if (part.state === 'output-available') stepStatus = 'complete';
        steps.push({ name: toolName, status: stepStatus });
      }
    });

    return steps;
  };

  const loadingSteps = getLoadingSteps();

  const renderDashboardItems = (message: any) => {
    return message.parts.map((part: any) => {
      const hasState = 'state' in part;
      const hasToolCallId = 'toolCallId' in part;
      if (!hasState || !hasToolCallId || part.state !== 'output-available') return null;
      const callId = part.toolCallId;

      if (part.type === 'tool-showBarChart') return <BarChartPro key={callId} title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />;
      if (part.type === 'tool-showLineChart') return <LineChartPro key={callId} title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />;
      if (part.type === 'tool-showPieChart') return <PieChartPro key={callId} title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />;
      if (part.type === 'tool-showAreaChart') return <AreaChartPro key={callId} title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />;
      if (part.type === 'tool-showComparison') return <ComparisonTable key={callId} title={(part.output as ComparisonOutput).title} items={(part.output as ComparisonOutput).items} />;
      if (part.type === 'tool-showStats') return <StatsCard key={callId} title={(part.output as StatsOutput).title} stats={(part.output as StatsOutput).stats} />;
      if (part.type === 'tool-showBalanceSheet') {
        const o = part.output as BalanceSheetOutput;
        return <BalanceSheet key={callId} title={o.title} period={o.period} currency={o.currency} assets={o.assets} liabilities={o.liabilities} equity={o.equity} />;
      }
      if (part.type === 'tool-showPropertyPortfolio') return <PropertyPortfolio key={callId} properties={(part.output as PropertyPortfolioOutput).properties} />;
      if (part.type === 'tool-showZillowProperty') {
        const o = part.output as ZillowPropertyOutput;
        return <ZillowProperty key={callId} property={o.property} zillowUrl={o.zillowUrl} error={o.error} />;
      }
      if (part.type === 'tool-generateImage') {
        if (part.output.imageUrl) {
          return (
            <div key={callId} className="py-2 flex flex-col items-start gap-2">
              <p className="text-xs text-white/40 font-mono">{part.output.prompt}</p>
              <ImageWithLoader src={part.output.imageUrl} alt={part.output.prompt} />
              <span className="text-[10px] text-white/30 font-mono">Generated by Stable Horde · Community AI</span>
            </div>
          );
        }
        if (part.output.error && !part.output.imageUrl) {
          const errLower = part.output.error.toLowerCase();
          if (errLower.includes("rate limit") || errLower.includes("429") || errLower.includes("quota")) return null;
          return <div key={callId} className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20">{part.output.error}</div>;
        }
        return null;
      }
      return null;
    });
  };

  const hasValidImage = messages.some(
    m => m.role === "assistant" && m.parts.some(part => part.type === "tool-generateImage" && part.output && (part.output as any).imageUrl)
  );

  const isLoading = status === 'streaming';
  const currentPlaceholder = modes.find(m => m.id === mode)?.placeholder ?? 'Ask anything...';
  const suggestions = suggestionsByMode[mode];

  const ModeSelector = ({ compact = false }: { compact?: boolean }) => (
    <div className={`flex items-center gap-1 ${compact ? '' : 'justify-center'}`}>
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setMode(m.id)}
          className={`flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all duration-200 ${
            compact ? 'px-2 py-1.5 sm:px-3' : 'px-3 py-1.5'
          } ${mode === m.id ? modeColors[m.id] : modeInactiveColors[m.id]}`}
        >
          {m.icon}
          <span className={compact ? 'hidden sm:inline' : ''}>{m.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-[#0a0a0a] text-white flex flex-col" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* ── HEADER (only during chat) ── */}
      {messages.length > 0 && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 min-w-0">
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 group shrink-0">
              <span className="text-lg font-semibold tracking-tight bg-gradient-to-r from-white/60 via-white to-white/60 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]">
                Sweep
              </span>
            </button>

            <div className="flex items-center gap-2 min-w-0 overflow-hidden">
              <ModeSelector compact />
              {hasDashboardItems && (
                <button
                  onClick={() => setShowSidebar(v => !v)}
                  className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors px-2 sm:px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] shrink-0"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{showSidebar ? 'Hide' : 'Show'} dashboard</span>
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${showSidebar ? 'md:mr-[42%]' : ''} ${messages.length > 0 ? 'pt-14' : ''}`}>
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-36">

          {/* ── HERO (no messages) ── */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-8 py-20" style={{ minHeight: 'calc(100dvh - 80px)' }}>
              {/* Logo */}
              <div className="text-center space-y-3">
                <h1 className="text-6xl sm:text-7xl font-semibold tracking-tight">
                  <span className="bg-gradient-to-r from-white/50 via-white to-white/50 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]">
                    Sweep
                  </span>
                </h1>
                <p className="text-white/40 text-sm sm:text-base font-light tracking-wide">
                  AI for finance, data & real estate
                </p>
              </div>

              {/* Mode Selector */}
              <ModeSelector />

              {/* Input */}
              <form onSubmit={handleSubmit} className="w-full max-w-lg">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-white/[0.04] text-white rounded-2xl pl-5 pr-14 py-4 border border-white/[0.10] focus:border-white/25 focus:bg-white/[0.06] focus:outline-none placeholder-white/25 text-sm transition-all duration-200"
                    style={{ fontSize: '16px' }}
                    placeholder={currentPlaceholder}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="absolute right-3 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 group"
                  >
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </form>

              {/* Suggestion chips */}
              <div className="w-full max-w-lg">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(s.label)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/[0.16] text-white/50 hover:text-white/80 text-sm text-left transition-all duration-200 group"
                    >
                      <span className="text-base shrink-0">{s.icon}</span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── MESSAGES ── */
            <div className="pt-8 pb-4 space-y-1">
              {messages.map((m, idx) => (
                <div key={m.id + '-' + idx}>
                  {/* User message */}
                  {m.role === 'user' && (
                    <div className="py-5 flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[75%] bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tr-sm px-4 py-3">
                        <p className="text-white text-sm leading-relaxed">
                          {m.parts.filter(p => p.type === 'text').map((part, i) => (
                            <span key={i}>{cleanText((part as any).text)}</span>
                          ))}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Assistant message */}
                  {m.role === 'assistant' && (
                    <div className="py-5">
                      {/* Sweep avatar dot */}
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          <div className={`w-2 h-2 rounded-full bg-white/60 ${isLoading && idx === messages.length - 1 ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-4">
                          {/* Thinking dots — shown inline before any text arrives */}
                          {isLoading && idx === messages.length - 1 && !m.parts.some(p => p.type === 'text') && loadingSteps.length === 0 && (
                            <div className="flex gap-1 pt-1">
                              {[0, 150, 300].map((delay, i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                              ))}
                            </div>
                          )}
                          {/* Tool loading steps — shown inline */}
                          {isLoading && idx === messages.length - 1 && loadingSteps.length > 0 && (
                            <div className="space-y-2.5">
                              {loadingSteps.map((step, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                  {step.status === 'complete' ? (
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                      <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  ) : step.status === 'loading' ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-white/15 border-t-white/60 animate-spin shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full bg-white/[0.06] border border-white/10 shrink-0" />
                                  )}
                                  <span className={`text-xs transition-colors ${
                                    step.status === 'complete' ? 'text-emerald-400' :
                                    step.status === 'loading' ? 'text-white/70' :
                                    'text-white/25'
                                  }`}>{step.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Text parts */}
                          {m.parts.filter(p => p.type === 'text').map((part, i) => (
                            <p key={i} className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
                              {cleanText((part as any).text)}
                            </p>
                          ))}

                          {/* Zillow listings inline */}
                          {m.parts.map((part: any) => {
                            if (!('state' in part) || !('toolCallId' in part)) return null;
                            if (part.type === 'tool-searchZillowListings' && part.state === 'output-available') {
                              const output = part.output as ZillowListingsOutput;
                              return (
                                <div key={part.toolCallId} className="mt-2">
                                  <ZillowListings
                                    properties={output.properties || []}
                                    totalResults={output.totalResults || 0}
                                    searchCriteria={output.searchCriteria}
                                    error={output.error}
                                    onPropertySelectAction={(url) => sendMessage({ text: `show zillow property ${url}` }, { body: { mode } })}
                                  />
                                </div>
                              );
                            }
                            return null;
                          })}

                          {/* Dashboard items (mobile only — desktop goes to sidebar) */}
                          <div className="md:hidden space-y-4">
                            {renderDashboardItems(m)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Divider between messages */}
                  {idx < messages.length - 1 && (
                    <div className="border-b border-white/[0.04]" />
                  )}
                </div>
              ))}


              {/* Error block */}
              {error && !hasValidImage && (
                <div className="mt-4 p-4 bg-red-500/[0.08] border border-red-500/20 rounded-xl">
                  <p className="text-red-400 text-sm">
                    {error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('429')
                      ? 'Rate limit reached — please wait a moment and try again.'
                      : 'Something went wrong. Please try again.'}
                  </p>
                  <button onClick={() => window.location.reload()} className="mt-2 text-xs text-white/40 hover:text-white/70 underline underline-offset-2 transition-colors">
                    Refresh page
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ── FIXED BOTTOM INPUT (chat mode) ── */}
        {messages.length > 0 && (
          <div
            className="fixed bottom-0 left-0 z-30 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pt-8 pb-safe"
            style={{ right: showSidebar ? '42%' : '0', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
          >
            <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-2">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-white/[0.05] text-white rounded-2xl pl-5 pr-14 py-3.5 border border-white/[0.10] focus:border-white/25 focus:bg-white/[0.07] focus:outline-none placeholder-white/25 text-sm transition-all duration-200 disabled:opacity-50"
                  style={{ fontSize: '16px' }}
                  placeholder={currentPlaceholder}
                  disabled={isLoading}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 group"
                >
                  <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </form>
              <p className="text-center text-[11px] text-white/20">
                Sweep can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── RIGHT SIDEBAR (desktop dashboard) ── */}
      <aside className={`hidden md:flex flex-col fixed top-0 right-0 h-full w-[42%] bg-[#0d0d0d] border-l border-white/[0.06] z-50 transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-white/40" />
            <span className="text-sm font-medium text-white/70">Dashboard</span>
          </div>
          <button
            onClick={() => setShowSidebar(false)}
            className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {(() => {
            const lastWithDashboard = [...messages].reverse().find(m =>
              m.role === 'assistant' &&
              m.parts.some(part => toolTypes.includes(part.type) && 'state' in part && part.state === 'output-available')
            );
            return lastWithDashboard ? renderDashboardItems(lastWithDashboard) : null;
          })()}
        </div>
      </aside>

      {/* Credit */}
      <div className="fixed bottom-2 right-4 text-[10px] text-white/15 pointer-events-none select-none z-50 font-light tracking-wide" style={{ right: showSidebar ? 'calc(42% + 12px)' : '16px' }}>
        by Sushant Kataria
      </div>
    </div>
  );
}

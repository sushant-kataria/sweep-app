'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef } from 'react';
import { Send, BarChart2, X, Search, MessageSquare, Code2, Copy, Check, Wand2, Download, Sun, Moon } from 'lucide-react';

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

type Mode = 'chat' | 'search' | 'code' | 'image';

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
  {
    id: 'image',
    label: 'Image',
    icon: <Wand2 className="w-3.5 h-3.5" />,
    placeholder: 'Describe an image to generate...',
  },
];

async function downloadImage(src: string) {
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sweep-image-${Date.now()}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    window.open(src, '_blank');
  }
}

function ImageWithLoader({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (loaded || errored) return;
    const t = setTimeout(() => setErrored(true), 60000);
    return () => clearTimeout(t);
  }, [loaded, errored]);

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="relative w-full max-w-sm rounded-lg overflow-hidden border border-[var(--v-border)] bg-[var(--v-surface)]" style={{ aspectRatio: '1' }}>
        {!loaded && !errored && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-[var(--v-border)] border-t-[var(--v-fg-3)] animate-spin" />
            <span className="text-[10px] text-[var(--v-fg-5)] font-mono">generating image...</span>
          </div>
        )}
        {errored && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-xs text-[var(--v-fg-4)]">Failed to load image</span>
            <a href={src} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--v-fg-5)] underline">try direct link</a>
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
      {loaded && (
        <button
          onClick={() => downloadImage(src)}
          className="flex items-center gap-1.5 text-xs text-[var(--v-fg-4)] hover:text-[var(--v-fg-3)] transition-colors"
        >
          <Download className="w-3 h-3" />
          <span>Download</span>
        </button>
      )}
    </div>
  );
}

const THINKING_WORDS = [
  'Analyzing...', 'Thinking...', 'Interpreting...', 'Researching...',
  'Processing...', 'Understanding...', 'Reasoning...', 'Computing...',
];

function ThinkingAnimation() {
  const [wordIdx, setWordIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIdx(i => (i + 1) % THINKING_WORDS.length);
        setFade(true);
      }, 300);
    }, 1600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 150, 300].map((d, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-[var(--v-border-2)] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
      <span
        className="text-xs text-[var(--v-fg-4)] font-mono transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {THINKING_WORDS[wordIdx]}
      </span>
    </div>
  );
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className={`flex items-center gap-1.5 text-xs text-[var(--v-fg-4)] hover:text-[var(--v-fg-3)] transition-colors ${className}`}>
      {copied ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[var(--v-border)] my-3 text-left">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--v-code-hdr)] border-b border-[var(--v-border)]">
        <span className="text-xs text-violet-600 dark:text-violet-300/70 font-mono">{lang || 'code'}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto bg-[var(--v-code-bg)] text-sm font-mono leading-relaxed">
        <code className="text-emerald-800 dark:text-emerald-300/90 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function renderContent(raw: string | undefined | null) {
  if (!raw) return null;
  // Strip bold/italic/headings then split on fenced code blocks
  const text = raw.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/^#{1,6}\s+/gm, '');
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    const m = part.match(/^```(\w*)\n?([\s\S]*?)```$/);
    if (m) return <CodeBlock key={i} lang={m[1]} code={m[2].replace(/\n$/, '')} />;
    if (!part) return null;
    // Inline code
    const inlineParts = part.split(/(`[^`]+`)/g);
    return (
      <span key={i} className="whitespace-pre-wrap">
        {inlineParts.map((s, j) =>
          s.startsWith('`') && s.endsWith('`')
            ? <code key={j} className="px-1.5 py-0.5 rounded bg-[var(--v-code-hdr)] text-violet-600 dark:text-violet-300/80 font-mono text-[0.8em] border border-[var(--v-border)]">{s.slice(1, -1)}</code>
            : s
        )}
      </span>
    );
  });
}

// Render text that may contain <function(toolName){...json...}</function> patterns
// This handles cases where Llama outputs tool calls as text instead of proper tool calls
function renderTextWithInlineTools(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /<function\((\w+)\)([\s\S]*?)<\/function>/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) nodes.push(<div key={key++}>{renderContent(before)}</div>);
    }
    try {
      const toolName = match[1];
      const args = JSON.parse(match[2]);
      if ((toolName === 'showBarChart' || toolName === 'showLineChart' || toolName === 'showPieChart' || toolName === 'showAreaChart') && args.items) {
        const chartData = args.items.map((it: any) => ({ label: it.label, value: it.value }));
        if (toolName === 'showBarChart') nodes.push(<BarChartPro key={key++} title={args.title} data={chartData} unit={args.unit} />);
        else if (toolName === 'showLineChart') nodes.push(<LineChartPro key={key++} title={args.title} data={chartData} unit={args.unit} />);
        else if (toolName === 'showPieChart') nodes.push(<PieChartPro key={key++} title={args.title} data={chartData} unit={args.unit} />);
        else if (toolName === 'showAreaChart') nodes.push(<AreaChartPro key={key++} title={args.title} data={chartData} unit={args.unit} />);
      } else if (toolName === 'showStats' && args.stats) {
        nodes.push(<StatsCard key={key++} title={args.title} stats={args.stats} />);
      } else if (toolName === 'showComparison' && args.items) {
        nodes.push(<ComparisonTable key={key++} title={args.title} items={args.items} />);
      } else if (toolName === 'generateImage' && args.prompt) {
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(args.prompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;
        nodes.push(
          <div key={key++} className="py-2 flex flex-col items-start gap-2">
            <p className="text-xs text-[var(--v-fg-4)] font-mono">{args.prompt}</p>
            <ImageWithLoader src={url} alt={args.prompt} />
            <span className="text-[10px] text-[var(--v-fg-5)] font-mono">Generated by Pollinations AI · FLUX</span>
          </div>
        );
      }
    } catch { /* skip malformed function call */ }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining) nodes.push(<div key={key++}>{renderContent(remaining)}</div>);
  }

  return nodes;
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
  image: [
    { label: 'Futuristic city at night with neon lights', icon: '🌃' },
    { label: 'Cyberpunk portrait of a samurai', icon: '⚔️' },
    { label: 'Cozy cabin in snowy mountains', icon: '🏔️' },
    { label: 'Abstract art in vibrant colors', icon: '🎨' },
    { label: 'Golden retriever puppy playing in a park', icon: '🐶' },
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
  chat: 'dark:text-[#ededed] text-black dark:border-[#3a3a3a] border-black/20 dark:bg-white/[0.06] bg-black/[0.06]',
  search: 'dark:text-sky-400 text-sky-600 dark:border-sky-500/30 border-sky-400/40 dark:bg-sky-500/[0.08] bg-sky-50',
  code: 'dark:text-emerald-400 text-emerald-600 dark:border-emerald-500/30 border-emerald-400/40 dark:bg-emerald-500/[0.08] bg-emerald-50',
  image: 'dark:text-violet-400 text-violet-600 dark:border-violet-500/30 border-violet-400/40 dark:bg-violet-500/[0.08] bg-violet-50',
};

const modeInactiveColors: Record<Mode, string> = {
  chat: 'dark:text-[#555] text-[#999] dark:border-[#262626] border-[#eaeaea] bg-transparent hover:dark:text-[#737373] hover:text-neutral-600 hover:dark:border-[#3a3a3a] hover:border-neutral-300',
  search: 'dark:text-[#555] text-[#999] dark:border-[#262626] border-[#eaeaea] bg-transparent hover:dark:text-sky-300/70 hover:text-sky-600 hover:dark:border-sky-400/25 hover:border-sky-400/35',
  code: 'dark:text-[#555] text-[#999] dark:border-[#262626] border-[#eaeaea] bg-transparent hover:dark:text-emerald-300/70 hover:text-emerald-600 hover:dark:border-emerald-400/25 hover:border-emerald-400/35',
  image: 'dark:text-[#555] text-[#999] dark:border-[#262626] border-[#eaeaea] bg-transparent hover:dark:text-violet-300/70 hover:text-violet-600 hover:dark:border-violet-400/25 hover:border-violet-400/35',
};

function ThemeToggleButton({ theme, onToggle }: { theme: 'dark' | 'light'; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] hover:bg-[var(--v-btn-bg)] text-[var(--v-fg)] transition-colors shrink-0"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" strokeWidth={1.5} /> : <Moon className="w-4 h-4" strokeWidth={1.5} />}
    </button>
  );
}

export default function Chat() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('chat');
  const [showSidebar, setShowSidebar] = useState(false);
  const [hasDashboardItems, setHasDashboardItems] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem('sweep-theme') as 'dark' | 'light' | null;
    if (saved === 'light' || saved === 'dark') setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('sweep-theme', theme);
  }, [theme]);

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

  // Track whether user is near the bottom
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const threshold = 120;
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Only auto-scroll when user is near the bottom
  useEffect(() => {
    if (isNearBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setShowSidebar(false);
    isNearBottomRef.current = true; // force scroll on new message
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
        // Images are rendered inline in the chat — skip here to avoid duplicates
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

  const toggleTheme = () => setTheme(te => (te === 'dark' ? 'light' : 'dark'));

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
    <div className="bg-[var(--v-bg)] text-[var(--v-fg)] flex flex-col" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>
      {/* ── HEADER (only during chat) ── */}
      {messages.length > 0 && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[var(--v-bg)]/90 backdrop-blur-xl border-b border-[var(--v-border)]">
          <div
            className={`max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2 min-w-0 transition-[padding] duration-300 ${
              showSidebar ? 'md:pr-[42%]' : ''
            }`}
          >
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 group shrink-0">
              <span className="text-lg font-semibold tracking-tight bg-gradient-to-r dark:from-white/60 dark:via-white dark:to-white/60 from-gray-700 via-black to-gray-700 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]">
                Sweep
              </span>
            </button>

            <div className="flex items-center justify-end gap-2 min-w-0 flex-1 md:flex-initial md:ml-4 overflow-hidden">
              <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
              <ModeSelector compact />
              {hasDashboardItems && (
                <button
                  onClick={() => setShowSidebar(v => !v)}
                  className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--v-fg-3)] hover:text-[var(--v-fg)] transition-colors px-3 py-1.5 rounded-lg border border-[var(--v-border)] hover:border-[var(--v-border-2)] bg-[var(--v-surface)] hover:bg-[var(--v-btn-bg)] shrink-0"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  {showSidebar ? 'Hide' : 'Show'} dashboard
                </button>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ── MAIN CONTENT ── */}
      <main ref={mainRef} className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${showSidebar ? 'md:mr-[42%]' : ''} ${messages.length > 0 ? 'pt-14' : ''}`}>
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-36">

          {/* ── HERO (no messages) ── */}
          {messages.length === 0 ? (
            <div className="relative flex flex-col items-center justify-center gap-8 py-20" style={{ minHeight: 'calc(100dvh - 80px)' }}>
              <div className="absolute top-0 right-0 sm:right-2">
                <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
              </div>
              {/* Logo */}
              <div className="text-center space-y-3">
                <h1 className="text-6xl sm:text-7xl font-semibold tracking-tight">
                  <span className="bg-gradient-to-r dark:from-white/50 dark:via-white dark:to-white/50 from-gray-700 via-black to-gray-700 bg-clip-text text-transparent animate-gradient bg-[length:200%_100%]">
                    Sweep
                  </span>
                </h1>
                <p className="text-[var(--v-fg-4)] text-sm sm:text-base font-light tracking-wide">
                  AI for finance, data & real estate
                </p>
              </div>

              {/* Mode Selector */}
              <ModeSelector />

              {/* Input */}
              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-[var(--v-input-bg)] text-[var(--v-fg)] rounded-lg pl-5 pr-14 py-4 border border-[var(--v-input-border)] shadow-sm dark:shadow-none focus:border-[var(--v-border-2)] focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 focus:outline-none placeholder:text-[var(--v-fg-5)] text-sm transition-all duration-200"
                    style={{ fontSize: '16px' }}
                    placeholder={currentPlaceholder}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="absolute right-3 w-8 h-8 rounded-lg border border-[var(--v-input-border)] bg-[var(--v-btn-bg)] hover:bg-[var(--v-btn-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 group text-[var(--v-fg)] shadow-sm dark:shadow-none dark:border-transparent"
                  >
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </form>

              {/* Suggestion chips */}
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestion(s.label)}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] hover:bg-[var(--v-btn-bg)] hover:border-[var(--v-border-2)] text-[var(--v-fg-3)] hover:text-[var(--v-fg)] text-sm text-left transition-all duration-200 group"
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
                      <div className="max-w-[85%] sm:max-w-[75%] bg-[var(--v-surface)] border border-[var(--v-border)] rounded-lg rounded-tr-sm px-4 py-3">
                        <p className="text-[var(--v-fg)] text-sm leading-relaxed">
                          {m.parts.filter(p => p.type === 'text').map((part, i) => (
                            <span key={i}>{(part as any).text}</span>
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
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--v-border-2)] to-[var(--v-surface)] border border-[var(--v-border)] flex items-center justify-center shrink-0 mt-0.5">
                          <div className={`w-2 h-2 rounded-full bg-[var(--v-fg-3)] dark:bg-white/60 ${isLoading && idx === messages.length - 1 ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-4">
                          {/* Thinking animation — shown before any text arrives */}
                          {isLoading && idx === messages.length - 1 && !m.parts.some(p => p.type === 'text') && loadingSteps.length === 0 && (
                            <ThinkingAnimation />
                          )}
                          {/* Tool loading steps — shown inline */}
                          {isLoading && idx === messages.length - 1 && loadingSteps.length > 0 && (
                            <div className="space-y-2.5">
                              {loadingSteps.map((step, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                  {step.status === 'complete' ? (
                                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                      <svg className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  ) : step.status === 'loading' ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-[var(--v-border)] border-t-[var(--v-fg-3)] animate-spin shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full bg-[var(--v-surface)] border border-[var(--v-border)] shrink-0" />
                                  )}
                                  <span className={`text-xs transition-colors ${
                                    step.status === 'complete' ? 'text-emerald-600 dark:text-emerald-400' :
                                    step.status === 'loading' ? 'text-[var(--v-fg-3)]' :
                                    'text-[var(--v-fg-5)]'
                                  }`}>{step.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Text parts — with inline tool call fallback parser */}
                          {m.parts.filter(p => p.type === 'text').map((part, i) => {
                            const text = (part as any).text as string;
                            const hasInlineTool = /<function\(\w+\)/.test(text);
                            if (hasInlineTool) {
                              return (
                                <div key={i} className="space-y-4">
                                  {renderTextWithInlineTools(text)}
                                </div>
                              );
                            }
                            return (
                              <div key={i} className="text-[var(--v-fg)]/90 text-sm leading-relaxed">
                                {renderContent(text)}
                              </div>
                            );
                          })}
                          {/* Copy message button — only on completed messages */}
                          {!(isLoading && idx === messages.length - 1) && m.parts.some(p => p.type === 'text') && (
                            <CopyButton
                              text={m.parts.filter(p => p.type === 'text').map(p => (p as any).text).join('')}
                              className="mt-1"
                            />
                          )}

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

                          {/* Images always inline; other dashboard items mobile only (desktop → sidebar) */}
                          {m.parts.some((p: any) => p.type === 'tool-generateImage' && p.state === 'output-available') && (
                            <div className="space-y-4">
                              {m.parts.filter((p: any) => p.type === 'tool-generateImage').map((part: any) => {
                                if (!part.output?.imageUrl) return null;
                                return (
                                  <div key={part.toolCallId} className="py-2 flex flex-col items-start gap-2">
                                    <p className="text-xs text-[var(--v-fg-4)] font-mono">{part.output.prompt}</p>
                                    <ImageWithLoader src={part.output.imageUrl} alt={part.output.prompt} />
                                    <span className="text-[10px] text-[var(--v-fg-5)] font-mono">Generated by Pollinations AI · FLUX</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* Charts on mobile */}
                          <div className="md:hidden space-y-4">
                            {renderDashboardItems(m)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Divider between messages */}
                  {idx < messages.length - 1 && (
                    <div className="border-b border-[var(--v-border)]" />
                  )}
                </div>
              ))}


              {/* Error block */}
              {error && !hasValidImage && (
                <div className="mt-4 p-4 bg-red-500/[0.08] border border-red-500/20 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">
                    {error.message?.includes('tokens per day') || error.message?.includes('TPD')
                      ? 'Daily token limit reached — the free AI quota resets in a few hours. Try again later.'
                      : error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('429')
                      ? 'Rate limit reached — please wait a moment and try again.'
                      : 'Something went wrong. Please try again.'}
                  </p>
                  <button onClick={() => window.location.reload()} className="mt-2 text-xs text-[var(--v-fg-4)] hover:text-[var(--v-fg-3)] underline underline-offset-2 transition-colors">
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
            className={`fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[var(--v-bg)] via-[var(--v-bg)]/95 to-transparent dark:from-black dark:via-black/95 pt-8 ${showSidebar ? 'md:right-[42%]' : ''}`}
            style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
          >
            <div className="w-full px-3 sm:px-4 space-y-2">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-[var(--v-input-bg)] text-[var(--v-fg)] rounded-lg pl-5 pr-14 py-3.5 border border-[var(--v-input-border)] shadow-sm dark:shadow-none focus:border-[var(--v-border-2)] focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10 focus:outline-none placeholder:text-[var(--v-fg-5)] text-sm transition-all duration-200 disabled:opacity-50"
                  style={{ fontSize: '16px' }}
                  placeholder={currentPlaceholder}
                  disabled={isLoading}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-3 w-8 h-8 rounded-lg border border-[var(--v-input-border)] bg-[var(--v-btn-bg)] hover:bg-[var(--v-btn-bg-hover)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 group text-[var(--v-fg)] shadow-sm dark:shadow-none dark:border-transparent"
                >
                  <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </form>
              <p className="text-center text-[11px] text-[var(--v-fg-5)]">
                Sweep can make mistakes. Verify important information.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ── RIGHT SIDEBAR (desktop dashboard) ── */}
      <aside className={`hidden md:flex flex-col fixed top-0 right-0 h-full w-[42%] bg-[var(--v-bg-2)] border-l border-[var(--v-border)] z-50 transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--v-border)] shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[var(--v-fg-4)]" />
            <span className="text-sm font-medium text-[var(--v-fg-3)]">Dashboard</span>
          </div>
          <button
            onClick={() => setShowSidebar(false)}
            className="w-7 h-7 rounded-lg hover:bg-[var(--v-btn-bg)] flex items-center justify-center text-[var(--v-fg-4)] hover:text-[var(--v-fg-3)] transition-colors"
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
      <div className={`fixed bottom-2 right-4 text-[10px] text-[var(--v-fg-5)] pointer-events-none select-none z-50 font-light tracking-wide ${showSidebar ? 'md:right-[calc(42%+12px)]' : ''}`}>
        by Sushant Kataria
      </div>
    </div>
  );
}

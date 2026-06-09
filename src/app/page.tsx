'use client';

import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, BarChart2, X, Search, MessageSquare, Code2, Copy, Check, Sun, Moon, Mic, MicOff, FileDown, Menu, Plus, Trash2 } from 'lucide-react';

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

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = 'chat' | 'search' | 'code';

type StoredConv = {
  id: string;
  title: string;
  mode: Mode;
  messages: any[];
  createdAt: number;
  updatedAt: number;
};

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

// ─── Constants ───────────────────────────────────────────────────────────────

const CONV_KEY = 'sweep_conversations';
const THEME_KEY = 'sweep-theme';

const modes: { id: Mode; label: string; icon: React.ReactNode; placeholder: string }[] = [
  { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-3.5 h-3.5" />, placeholder: 'Ask anything...' },
  { id: 'search', label: 'Search', icon: <Search className="w-3.5 h-3.5" />, placeholder: 'Search for information...' },
  { id: 'code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5" />, placeholder: 'Ask a coding question...' },
];

const suggestionsByMode: Record<Mode, Array<{ label: string }>> = {
  chat: [
    { label: 'Apple stock chart' },
    { label: 'Homes for sale in LA below $900k' },
    { label: 'Walmart balance sheet' },
    { label: 'Top US companies by market cap' },
  ],
  search: [
    { label: 'How does NVIDIA Nemotron work?' },
    { label: 'Latest developments in fusion energy' },
    { label: 'India vs China GDP comparison' },
    { label: 'SpaceX Starship program overview' },
  ],
  code: [
    { label: 'Build a REST API with FastAPI' },
    { label: 'React custom hook for debounce' },
    { label: 'Implement binary search in TypeScript' },
    { label: 'Docker compose for Next.js + Postgres' },
  ],
};

const toolTypes = [
  'tool-showBarChart', 'tool-showLineChart', 'tool-showPieChart', 'tool-showAreaChart',
  'tool-showComparison', 'tool-showStats', 'tool-showBalanceSheet',
  'tool-showPropertyPortfolio', 'tool-showZillowProperty',
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
};

const THINKING_WORDS = ['Analyzing...', 'Thinking...', 'Interpreting...', 'Researching...', 'Processing...', 'Reasoning...'];

// ─── Storage ──────────────────────────────────────────────────────────────────

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function loadConvs(): StoredConv[] {
  try { return JSON.parse(localStorage.getItem(CONV_KEY) || '[]'); } catch { return []; }
}

function saveConvs(convs: StoredConv[]) {
  try { localStorage.setItem(CONV_KEY, JSON.stringify(convs.slice(0, 50))); } catch {}
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useVoiceInput(onTranscript: (t: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef<any>(null);

  const toggle = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.onresult = (e: any) => { onTranscript(e.results[0][0].transcript); };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [isListening, onTranscript]);

  return { isListening, toggle };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function exportChat(messages: any[], title: string) {
  const lines: string[] = [`# ${title}`, '', `Exported ${new Date().toLocaleDateString()}`, '---', ''];
  for (const msg of messages) {
    const role = msg.role === 'user' ? 'You' : 'Sweep';
    lines.push(`**${role}**`);
    for (const part of (msg.parts || [])) {
      if (part.type === 'text') lines.push(part.text);
    }
    lines.push('');
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sweep-${title.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*')) return <em key={i}>{p.slice(1, -1)}</em>;
    if (p.startsWith('`') && p.endsWith('`')) return (
      <code key={i} className="px-1 py-0.5 rounded bg-[var(--v-code-hdr)] font-mono text-[0.85em] border border-[var(--v-border)]">
        {p.slice(1, -1)}
      </code>
    );
    return p;
  });
}

function renderContent(raw: string | undefined | null): React.ReactNode {
  if (!raw) return null;
  const segments = raw.split(/(```[\s\S]*?```)/g);
  return segments.map((seg, i) => {
    const m = seg.match(/^```(\w*)\n?([\s\S]*?)```$/);
    if (m) return <CodeBlock key={i} lang={m[1]} code={m[2].replace(/\n$/, '')} />;
    if (!seg) return null;
    const lines = seg.split('\n');
    return (
      <span key={i} className="block">
        {lines.map((line, li) => {
          const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
          if (headingMatch) {
            const sizes = ['text-base font-bold mt-3', 'text-sm font-bold mt-2', 'text-sm font-semibold mt-2', 'text-sm font-medium mt-1', 'text-sm font-medium', 'text-sm font-medium'];
            return <div key={li} className={sizes[headingMatch[1].length - 1]}>{renderInline(headingMatch[2])}</div>;
          }
          if (line.match(/^[-*+]\s+/)) {
            return <div key={li} className="flex gap-2 my-0.5"><span className="shrink-0 text-[var(--v-fg-3)]">·</span><span>{renderInline(line.replace(/^[-*+]\s+/, ''))}</span></div>;
          }
          const numM = line.match(/^(\d+)\.\s+(.+)/);
          if (numM) {
            return <div key={li} className="flex gap-2 my-0.5"><span className="shrink-0 text-[var(--v-fg-3)]">{numM[1]}.</span><span>{renderInline(numM[2])}</span></div>;
          }
          if (!line.trim()) return <div key={li} className="h-2" />;
          return <div key={li}>{renderInline(line)}</div>;
        })}
      </span>
    );
  });
}

function renderTextWithInlineTools(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /<function[@(](\w+)[)>]([\s\S]*?)<\/function>/g;
  let lastIndex = 0; let match; let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) nodes.push(<div key={key++}>{renderContent(before)}</div>);
    }
    try {
      const toolName = match[1];
      const args = JSON.parse(match[2]);
      if (['showBarChart','showLineChart','showPieChart','showAreaChart'].includes(toolName) && args.items) {
        const chartData = args.items.map((it: any) => ({ label: it.label, value: it.value }));
        if (toolName === 'showBarChart') nodes.push(<BarChartPro key={key++} title={args.title} data={chartData} unit={args.unit} />);
        else if (toolName === 'showLineChart') nodes.push(<LineChartPro key={key++} title={args.title} data={chartData} unit={args.unit} />);
        else if (toolName === 'showPieChart') nodes.push(<PieChartPro key={key++} title={args.title} data={chartData} unit={args.unit} />);
        else if (toolName === 'showAreaChart') nodes.push(<AreaChartPro key={key++} title={args.title} data={chartData} unit={args.unit} />);
      } else if (toolName === 'showStats' && args.stats) {
        nodes.push(<StatsCard key={key++} title={args.title} stats={args.stats} />);
      } else if (toolName === 'showComparison' && args.items) {
        nodes.push(<ComparisonTable key={key++} title={args.title} items={args.items} />);
      } else if (toolName === 'showBalanceSheet' && args.assets) {
        nodes.push(<BalanceSheet key={key++} title={args.title} period={args.period} currency={args.currency} assets={args.assets} liabilities={args.liabilities} equity={args.equity} />);
      } else if (toolName === 'showPropertyPortfolio' && args.properties) {
        nodes.push(<PropertyPortfolio key={key++} properties={args.properties} />);
      }
    } catch {}
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex).trim();
    if (remaining) nodes.push(<div key={key++}>{renderContent(remaining)}</div>);
  }
  return nodes;
}

// ─── Small components ─────────────────────────────────────────────────────────

function ThinkingAnimation() {
  const [wordIdx, setWordIdx] = useState(0);
  const [fade, setFade] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => {
      setFade(false);
      setTimeout(() => { setWordIdx(i => (i + 1) % THINKING_WORDS.length); setFade(true); }, 300);
    }, 1600);
    return () => clearInterval(iv);
  }, []);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 150, 300].map((d, i) => (
          <div key={i} className="w-1.5 h-1.5 bg-[var(--v-fg-4)] rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
        ))}
      </div>
      <span className="text-xs text-[var(--v-fg-3)] font-mono transition-opacity duration-300" style={{ opacity: fade ? 1 : 0 }}>
        {THINKING_WORDS[wordIdx]}
      </span>
    </div>
  );
}

function CopyButton({ text, className = '' }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 text-xs text-[var(--v-fg-4)] hover:text-[var(--v-fg-3)] transition-colors ${className}`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[var(--v-border)] my-3 text-left">
      <div className="flex items-center justify-between px-4 py-2 bg-[var(--v-code-hdr)] border-b border-[var(--v-border)]">
        <span className="text-xs text-[var(--v-fg-3)] font-mono">{lang || 'code'}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto bg-[var(--v-code-bg)] text-sm font-mono leading-relaxed">
        <code className="text-[var(--v-fg)] whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

function ModeSelector({ mode, setMode, compact = false }: { mode: Mode; setMode: (m: Mode) => void; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-1 ${compact ? '' : 'justify-center'}`}>
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setMode(m.id)}
          className={`flex items-center gap-1.5 rounded-lg border text-xs font-medium transition-all duration-150 px-2.5 py-1.5 ${
            mode === m.id
              ? 'bg-[var(--v-fg)] text-[var(--v-bg)] border-[var(--v-fg)]'
              : 'text-[var(--v-fg-3)] border-[var(--v-border)] bg-transparent hover:text-[var(--v-fg)] hover:border-[var(--v-fg-3)]'
          }`}
        >
          {m.icon}
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Conversation Sidebar ─────────────────────────────────────────────────────

function ConvSidebar({
  convs, currentId, onSelect, onNew, onDelete, onClose,
}: {
  convs: StoredConv[]; currentId: string;
  onSelect: (id: string) => void; onNew: () => void;
  onDelete: (id: string) => void; onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-[var(--v-fg)]/10 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-[var(--v-bg)] border-r border-[var(--v-border)] flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--v-border)] shrink-0">
          <span className="text-sm font-semibold text-[var(--v-fg)]">Conversations</span>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--v-fg-3)] hover:text-[var(--v-fg)] hover:bg-[var(--v-surface)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pt-3 shrink-0">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] hover:bg-[var(--v-border)] text-[var(--v-fg)] text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 text-[var(--v-fg-3)]" />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {convs.length === 0 && (
            <p className="text-xs text-[var(--v-fg-4)] text-center py-8">No conversations yet</p>
          )}
          {convs.map((c) => (
            <div key={c.id} className={`group relative flex items-center rounded-lg transition-colors ${c.id === currentId ? 'bg-[var(--v-surface)] border border-[var(--v-border)]' : 'hover:bg-[var(--v-surface)]'}`}>
              <button
                onClick={() => { onSelect(c.id); onClose(); }}
                className="flex-1 text-left px-3 py-2.5 min-w-0"
              >
                <p className="text-sm text-[var(--v-fg)] truncate">{c.title}</p>
                <p className="text-[11px] text-[var(--v-fg-4)] mt-0.5">
                  {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                className="shrink-0 mr-2 w-6 h-6 rounded flex items-center justify-center text-[var(--v-fg-5)] hover:text-[var(--v-fg-3)] opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Chat (inner, keyed per conversation) ────────────────────────────────────

function Chat({
  convId, initialMessages, initialMode, theme, toggleTheme,
  onUpdateConv, onOpenConvSidebar,
}: {
  convId: string; initialMessages: any[]; initialMode: Mode;
  theme: 'dark' | 'light'; toggleTheme: () => void;
  onUpdateConv: (id: string, messages: any[], title: string, mode: Mode) => void;
  onOpenConvSidebar: () => void;
}) {
  const { messages, sendMessage, status, error } = useChat({ id: convId, initialMessages });
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showDashboard, setShowDashboard] = useState(false);
  const [hasDashboardItems, setHasDashboardItems] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const isNearBottomRef = useRef(true);

  const { isListening, toggle: toggleVoice } = useVoiceInput((text) => setInput(t => t ? `${t} ${text}` : text));

  // Persist messages to parent on change
  useEffect(() => {
    if (messages.length === 0) return;
    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg?.parts?.find((p: any) => p.type === 'text')?.text?.slice(0, 60) ?? 'New chat';
    onUpdateConv(convId, messages, title, mode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    const outputs = messages.flatMap(m =>
      m.parts.filter((p: any) => toolTypes.includes(p.type) && 'state' in p && p.state === 'output-available')
    );
    const has = outputs.length > 0;
    setHasDashboardItems(has);
    if (has) setShowDashboard(true);
    else setShowDashboard(false);
  }, [messages]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isNearBottomRef.current) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setShowDashboard(false);
    isNearBottomRef.current = true;
    sendMessage({ text: input }, { body: { mode } });
    setInput('');
  };

  const handleSuggestion = (label: string) => {
    sendMessage({ text: label }, { body: { mode } });
  };

  const getLoadingSteps = () => {
    if (!messages.length) return [];
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant') return [];
    const steps: Array<{ name: string; status: 'pending' | 'loading' | 'complete' }> = [];
    last.parts.forEach((part: any) => {
      if ('state' in part && part.type.startsWith('tool-')) {
        const name = toolNameMap[part.type] || part.type.replace('tool-show', '');
        const s = part.state === 'output-available' ? 'complete' : part.state === 'input-available' || part.state === 'input-streaming' ? 'loading' : 'pending';
        steps.push({ name, status: s });
      }
    });
    return steps;
  };

  const renderDashboardItems = (message: any) =>
    message.parts.map((part: any) => {
      if (!('state' in part) || !('toolCallId' in part) || part.state !== 'output-available') return null;
      const k = part.toolCallId;
      if (part.type === 'tool-showBarChart') return <BarChartPro key={k} title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />;
      if (part.type === 'tool-showLineChart') return <LineChartPro key={k} title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />;
      if (part.type === 'tool-showPieChart') return <PieChartPro key={k} title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />;
      if (part.type === 'tool-showAreaChart') return <AreaChartPro key={k} title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />;
      if (part.type === 'tool-showComparison') return <ComparisonTable key={k} title={(part.output as ComparisonOutput).title} items={(part.output as ComparisonOutput).items} />;
      if (part.type === 'tool-showStats') return <StatsCard key={k} title={(part.output as StatsOutput).title} stats={(part.output as StatsOutput).stats} />;
      if (part.type === 'tool-showBalanceSheet') {
        const o = part.output as BalanceSheetOutput;
        return <BalanceSheet key={k} title={o.title} period={o.period} currency={o.currency} assets={o.assets} liabilities={o.liabilities} equity={o.equity} />;
      }
      if (part.type === 'tool-showPropertyPortfolio') return <PropertyPortfolio key={k} properties={(part.output as PropertyPortfolioOutput).properties} />;
      if (part.type === 'tool-showZillowProperty') {
        const o = part.output as ZillowPropertyOutput;
        return <ZillowProperty key={k} property={o.property} zillowUrl={o.zillowUrl} error={o.error} />;
      }
      return null;
    });

  const loadingSteps = getLoadingSteps();
  const isLoading = status === 'streaming';
  const placeholder = modes.find(m => m.id === mode)?.placeholder ?? 'Ask anything...';
  const suggestions = suggestionsByMode[mode];
  const convTitle = messages.find(m => m.role === 'user')?.parts?.find((p: any) => p.type === 'text')?.text?.slice(0, 60) ?? 'New chat';

  return (
    <div className="bg-[var(--v-bg)] text-[var(--v-fg)] flex flex-col" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

      {/* ── HEADER ── */}
      {messages.length > 0 && (
        <header className="fixed top-0 left-0 right-0 z-30 bg-[var(--v-bg)]/90 backdrop-blur-xl border-b border-[var(--v-border)]">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">
            <button onClick={onOpenConvSidebar} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--v-fg-3)] hover:text-[var(--v-fg)] hover:bg-[var(--v-surface)] transition-colors shrink-0">
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold tracking-tight text-[var(--v-fg)] flex-1 truncate">Sweep</span>
            <div className="flex items-center gap-1.5">
              {hasDashboardItems && (
                <button onClick={() => setShowDashboard(v => !v)} className="hidden sm:flex items-center gap-1.5 text-xs text-[var(--v-fg-3)] hover:text-[var(--v-fg)] px-3 py-1.5 rounded-lg border border-[var(--v-border)] hover:border-[var(--v-border-2)] bg-[var(--v-surface)] hover:bg-[var(--v-border)] transition-colors shrink-0">
                  <BarChart2 className="w-3.5 h-3.5" />
                  {showDashboard ? 'Hide' : 'Show'} charts
                </button>
              )}
              <button onClick={() => exportChat(messages, convTitle)} className="w-8 h-8 rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] hover:bg-[var(--v-border)] flex items-center justify-center text-[var(--v-fg-3)] hover:text-[var(--v-fg)] transition-colors shrink-0" title="Export chat">
                <FileDown className="w-3.5 h-3.5" />
              </button>
              <button onClick={toggleTheme} className="w-8 h-8 rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] hover:bg-[var(--v-border)] flex items-center justify-center text-[var(--v-fg-3)] hover:text-[var(--v-fg)] transition-colors shrink-0">
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ── MAIN ── */}
      <main ref={mainRef} className={`flex-1 overflow-y-auto transition-all duration-300 ease-in-out ${showDashboard ? 'md:mr-[42%]' : ''} ${messages.length > 0 ? 'pt-14' : ''}`}>
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-36">

          {/* HERO */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-8 py-20" style={{ minHeight: 'calc(100dvh - 80px)' }}>
              <div className="text-center space-y-2 relative w-full">
                <div className="absolute top-0 left-0 flex items-center gap-1">
                  <button onClick={onOpenConvSidebar} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--v-fg-3)] hover:text-[var(--v-fg)] hover:bg-[var(--v-surface)] border border-[var(--v-border)] transition-colors">
                    <Menu className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-0 right-0">
                  <button onClick={toggleTheme} className="w-8 h-8 rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] hover:bg-[var(--v-border)] flex items-center justify-center text-[var(--v-fg-3)] hover:text-[var(--v-fg)] transition-colors">
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <h1 className="text-6xl sm:text-7xl font-semibold tracking-tight text-[var(--v-fg)]">Sweep</h1>
                <p className="text-[var(--v-fg-3)] text-sm font-light tracking-wide">AI for finance, data & real estate</p>
              </div>

              <ModeSelector mode={mode} setMode={setMode} />

              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative flex items-center">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full bg-[var(--v-surface)] text-[var(--v-fg)] rounded-lg pl-5 pr-20 py-4 border border-[var(--v-border-2)] focus:border-[var(--v-fg-3)] focus:outline-none placeholder-[var(--v-fg-5)] text-sm transition-all"
                    style={{ fontSize: '16px' }}
                    placeholder={placeholder}
                    autoComplete="off"
                  />
                  <div className="absolute right-3 flex items-center gap-1">
                    <button type="button" onClick={toggleVoice} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isListening ? 'bg-[var(--v-fg)] text-[var(--v-bg)]' : 'text-[var(--v-fg-4)] hover:text-[var(--v-fg)] hover:bg-[var(--v-surface)]'}`}>
                      {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                    <button type="submit" disabled={!input.trim()} className="w-7 h-7 rounded-lg bg-[var(--v-surface)] hover:bg-[var(--v-border)] border border-[var(--v-border)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all group">
                      <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </form>

              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => handleSuggestion(s.label)}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] hover:bg-[var(--v-border)] hover:border-[var(--v-border-2)] text-[var(--v-fg-3)] hover:text-[var(--v-fg)] text-sm text-left transition-all">
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* MESSAGES */
            <div className="pt-8 pb-4 space-y-1">
              {messages.map((m, idx) => (
                <div key={m.id + '-' + idx}>
                  {m.role === 'user' && (
                    <div className="py-5 flex justify-end">
                      <div className="max-w-[85%] sm:max-w-[75%] bg-[var(--v-surface)] border border-[var(--v-border)] rounded-lg px-4 py-3">
                        <p className="text-[var(--v-fg)] text-sm leading-relaxed">
                          {m.parts.filter((p: any) => p.type === 'text').map((p: any, i: number) => <span key={i}>{p.text}</span>)}
                        </p>
                      </div>
                    </div>
                  )}

                  {m.role === 'assistant' && (
                    <div className="py-5">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full border border-[var(--v-border)] bg-[var(--v-surface)] flex items-center justify-center shrink-0 mt-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full bg-[var(--v-fg-3)] ${isLoading && idx === messages.length - 1 ? 'animate-pulse' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-4">
                          {isLoading && idx === messages.length - 1 && !m.parts.some((p: any) => p.type === 'text') && loadingSteps.length === 0 && <ThinkingAnimation />}

                          {isLoading && idx === messages.length - 1 && loadingSteps.length > 0 && (
                            <div className="space-y-2">
                              {loadingSteps.map((step, i) => (
                                <div key={i} className="flex items-center gap-2.5">
                                  {step.status === 'complete' ? (
                                    <div className="w-4 h-4 rounded-full bg-[var(--v-fg)] flex items-center justify-center shrink-0">
                                      <svg className="w-2.5 h-2.5 text-[var(--v-bg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  ) : step.status === 'loading' ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-[var(--v-border)] border-t-[var(--v-fg-3)] animate-spin shrink-0" />
                                  ) : (
                                    <div className="w-4 h-4 rounded-full bg-[var(--v-surface)] border border-[var(--v-border)] shrink-0" />
                                  )}
                                  <span className={`text-xs ${step.status === 'complete' ? 'text-[var(--v-fg)]' : step.status === 'loading' ? 'text-[var(--v-fg-3)]' : 'text-[var(--v-fg-5)]'}`}>
                                    {step.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {m.parts.filter((p: any) => p.type === 'text').map((part: any, i: number) => {
                            const text = part.text as string;
                            if (/<function[@(]\w+/.test(text)) {
                              return <div key={i} className="space-y-4">{renderTextWithInlineTools(text)}</div>;
                            }
                            return (
                              <div key={i} className="text-[var(--v-fg)] text-sm leading-relaxed">
                                {renderContent(text)}
                              </div>
                            );
                          })}

                          {!(isLoading && idx === messages.length - 1) && m.parts.some((p: any) => p.type === 'text') && (
                            <CopyButton text={m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('')} className="mt-1" />
                          )}

                          {m.parts.map((part: any) => {
                            if (!('state' in part) || !('toolCallId' in part)) return null;
                            if (part.type === 'tool-searchZillowListings' && part.state === 'output-available') {
                              const o = part.output as ZillowListingsOutput;
                              return (
                                <div key={part.toolCallId} className="mt-2">
                                  <ZillowListings
                                    properties={o.properties || []}
                                    totalResults={o.totalResults || 0}
                                    searchCriteria={o.searchCriteria}
                                    error={o.error}
                                    onPropertySelectAction={(url) => sendMessage({ text: `show zillow property ${url}` }, { body: { mode } })}
                                  />
                                </div>
                              );
                            }
                            return null;
                          })}

                          <div className="md:hidden space-y-4">{renderDashboardItems(m)}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {idx < messages.length - 1 && <div className="border-b border-[var(--v-border)]" />}
                </div>
              ))}

              {error && (
                <div className="mt-4 p-4 bg-[var(--v-surface)] border border-[var(--v-border)] rounded-lg">
                  <p className="text-[var(--v-fg)] text-sm">
                    {error.message?.includes('tokens per day') || error.message?.includes('TPD')
                      ? 'Daily token limit reached — resets in a few hours. Try again later.'
                      : error.message?.includes('429') || error.message?.includes('rate limit')
                      ? 'Rate limit reached — please wait a moment and try again.'
                      : 'Something went wrong. Please try again.'}
                  </p>
                  <button onClick={() => window.location.reload()} className="mt-2 text-xs text-[var(--v-fg-3)] hover:text-[var(--v-fg)] underline underline-offset-2 transition-colors">Refresh page</button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* FIXED BOTTOM INPUT */}
        {messages.length > 0 && (
          <div
            className={`fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-[var(--v-bg)] via-[var(--v-bg)]/95 to-transparent pt-8 ${showDashboard ? 'md:right-[42%]' : ''}`}
            style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
          >
            <div className="w-full max-w-2xl mx-auto px-4 space-y-2">
              <ModeSelector mode={mode} setMode={setMode} compact />
              <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                {suggestions.map((s, i) => (
                  <button key={i} type="button" onClick={() => handleSuggestion(s.label)} disabled={isLoading}
                    className="flex items-center px-3 py-1.5 rounded-lg border border-[var(--v-border)] bg-[var(--v-surface)] hover:bg-[var(--v-border)] text-[var(--v-fg-4)] hover:text-[var(--v-fg-3)] text-xs whitespace-nowrap transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                    {s.label}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="w-full bg-[var(--v-surface)] text-[var(--v-fg)] rounded-lg pl-5 pr-20 py-3.5 border border-[var(--v-border-2)] focus:border-[var(--v-fg-3)] focus:outline-none placeholder-[var(--v-fg-5)] text-sm transition-all disabled:opacity-50"
                  style={{ fontSize: '16px' }}
                  placeholder={placeholder}
                  disabled={isLoading}
                  autoComplete="off"
                />
                <div className="absolute right-3 flex items-center gap-1">
                  <button type="button" onClick={toggleVoice} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isListening ? 'bg-[var(--v-fg)] text-[var(--v-bg)]' : 'text-[var(--v-fg-4)] hover:text-[var(--v-fg)]'}`}>
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                  <button type="submit" disabled={!input.trim() || isLoading} className="w-7 h-7 rounded-lg bg-[var(--v-surface)] hover:bg-[var(--v-border)] border border-[var(--v-border)] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all group">
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              </form>
              <p className="text-center text-[11px] text-[var(--v-fg-5)]">Sweep can make mistakes. Verify important information.</p>
            </div>
          </div>
        )}
      </main>

      {/* RIGHT DASHBOARD SIDEBAR */}
      <aside className={`hidden md:flex flex-col fixed top-0 right-0 h-full w-[42%] bg-[var(--v-bg-2)] border-l border-[var(--v-border)] z-20 transform transition-transform duration-300 ${showDashboard ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--v-border)] shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[var(--v-fg-3)]" />
            <span className="text-sm font-medium text-[var(--v-fg)]">Dashboard</span>
          </div>
          <button onClick={() => setShowDashboard(false)} className="w-7 h-7 rounded-lg hover:bg-[var(--v-surface)] flex items-center justify-center text-[var(--v-fg-4)] hover:text-[var(--v-fg-3)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {(() => {
            const last = [...messages].reverse().find(m =>
              m.role === 'assistant' &&
              m.parts.some((p: any) => toolTypes.includes(p.type) && 'state' in p && p.state === 'output-available')
            );
            return last ? renderDashboardItems(last) : null;
          })()}
        </div>
      </aside>

      <div className={`fixed bottom-2 right-4 text-[10px] text-[var(--v-fg-5)] pointer-events-none select-none z-10 font-light ${showDashboard ? 'md:right-[calc(42%+12px)]' : ''}`}>
        by Sushant Kataria
      </div>
    </div>
  );
}

// ─── App (outer) ──────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [convs, setConvs] = useState<StoredConv[]>([]);
  const [currentId, setCurrentId] = useState<string>('');
  const [showConvSidebar, setShowConvSidebar] = useState(false);

  // Load theme + conversations from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null;
    if (savedTheme) setTheme(savedTheme);
    const loaded = loadConvs();
    setConvs(loaded);
    if (loaded.length > 0) setCurrentId(loaded[0].id);
    else { const id = genId(); setCurrentId(id); }
  }, []);

  // Sync theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleUpdateConv = useCallback((id: string, messages: any[], title: string, mode: Mode) => {
    setConvs(prev => {
      const exists = prev.find(c => c.id === id);
      let next: StoredConv[];
      if (exists) {
        next = prev.map(c => c.id === id ? { ...c, messages, title, mode, updatedAt: Date.now() } : c);
      } else {
        next = [{ id, title, mode, messages, createdAt: Date.now(), updatedAt: Date.now() }, ...prev];
      }
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      saveConvs(next);
      return next;
    });
  }, []);

  const newConv = () => {
    const id = genId();
    setCurrentId(id);
    setShowConvSidebar(false);
  };

  const deleteConv = (id: string) => {
    setConvs(prev => {
      const next = prev.filter(c => c.id !== id);
      saveConvs(next);
      return next;
    });
    if (id === currentId) {
      const remaining = convs.filter(c => c.id !== id);
      if (remaining.length > 0) setCurrentId(remaining[0].id);
      else setCurrentId(genId());
    }
  };

  if (!currentId) return null;

  const currentConv = convs.find(c => c.id === currentId);

  return (
    <>
      {showConvSidebar && (
        <ConvSidebar
          convs={convs}
          currentId={currentId}
          onSelect={setCurrentId}
          onNew={newConv}
          onDelete={deleteConv}
          onClose={() => setShowConvSidebar(false)}
        />
      )}
      <Chat
        key={currentId}
        convId={currentId}
        initialMessages={currentConv?.messages ?? []}
        initialMode={currentConv?.mode ?? 'chat'}
        theme={theme}
        toggleTheme={toggleTheme}
        onUpdateConv={handleUpdateConv}
        onOpenConvSidebar={() => setShowConvSidebar(true)}
      />
    </>
  );
}

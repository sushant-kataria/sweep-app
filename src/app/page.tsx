'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp, BarChart2, X, Search, MessageSquare, Code2, Copy, Check, Sun, Moon, Mic, MicOff, FileDown, Menu, Pencil, RotateCcw, Square } from 'lucide-react';

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
import { HomeLanding } from '@/components/home/home-landing';
import { AuthButton } from '@/components/auth/auth-button';
import { SweepMobileMenu } from '@/components/sweep-mobile-menu';
import { SweepHeaderNav } from '@/components/sweep-header-nav';

// ─── Types ───────────────────────────────────────────────────────────────────

type Mode = 'chat' | 'search' | 'code';

type StoredConv = {
  id: string;
  title: string;
  mode: Mode;
  messages: any[];
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
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
const CURRENT_CONV_KEY = 'sweep_current_conv';
const THEME_KEY = 'sweep-theme';
const CONV_TTL_MS = 5 * 60 * 1000;

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

function cloneForStorage<T>(value: T): T {
  try { return JSON.parse(JSON.stringify(value)); } catch { return value; }
}

function withExpiry(conv: StoredConv): StoredConv {
  const now = Date.now();
  return { ...conv, updatedAt: now, expiresAt: now + CONV_TTL_MS };
}

function pruneExpired(convs: StoredConv[]): StoredConv[] {
  const now = Date.now();
  return convs.filter(c => (c.expiresAt ?? 0) > now);
}

function loadConvs(): StoredConv[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(CONV_KEY) || '[]') as StoredConv[];
    const active = pruneExpired(parsed);
    if (active.length !== parsed.length) saveConvs(active);
    return active;
  } catch { return []; }
}

function saveConvs(convs: StoredConv[]) {
  try {
    const active = pruneExpired(convs);
    localStorage.setItem(CONV_KEY, JSON.stringify(cloneForStorage(active.slice(0, 20))));
  } catch {}
}

function saveCurrentConvId(id: string) {
  try { localStorage.setItem(CURRENT_CONV_KEY, id); } catch {}
}

function loadCurrentConvId(): string | null {
  try { return localStorage.getItem(CURRENT_CONV_KEY); } catch { return null; }
}

function messageHasDashboardOutput(message: any) {
  return message.parts?.some(
    (p: any) => toolTypes.includes(p.type) && 'state' in p && p.state === 'output-available'
  );
}

function getLatestDashboardMessage(messages: any[]) {
  return [...messages].reverse().find(m => m.role === 'assistant' && messageHasDashboardOutput(m));
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

const AAPL_STOCK_ITEMS = [
  { label: '2018', value: 39 },
  { label: '2019', value: 73 },
  { label: '2020', value: 132 },
  { label: '2021', value: 178 },
  { label: '2022', value: 130 },
  { label: '2023', value: 193 },
  { label: '2024', value: 250 },
];

function parseToolArgs(toolName: string, raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    if (toolName === 'showLineChart' && /AAPL|Apple/i.test(trimmed)) {
      return { title: 'Apple (AAPL) Stock Price', unit: 'USD', items: AAPL_STOCK_ITEMS };
    }
    const itemsMatch = trimmed.match(/"items"\s*:\s*(\[[\s\S]*)/);
    if (itemsMatch) {
      let itemsJson = itemsMatch[1];
      const open = (itemsJson.match(/\[/g) ?? []).length;
      const close = (itemsJson.match(/\]/g) ?? []).length;
      for (let i = close; i < open; i++) itemsJson += ']';
      try {
        const items = JSON.parse(itemsJson);
        const titleMatch = trimmed.match(/"title"\s*:\s*"([^"]+)"/);
        const unitMatch = trimmed.match(/"unit"\s*:\s*"([^"]+)"/);
        return {
          title: titleMatch?.[1] ?? 'Chart',
          unit: unitMatch?.[1] ?? '',
          items,
        };
      } catch {
        return null;
      }
    }
    return null;
  }
}

function renderTextWithInlineTools(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /<function[.@(](\w+)[)>]>([\s\S]*?)(?:<\/function>|$)/g;
  let lastIndex = 0; let match; let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index).trim();
      if (before) nodes.push(<div key={key++}>{renderContent(before)}</div>);
    }
    try {
      const toolName = match[1];
      const args = parseToolArgs(toolName, match[2]);
      if (!args) throw new Error('unparsed');
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
    <span className="text-sm text-[var(--v-fg-4)] transition-opacity duration-300" style={{ opacity: fade ? 1 : 0 }}>
      {THINKING_WORDS[wordIdx]}
    </span>
  );
}

function getMessageText(message: { parts?: Array<{ type: string; text?: string }> }): string {
  return message.parts?.filter((p) => p.type === 'text').map((p) => p.text ?? '').join('') ?? '';
}

function MessageActionBtn({
  onClick,
  label,
  icon: Icon,
  disabled = false,
  className = '',
}: {
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string; fill?: string }>;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grok-message-action ${className}`.trim()}
    >
      <Icon className={className.includes('grok-message-action--stop') ? 'fill-current' : undefined} />
    </button>
  );
}

function CopyButton({ text, className = '', iconOnly = false }: { text: string; className?: string; iconOnly?: boolean }) {
  const [copied, setCopied] = useState(false);
  const label = copied ? 'Copied' : 'Copy';
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      aria-label={label}
      title={label}
      className={iconOnly ? `grok-message-action ${className}`.trim() : `flex items-center gap-1.5 text-xs text-[var(--v-fg-4)] hover:text-[var(--v-fg-3)] transition-colors ${className}`}
    >
      {copied ? <Check /> : <Copy />}
      {!iconOnly && <span>{label}</span>}
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
    <div className={`flex flex-wrap items-center gap-1 ${compact ? 'justify-start' : 'justify-center'}`}>
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => setMode(m.id)}
          className={`grok-mode-pill ${mode === m.id ? 'grok-mode-pill--active' : ''}`}
        >
          {m.icon}
          <span className={compact ? 'hidden min-[420px]:inline' : ''}>{m.label}</span>
        </button>
      ))}
    </div>
  );
}

function ChatComposer({
  input,
  setInput,
  placeholder,
  isStreaming,
  isListening,
  toggleVoice,
  onSubmit,
  onStop,
  inputRef,
}: {
  input: string;
  setInput: (v: string) => void;
  placeholder: string;
  isStreaming?: boolean;
  isListening: boolean;
  toggleVoice: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <form onSubmit={onSubmit} className="w-full min-w-0">
      <div className="grok-composer">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="grok-composer-input"
          style={{ fontSize: '16px' }}
          placeholder={placeholder}
          disabled={isStreaming}
          autoComplete="off"
        />
        <div className="grok-composer-toolbar">
          <button
            type="button"
            onClick={toggleVoice}
            className={`grok-icon-btn ${isListening ? 'grok-icon-btn--active' : ''}`}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            disabled={isStreaming}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="grok-stop-btn"
              aria-label="Stop generating"
            >
              <Square className="h-3.5 w-3.5" fill="currentColor" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="grok-send-btn"
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

// ─── Chat (inner, keyed per conversation) ────────────────────────────────────

function Chat({
  convId, initialMessages, initialMode, theme, toggleTheme,
  onUpdateConv, onGoHome,
  convs, onSelectConv, onNewConv, onDeleteConv,
}: {
  convId: string; initialMessages: any[]; initialMode: Mode;
  theme: 'dark' | 'light'; toggleTheme: () => void;
  onUpdateConv: (id: string, messages: any[], title: string, mode: Mode) => void;
  onGoHome: () => void;
  convs: StoredConv[];
  onSelectConv: (id: string) => void;
  onNewConv: () => void;
  onDeleteConv: (id: string) => void;
}) {
  const seededMessages = useRef(cloneForStorage(initialMessages));
  const { messages, sendMessage, regenerate, stop, status, error } = useChat({ id: convId, messages: seededMessages.current });
  const [input, setInput] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [mode, setMode] = useState<Mode>(initialMode);
  const [showDashboard, setShowDashboard] = useState(false);
  const [hasDashboardItems, setHasDashboardItems] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const isNearBottomRef = useRef(true);
  const lastPersistedRef = useRef('');

  const onVoiceTranscript = useCallback((text: string) => {
    setInput(t => (t ? `${t} ${text}` : text));
  }, []);
  const { isListening, toggle: toggleVoice } = useVoiceInput(onVoiceTranscript);

  const persistConversation = useCallback(() => {
    if (messages.length === 0) return;
    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg?.parts?.find((p: any) => p.type === 'text')?.text?.slice(0, 60) ?? 'New chat';
    const snapshot = JSON.stringify({ convId, title, mode, messages: cloneForStorage(messages) });
    if (snapshot === lastPersistedRef.current) return;
    lastPersistedRef.current = snapshot;
    onUpdateConv(convId, cloneForStorage(messages), title, mode);
  }, [messages, convId, mode, onUpdateConv]);

  useEffect(() => {
    lastPersistedRef.current = '';
    setInput('');
    setEditingMessageId(null);
    setEditDraft('');
    setShowDashboard(false);
    setHasDashboardItems(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'instant' });
  }, [convId]);

  // Persist messages to parent on change (skip if snapshot unchanged to avoid render loops)
  useEffect(() => {
    persistConversation();
  }, [persistConversation]);

  // Flush save when a response finishes streaming
  useEffect(() => {
    if (status === 'ready') persistConversation();
  }, [status, persistConversation]);

  useEffect(() => {
    const has = messages.some(m =>
      m.parts?.some((p: any) => toolTypes.includes(p.type) && 'state' in p && p.state === 'output-available')
    );
    setHasDashboardItems(prev => (prev === has ? prev : has));
    setShowDashboard(prev => {
      if (has) return prev ? prev : true;
      return prev ? false : prev;
    });
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

  const router = useRouter();

  const handleSuggestion = (label: string) => {
    if (/balance sheet/i.test(label)) {
      const ticker = /walmart/i.test(label) ? 'WMT' : /apple/i.test(label) ? 'AAPL' : /microsoft/i.test(label) ? 'MSFT' : 'WMT';
      router.push(`/finance?ticker=${encodeURIComponent(ticker)}&generate=1`);
      return;
    }
    sendMessage({ text: label }, { body: { mode } });
  };

  const isBusy = status === 'streaming' || status === 'submitted';

  const handleStop = () => {
    void stop();
  };

  const handleEditUserMessage = async (messageId: string, newText: string) => {
    const trimmed = newText.trim();
    if (!trimmed || isBusy) return;
    setEditingMessageId(null);
    setEditDraft('');
    setShowDashboard(false);
    isNearBottomRef.current = true;
    await sendMessage({ text: trimmed, messageId }, { body: { mode } });
  };

  const handleResendUserMessage = async (messageId: string, text: string) => {
    if (!text.trim() || isBusy) return;
    setShowDashboard(false);
    isNearBottomRef.current = true;
    await sendMessage({ text, messageId }, { body: { mode } });
  };

  const handleRegenerateAssistant = async (messageId: string) => {
    if (isBusy) return;
    setShowDashboard(false);
    isNearBottomRef.current = true;
    await regenerate({ messageId }, { body: { mode } });
  };

  const startEditingMessage = (messageId: string, text: string) => {
    if (isBusy) return;
    setEditingMessageId(messageId);
    setEditDraft(text);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditDraft('');
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
      const wrap = (node: React.ReactNode) => (
        <div key={k} className="min-w-0 w-full max-w-full">{node}</div>
      );
      if (part.type === 'tool-showBarChart') return wrap(<BarChartPro title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />);
      if (part.type === 'tool-showLineChart') return wrap(<LineChartPro title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />);
      if (part.type === 'tool-showPieChart') return wrap(<PieChartPro title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />);
      if (part.type === 'tool-showAreaChart') return wrap(<AreaChartPro title={(part.output as ChartOutput).title} data={(part.output as ChartOutput).data} unit={(part.output as ChartOutput).unit} />);
      if (part.type === 'tool-showComparison') return wrap(<ComparisonTable title={(part.output as ComparisonOutput).title} items={(part.output as ComparisonOutput).items} />);
      if (part.type === 'tool-showStats') return wrap(<StatsCard title={(part.output as StatsOutput).title} stats={(part.output as StatsOutput).stats} />);
      if (part.type === 'tool-showBalanceSheet') {
        const o = part.output as BalanceSheetOutput;
        return wrap(<BalanceSheet title={o.title} period={o.period} currency={o.currency} assets={o.assets} liabilities={o.liabilities} equity={o.equity} />);
      }
      if (part.type === 'tool-showPropertyPortfolio') return wrap(<PropertyPortfolio properties={(part.output as PropertyPortfolioOutput).properties} />);
      if (part.type === 'tool-showZillowProperty') {
        const o = part.output as ZillowPropertyOutput;
        return wrap(<ZillowProperty property={o.property} zillowUrl={o.zillowUrl} error={o.error} />);
      }
      return null;
    });

  const loadingSteps = getLoadingSteps();
  const isLoading = status === 'streaming' || status === 'submitted';
  const placeholder = modes.find(m => m.id === mode)?.placeholder ?? 'Ask anything...';
  const suggestions = suggestionsByMode[mode];
  const convTitle = messages.find(m => m.role === 'user')?.parts?.find((p: any) => p.type === 'text')?.text?.slice(0, 60) ?? 'New chat';
  const latestDashboardMessage = getLatestDashboardMessage(messages);
  const isLanding = messages.length === 0;

  const openHeaderMenu = () => {
    setShowMobileMenu(true);
  };

  return (
    <div className="bg-[var(--v-bg)] text-[var(--v-fg)] flex flex-col" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

      <SweepMobileMenu
        open={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        includeChat={!isLanding}
        convs={convs}
        currentConvId={convId}
        onSelectConv={onSelectConv}
        onNewConv={onNewConv}
        onDeleteConv={onDeleteConv}
      />

      {/* ── HEADER ── */}
      <header className={`grok-header safe-top fixed top-0 left-0 right-0 z-30 transition-[margin] duration-300 ${showDashboard ? 'md:mr-[min(42%,520px)]' : ''}`}>
        <div className="grok-header-inner">
          <div className="grok-header-slot grok-header-slot--left">
            <button
              onClick={openHeaderMenu}
              aria-label="Open menu"
              className="grok-ghost-btn"
            >
              <Menu className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
            </button>
            <Link
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onGoHome();
              }}
              className="grok-header-home"
              aria-label="Sweep home"
            >
              <span className="font-pixel text-base leading-none tracking-normal text-[var(--v-fg)] sm:text-lg">
                Sweep
              </span>
            </Link>
          </div>

          <div className="grok-header-slot grok-header-slot--center">
            <SweepHeaderNav />
          </div>

          <div className="grok-header-slot grok-header-slot--right">
            <AuthButton />
            {messages.length > 0 && hasDashboardItems && (
              <button
                onClick={() => setShowDashboard(v => !v)}
                className="grok-ghost-btn grok-ghost-btn--wide"
                title={showDashboard ? 'Hide charts' : 'Show charts'}
                aria-label={showDashboard ? 'Hide charts' : 'Show charts'}
              >
                <BarChart2 className="h-4 w-4" />
                <span className="hidden text-xs text-[var(--v-fg-3)] md:inline">Charts</span>
              </button>
            )}
            {messages.length > 0 && (
              <button onClick={() => exportChat(messages, convTitle)} className="grok-ghost-btn" title="Export chat" aria-label="Export chat">
                <FileDown className="h-4 w-4" />
              </button>
            )}
            <button onClick={toggleTheme} aria-label="Toggle theme" className="grok-ghost-btn">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main ref={mainRef} className={`flex-1 overflow-y-auto overscroll-y-contain pt-[3.25rem] transition-all duration-300 ease-in-out sm:pt-14 ${showDashboard ? 'md:mr-[min(42%,520px)]' : ''}`}>
        <div className={`mx-auto w-full px-3 sm:px-5 ${messages.length > 0 ? 'max-w-3xl pb-8' : 'max-w-6xl pb-12'}`}>

          {messages.length === 0 ? (
            <HomeLanding />
          ) : (
            /* MESSAGES */
            <div className="pb-4 pt-4 sm:pt-6">
              {messages.map((m, idx) => (
                <div key={m.id + '-' + idx} className="grok-turn">
                  {m.role === 'user' && (
                    <div className="flex flex-col items-end gap-2">
                      {editingMessageId === m.id ? (
                        <div className="grok-edit-panel w-full max-w-[min(85%,42rem)]">
                          <textarea
                            value={editDraft}
                            onChange={(e) => setEditDraft(e.target.value)}
                            className="grok-edit-input"
                            rows={Math.min(8, Math.max(2, editDraft.split('\n').length))}
                            autoFocus
                          />
                          <div className="mt-2 flex justify-end gap-2">
                            <button type="button" onClick={cancelEditing} className="grok-edit-btn grok-edit-btn--ghost">
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleEditUserMessage(m.id, editDraft)}
                              disabled={!editDraft.trim()}
                              className="grok-edit-btn grok-edit-btn--primary"
                            >
                              Save & resend
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="grok-user-bubble">
                            {m.parts.filter((p: any) => p.type === 'text').map((p: any, i: number) => <span key={i}>{p.text}</span>)}
                          </div>
                          <div className="grok-message-actions justify-end">
                            <MessageActionBtn
                              label="Edit"
                              icon={Pencil}
                              disabled={isBusy}
                              onClick={() => startEditingMessage(m.id, getMessageText(m))}
                            />
                            <MessageActionBtn
                              label="Resend"
                              icon={RotateCcw}
                              disabled={isBusy}
                              onClick={() => void handleResendUserMessage(m.id, getMessageText(m))}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {m.role === 'assistant' && (
                    <div className="mt-4 space-y-4">
                      {isLoading && idx === messages.length - 1 && !m.parts.some((p: any) => p.type === 'text') && loadingSteps.length === 0 && (
                        <ThinkingAnimation />
                      )}

                      {isLoading && idx === messages.length - 1 && loadingSteps.length > 0 && (
                        <div className="space-y-2 rounded-xl border border-[var(--v-border)] bg-[var(--v-surface)] px-3 py-2.5">
                          {loadingSteps.map((step, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                              {step.status === 'complete' ? (
                                <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[var(--v-fg)]">
                                  <Check className="h-2.5 w-2.5 text-[var(--v-bg)]" strokeWidth={3} />
                                </div>
                              ) : step.status === 'loading' ? (
                                <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[var(--v-border)] border-t-[var(--v-fg-3)]" />
                              ) : (
                                <div className="h-4 w-4 shrink-0 rounded-full border border-[var(--v-border)] bg-[var(--v-bg)]" />
                              )}
                              <span className={`text-xs ${step.status === 'complete' ? 'text-[var(--v-fg)]' : step.status === 'loading' ? 'text-[var(--v-fg-3)]' : 'text-[var(--v-fg-5)]'}`}>
                                {step.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grok-assistant-block space-y-4">
                        {m.parts.filter((p: any) => p.type === 'text').map((part: any, i: number) => {
                          const text = part.text as string;
                          if (/<function[.@(]\w+/.test(text)) {
                            return <div key={i} className="space-y-4">{renderTextWithInlineTools(text)}</div>;
                          }
                          return <div key={i}>{renderContent(text)}</div>;
                        })}
                      </div>

                      {!(isLoading && idx === messages.length - 1) && m.parts.some((p: any) => p.type === 'text') && (
                        <div className="grok-message-actions">
                          <CopyButton text={getMessageText(m)} iconOnly />
                          <MessageActionBtn
                            label="Resend"
                            icon={RotateCcw}
                            disabled={isBusy}
                            onClick={() => void handleRegenerateAssistant(m.id)}
                          />
                        </div>
                      )}

                      {isLoading && idx === messages.length - 1 && (
                        <div className="grok-message-actions mt-2">
                          <MessageActionBtn label="Stop" icon={Square} className="grok-message-action--stop" onClick={handleStop} />
                        </div>
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

                      {messageHasDashboardOutput(m) && (
                        <button
                          type="button"
                          onClick={() => setShowDashboard(true)}
                          className="dashboard-card flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--v-border)] bg-[var(--v-surface)] px-4 py-3 text-left transition-colors hover:border-[var(--v-border-2)] md:hidden"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--v-fg)]">Charts & data ready</p>
                            <p className="text-xs text-[var(--v-fg-4)]">Tap to open dashboard</p>
                          </div>
                          <BarChart2 className="h-4 w-4 shrink-0 text-[var(--v-fg-3)]" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <div className="mt-4 p-4 bg-[var(--v-surface)] border border-[var(--v-border)] rounded-lg">
                  <p className="text-[var(--v-fg)] text-sm">
                    {(() => {
                      const err = (error.message ?? '').toLowerCase();
                      if (err.includes('tokens per day') || err.includes('tpd')) {
                        return 'Daily token limit reached — resets in a few hours. Try again later.';
                      }
                      if (err.includes('429') || err.includes('rate limit') || err.includes('tpm')) {
                        return 'Rate limit reached — please wait ~20 seconds and try again.';
                      }
                      return 'Something went wrong. Please try again.';
                    })()}
                  </p>
                  <button onClick={() => window.location.reload()} className="mt-2 text-xs text-[var(--v-fg-3)] hover:text-[var(--v-fg)] underline underline-offset-2 transition-colors">Refresh page</button>
                </div>
              )}
              <div ref={messagesEndRef} />

              <div className="mt-6 space-y-2">
                <ModeSelector mode={mode} setMode={setMode} compact />
                <ChatComposer
                  input={input}
                  setInput={setInput}
                  placeholder={placeholder}
                  isStreaming={isLoading}
                  isListening={isListening}
                  toggleVoice={toggleVoice}
                  onSubmit={handleSubmit}
                  onStop={handleStop}
                  inputRef={chatInputRef}
                />
                <p className="pb-1 text-center text-[11px] text-[var(--v-fg-5)]">
                  Sweep can make mistakes. Verify important information.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MOBILE DASHBOARD SHEET */}
      {showDashboard && hasDashboardItems && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end md:hidden">
          <button
            type="button"
            aria-label="Close dashboard"
            className="absolute inset-0 bg-black/45"
            onClick={() => setShowDashboard(false)}
          />
          <div className="safe-bottom relative flex max-h-[88dvh] flex-col rounded-t-2xl border-t border-[var(--v-border)] bg-[var(--v-bg)] shadow-[0_-24px_60px_rgba(0,0,0,0.22)]">
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--v-border-2)]" />
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--v-border)] px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <BarChart2 className="h-4 w-4 shrink-0 text-[var(--v-fg-4)]" />
                <span className="truncate text-sm font-medium text-[var(--v-fg)]">Dashboard</span>
              </div>
              <button onClick={() => setShowDashboard(false)} aria-label="Close dashboard" className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--v-fg-4)] transition-colors hover:bg-[var(--v-surface)] hover:text-[var(--v-fg-3)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto overscroll-y-contain p-4">
              {latestDashboardMessage ? renderDashboardItems(latestDashboardMessage) : null}
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP DASHBOARD SIDEBAR */}
      <aside className={`fixed top-0 right-0 z-20 hidden h-full w-[min(42%,520px)] transform flex-col border-l border-[var(--v-border)] bg-[var(--v-bg)] transition-transform duration-300 ease-in-out md:flex ${showDashboard ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="safe-top flex min-w-0 shrink-0 items-center justify-between gap-3 border-b border-[var(--v-border)] px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <BarChart2 className="h-4 w-4 shrink-0 text-[var(--v-fg-4)]" />
            <span className="truncate text-sm font-medium text-[var(--v-fg-3)]">Dashboard</span>
          </div>
          <button onClick={() => setShowDashboard(false)} aria-label="Close dashboard" className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--v-fg-4)] transition-colors hover:bg-[var(--v-surface)] hover:text-[var(--v-fg-3)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto overscroll-y-contain p-4 sm:p-5">
          {latestDashboardMessage ? renderDashboardItems(latestDashboardMessage) : null}
        </div>
      </aside>
    </div>
  );
}

// ─── App (outer) ──────────────────────────────────────────────────────────────

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [convs, setConvs] = useState<StoredConv[]>([]);
  const [currentId, setCurrentId] = useState<string>('');
  const [chatSession, setChatSession] = useState(0);
  // Load theme + conversations from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) as 'dark' | 'light' | null;
    if (savedTheme) setTheme(savedTheme);
    const loaded = loadConvs();
    setConvs(loaded);
    const savedCurrentId = loadCurrentConvId();
    if (savedCurrentId && loaded.some(c => c.id === savedCurrentId)) {
      setCurrentId(savedCurrentId);
    } else if (loaded.length > 0) {
      setCurrentId(loaded[0].id);
      saveCurrentConvId(loaded[0].id);
    } else {
      const id = genId();
      setCurrentId(id);
      saveCurrentConvId(id);
    }
  }, []);

  // Keep active conversation id in sync + prune expired chats every 30s
  useEffect(() => {
    if (!currentId) return;
    saveCurrentConvId(currentId);
    const timer = window.setInterval(() => {
      setConvs(prev => {
        const next = pruneExpired(prev);
        if (next.length === prev.length) return prev;
        saveConvs(next);
        if (!next.some(c => c.id === currentId)) {
          const fallback = next[0]?.id ?? genId();
          setCurrentId(fallback);
          saveCurrentConvId(fallback);
        }
        return next;
      });
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [currentId]);

  // Sync theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const handleUpdateConv = useCallback((id: string, messages: any[], title: string, mode: Mode) => {
    const storedMessages = cloneForStorage(messages);
    setConvs(prev => {
      const exists = prev.find(c => c.id === id);
      if (exists) {
        const unchanged =
          exists.title === title &&
          exists.mode === mode &&
          JSON.stringify(exists.messages) === JSON.stringify(storedMessages);
        if (unchanged) return prev;
      }
      const now = Date.now();
      let next: StoredConv[];
      if (exists) {
        next = prev.map(c => c.id === id
          ? withExpiry({ ...c, messages: storedMessages, title, mode })
          : c);
      } else {
        next = [withExpiry({
          id,
          title,
          mode,
          messages: storedMessages,
          createdAt: now,
          updatedAt: now,
          expiresAt: now + CONV_TTL_MS,
        }), ...prev];
      }
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      saveConvs(next);
      return next;
    });
    saveCurrentConvId(id);
  }, []);

  const selectConv = (id: string) => {
    setCurrentId(id);
    saveCurrentConvId(id);
    setChatSession((n) => n + 1);
  };

  const newConv = () => {
    const id = genId();
    setCurrentId(id);
    saveCurrentConvId(id);
    setChatSession((n) => n + 1);
  };

  const deleteConv = (id: string) => {
    setConvs(prev => {
      const next = prev.filter(c => c.id !== id);
      saveConvs(next);
      return next;
    });
    if (id === currentId) {
      const remaining = convs.filter(c => c.id !== id);
      if (remaining.length > 0) {
        setCurrentId(remaining[0].id);
        saveCurrentConvId(remaining[0].id);
      } else {
        const freshId = genId();
        setCurrentId(freshId);
        saveCurrentConvId(freshId);
      }
    }
  };

  if (!currentId) return null;

  const currentConv = convs.find(c => c.id === currentId);

  return (
    <Chat
      key={`${currentId}-${chatSession}`}
      convId={currentId}
      initialMessages={currentConv?.messages ?? []}
      initialMode={currentConv?.mode ?? 'chat'}
      theme={theme}
      toggleTheme={toggleTheme}
      onUpdateConv={handleUpdateConv}
      onGoHome={newConv}
      convs={convs}
      onSelectConv={selectConv}
      onNewConv={newConv}
      onDeleteConv={deleteConv}
    />
  );
}

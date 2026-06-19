'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import type { FinanceReportContext } from '@/lib/finance-types';

const SUGGESTIONS = [
  'Walk me through the executive summary',
  'What are the biggest risks on this balance sheet?',
  'How does liquidity compare to industry norms?',
  'Explain the debt structure and net debt position',
  'Which strengths would you highlight to an investor?',
];

export function FinanceChat({ context }: { context: FinanceReportContext }) {
  const sessionKey = `${context.report.ticker}-${context.report.period}`;
  const { messages, sendMessage, status, error } = useChat({ id: `finance-${sessionKey}` });
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input }, { body: { mode: 'finance', reportContext: context } });
    setInput('');
  };

  const ask = (text: string) => {
    if (isLoading) return;
    sendMessage({ text }, { body: { mode: 'finance', reportContext: context } });
  };

  return (
    <div className="finance-chat">
      <div className="finance-chat-header">
        <h2 className="finance-chat-title">Ask about this report</h2>
        <p className="finance-chat-subtitle">
          Answers use only {context.report.companyName} ({context.report.ticker}) — {context.report.period}
        </p>
      </div>

      <div className="finance-chat-messages finance-scroll">
        {messages.length === 0 && (
          <div className="finance-chat-empty">
            <p className="text-sm text-[var(--v-fg-3)]">Try a question about liquidity, leverage, or line items.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => ask(s)} className="grok-suggestion-chip">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`finance-chat-turn finance-chat-turn--${m.role}`}>
            {m.role === 'user' && (
              <div className="grok-user-bubble ml-auto max-w-[90%]">
                {m.parts.filter((p) => p.type === 'text').map((p, i) => (
                  <span key={i}>{p.type === 'text' ? p.text : ''}</span>
                ))}
              </div>
            )}
            {m.role === 'assistant' && (
              <div className="grok-assistant-block text-sm">
                {m.parts.filter((p) => p.type === 'text').map((p, i) => (
                  <p key={i} className="whitespace-pre-wrap">{p.type === 'text' ? p.text : ''}</p>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <p className="text-sm text-[var(--v-fg-4)]">Analyzing report…</p>
        )}

        {error && (
          <p className="text-sm text-red-500">
            {(error.message ?? '').toLowerCase().includes('rate limit')
              ? 'Rate limit reached — wait a moment and try again.'
              : 'Could not get an answer. Please try again.'}
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={handleSubmit} className="finance-chat-composer">
        <div className="grok-composer">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about assets, debt, equity, ratios…"
            className="grok-composer-input"
            style={{ fontSize: '16px' }}
            disabled={isLoading}
            autoComplete="off"
          />
          <div className="grok-composer-toolbar">
            <button type="submit" disabled={!input.trim() || isLoading} className="grok-send-btn" aria-label="Send">
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
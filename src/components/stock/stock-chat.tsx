'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import type { StockReportContext } from '@/lib/stock-types';

const SUGGESTIONS = [
  'Summarize the investment thesis',
  'How does valuation compare to peers?',
  'What are the biggest risks over the next 12 months?',
  'Explain the recent price momentum',
  'Which metrics would you watch before earnings?',
];

export function StockChat({ context }: { context: StockReportContext }) {
  const sessionKey = context.ticker;
  const { messages, sendMessage, status, error } = useChat({ id: `stock-${sessionKey}` });
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input }, { body: { mode: 'stock', stockContext: context } });
    setInput('');
  };

  const ask = (text: string) => {
    if (isLoading) return;
    sendMessage({ text }, { body: { mode: 'stock', stockContext: context } });
  };

  return (
    <div className="finance-chat">
      <div className="finance-chat-header">
        <h2 className="finance-chat-title">Ask about this equity</h2>
        <p className="finance-chat-subtitle">
          Answers use only {context.companyName} ({context.ticker}) — {context.sector}
        </p>
      </div>

      <div className="finance-chat-messages finance-scroll">
        {messages.length === 0 && (
          <div className="finance-chat-empty">
            <p className="text-sm text-[var(--v-fg-3)]">Try a question about valuation, momentum, or peer positioning.</p>
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
          <p className="text-sm text-[var(--v-fg-4)]">Researching equity…</p>
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
            placeholder="Ask about valuation, peers, risks, momentum…"
            className="grok-composer-input"
            disabled={isLoading}
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="grok-composer-send" aria-label="Send">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
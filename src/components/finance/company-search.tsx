'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import type { CompanySearchResult } from '@/lib/company-types';

type Props = {
  value: CompanySearchResult | null;
  onChange: (company: CompanySearchResult | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

export function CompanySearch({
  value,
  onChange,
  disabled = false,
  placeholder = 'Search ticker or company name (e.g. AAPL, Walmart)',
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(value ? `${value.name} (${value.ticker})` : '');
  const [results, setResults] = useState<CompanySearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (value) {
      setQuery(`${value.name} (${value.ticker})`);
    }
  }, [value]);

  useEffect(() => {
    if (!open || query.trim().length < 1) {
      setResults([]);
      return;
    }

    if (value && query === `${value.name} (${value.ticker})`) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/companies/search?q=${encodeURIComponent(query)}&limit=12`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { results?: CompanySearchResult[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Search failed.');
        setResults(data.results ?? []);
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Search failed.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, open, value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (company: CompanySearchResult) => {
    onChange(company);
    setQuery(`${company.name} (${company.ticker})`);
    setOpen(false);
    setResults([]);
  };

  return (
    <div ref={rootRef} className="company-search">
      <label className="finance-field" htmlFor={listId}>
        <span>Company</span>
        <div className="company-search-input-wrap">
          <Search className="company-search-icon" aria-hidden />
          <input
            id={listId}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (value && e.target.value !== `${value.name} (${value.ticker})`) {
                onChange(null);
              }
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="finance-input company-search-input"
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={`${listId}-listbox`}
          />
          {loading && <Loader2 className="company-search-spinner animate-spin" aria-hidden />}
        </div>
      </label>

      {open && (results.length > 0 || error || (query.trim() && !loading)) && (
        <ul id={`${listId}-listbox`} className="company-search-results" role="listbox">
          {error && <li className="company-search-empty">{error}</li>}
          {!error && results.length === 0 && query.trim() && !loading && (
            <li className="company-search-empty">No SEC companies match that search.</li>
          )}
          {results.map((company) => (
            <li key={company.cik}>
              <button
                type="button"
                className="company-search-option"
                role="option"
                onClick={() => pick(company)}
              >
                <span className="company-search-ticker">{company.ticker}</span>
                <span className="company-search-name">{company.name}</span>
                <span className="company-search-cik">CIK {company.cik}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

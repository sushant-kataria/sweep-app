import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import { generateObject, generateText } from 'ai';
import type { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

const MAX_PROMPT_CHARS = 12_000;

function getFinanceModels() {
  const models = [];
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    models.push(google('gemini-2.0-flash'));
    models.push(google('gemini-2.0-flash-lite'));
  }
  if (process.env.GROQ_API_KEY) {
    models.push(groq('llama-3.3-70b-versatile'));
  }
  return models;
}

export function isFinanceRateLimitError(e: unknown): boolean {
  return isRateLimit(e) || /quota|billing|exceeded your current/i.test(String((e as Error)?.message ?? e ?? ''));
}

export function hasFinanceAiConfigured(): boolean {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GROQ_API_KEY);
}

function trimPrompt(prompt: string) {
  if (prompt.length <= MAX_PROMPT_CHARS) return prompt;
  const head = Math.floor(MAX_PROMPT_CHARS * 0.65);
  const tail = MAX_PROMPT_CHARS - head - 48;
  return `${prompt.slice(0, head)}\n\n[...truncated for model limits...]\n\n${prompt.slice(-tail)}`;
}

function isRateLimit(e: unknown) {
  const err = e as { message?: string; statusCode?: number; status?: number };
  const msg = String(err?.message ?? '').toLowerCase();
  return (
    err?.statusCode === 429 ||
    err?.status === 429 ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('tpm') ||
    msg.includes('request too large')
  );
}

function isStructuredOutputError(e: unknown) {
  const msg = String((e as Error)?.message ?? '').toLowerCase();
  return msg.includes('json_schema') || msg.includes('response format') || msg.includes('structured');
}

function repairJsonText(text: string) {
  let raw = text.trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) raw = fenced[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) raw = raw.slice(start, end + 1);
  raw = raw.replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  raw = raw.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  return raw;
}

function extractJson(text: string) {
  return JSON.parse(repairJsonText(text));
}

function friendlyFinanceError(e: unknown): Error {
  const msg = String((e as Error)?.message ?? e ?? '');
  if (/quota|billing|exceeded your current/i.test(msg)) {
    return new Error(
      'AI quota exceeded and no balance-sheet table could be parsed from this file. Retry when quota resets, use a text-based PDF or Excel export, or Top 25 US.',
    );
  }
  if (/tpm|request too large|token/i.test(msg)) {
    return new Error(
      'This filing is too large for the AI model. Try an Excel export, or pick a company from Top 25 US.',
    );
  }
  if (isRateLimit(e)) {
    return new Error('Rate limit reached — wait a moment and try again, or use Top 25 US for instant reports.');
  }
  return e instanceof Error ? e : new Error(msg || 'Analysis failed.');
}

async function generateStructuredViaText<T extends z.ZodType>(opts: {
  schema: T;
  system: string;
  prompt: string;
}) {
  const models = getFinanceModels();
  const prompt = trimPrompt(opts.prompt);
  const jsonPrompt = `${prompt}

Respond with ONLY one JSON object. Use double-quoted keys and string values. Include every field required by the task.`;

  let lastError: unknown;
  for (const model of models) {
    try {
      const result = await generateText({
        model,
        system: `${opts.system}\n\nOutput a single valid JSON object. All keys required. Use double-quoted keys and strings.`,
        prompt: jsonPrompt,
        maxRetries: 0,
      });
      const parsed = extractJson(result.text);
      const validated = opts.schema.safeParse(parsed);
      if (validated.success) return validated.data;
      lastError = validated.error;
    } catch (e) {
      lastError = e;
      if (!isRateLimit(e)) continue;
    }
  }
  throw friendlyFinanceError(lastError ?? new Error('Could not generate structured output.'));
}

export async function generateStructuredObject<T extends z.ZodType>(opts: {
  schema: T;
  system: string;
  prompt: string;
}) {
  const models = getFinanceModels();
  if (models.length === 0) {
    throw new Error('No AI API keys configured. Add GROQ_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY.');
  }

  const prompt = trimPrompt(opts.prompt);
  let lastError: unknown;
  for (const model of models) {
    try {
      const result = await generateObject({
        model,
        schema: opts.schema,
        system: opts.system,
        prompt,
        maxRetries: 0,
      });
      return result.object;
    } catch (e) {
      lastError = e;
      if (isRateLimit(e)) continue;
      if (!isStructuredOutputError(e)) break;
    }
  }

  try {
    return await generateStructuredViaText({ ...opts, prompt });
  } catch (e) {
    throw friendlyFinanceError(e);
  }
}

export async function generateFinanceText(opts: { system: string; prompt: string }) {
  const models = getFinanceModels();
  if (models.length === 0) throw new Error('No AI API keys configured.');

  const prompt = trimPrompt(opts.prompt);
  let lastError: unknown;
  for (const model of models) {
    try {
      const result = await generateText({
        model,
        system: opts.system,
        prompt,
        maxRetries: 0,
      });
      return result.text;
    } catch (e) {
      lastError = e;
      if (!isRateLimit(e)) throw friendlyFinanceError(e);
    }
  }
  throw friendlyFinanceError(lastError ?? new Error('All models rate limited.'));
}
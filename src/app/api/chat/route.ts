// app/api/chat/route.ts
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createGroq } from '@ai-sdk/groq';
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai';
import { dashboardTools } from '@/ai/dashboard-tools';

export const runtime = 'edge';
export const maxDuration = 60;

type Mode = 'chat' | 'search' | 'code' | 'finance';

type FinanceReportContext = {
  report: Record<string, unknown>;
  metrics: Record<string, unknown>;
  analysis?: Record<string, unknown>;
};

function buildFinanceSystemPrompt(ctx: FinanceReportContext): string {
  return `You are Sweep Finance — a world-class equity research analyst. Answer questions using ONLY the ACTIVE REPORT, DERIVED METRICS, and PRE-COMPUTED ANALYSIS below.

RULES:
- Cite exact figures from the report. Never invent numbers.
- Reference the analysis when relevant; add depth beyond it when asked.
- Explain ratios with institutional rigor (liquidity, leverage, solvency, asset quality).
- If the answer is not in the data, say what is missing and what you'd need.
- Plain text only. No markdown bold or italic.
- Educational analysis only — not investment advice.
- Be specific, quantitative, and balanced like a sell-side research note.

ACTIVE REPORT:
${JSON.stringify(ctx.report)}

DERIVED METRICS:
${JSON.stringify(ctx.metrics)}

PRE-COMPUTED ANALYSIS:
${JSON.stringify(ctx.analysis ?? {})}`;
}

const CHAT_SYSTEM_PROMPT = `You are Sweep — a helpful AI assistant with dashboard tools. Answer naturally in plain text. Never use ** or * markdown.

Use visualization tools when they clearly help (charts, balance sheets, Zillow). Use plain text for simple questions.

TOOLS: showBarChart, showLineChart, showPieChart, showAreaChart, showComparison, showStats, showBalanceSheet, showPropertyPortfolio, searchZillowListings, showZillowProperty

IMPORTANT: Call tools via the tool API. Never write <function> tags or JSON in plain text.

Stocks: use showLineChart with title "Company (TICKER) Stock Price", unit "USD", chronological labels.

Known figures (use exactly):
AAPL year-end USD: 2018:39, 2019:73, 2020:132, 2021:178, 2022:130, 2023:193, 2024:250
US market cap 2024 (trillions USD): Apple 3.5, Microsoft 3.1, NVIDIA 3.0, Amazon 2.1, Alphabet 2.0, Meta 1.4
India market cap: Reliance ₹19L cr, TCS ₹13L cr, HDFC Bank ₹12L cr`;

const nemotronSystemPrompts: Record<Mode, string> = {
  chat: CHAT_SYSTEM_PROMPT,

  search: `You are Sweep Search - a precise research assistant that delivers comprehensive, well-structured answers.

YOUR ROLE:
- Provide accurate, in-depth answers grounded in your knowledge
- Structure responses clearly with key facts highlighted
- Cover multiple angles: background, current state, implications
- Cite specific figures, dates, names, and data points
- Distinguish what you know confidently vs. what may have changed

RESPONSE STYLE:
- Lead with the direct answer or key finding
- Follow with supporting facts, context, and analysis
- Use numbered lists or bullet points for multiple items
- Mention related topics or follow-up angles the user might care about
- Be thorough but not padded - quality over length

FORMATTING RULES:
- NO markdown bold (**) or italic (*) formatting
- Use plain text with - or • for lists
- Numbers and data should be precise
- Dates and sources add credibility

WHAT YOU EXCEL AT:
- Factual research on people, places, events, concepts
- Comparative analysis across topics
- Explaining complex subjects clearly
- Historical context and current relevance
- Technical and scientific explanations
- Business, finance, and market intelligence`,

  code: `You are Sweep Code - an expert programming assistant specializing in clean, efficient, production-ready code.

YOUR ROLE:
- Write correct, efficient, and maintainable code
- Explain your implementation choices clearly
- Follow language-specific best practices and idioms
- Debug issues with precise diagnosis
- Suggest architectural improvements when relevant

CODE QUALITY STANDARDS:
- Write clean, readable code with clear variable names
- Handle edge cases and error conditions appropriately
- Prefer idiomatic patterns for each language
- Include inline comments only where logic is non-obvious
- Write code that is easy to test and extend

RESPONSE STYLE:
- Lead with the solution, then explain
- Use code blocks for all code samples
- Explain why, not just what
- Point out potential pitfalls or gotchas
- Suggest alternatives when trade-offs exist

FORMATTING RULES:
- Always use proper code blocks with language tags
- Keep explanatory text concise
- NO markdown bold (**) or italic (*) outside code
- Number steps when walking through multi-part solutions

EXPERTISE:
- All major languages: Python, TypeScript/JavaScript, Rust, Go, Java, C++, etc.
- Frontend: React, Next.js, Vue, CSS/Tailwind
- Backend: Node.js, FastAPI, Django, Express, databases
- DevOps: Docker, CI/CD, cloud platforms
- Algorithms, data structures, system design
- Security best practices and performance optimization`,
};

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://sweep-app.vercel.app',
    'X-Title': 'Sweep',
  },
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

// OpenRouter/Gemini first — Groq free tier has tight TPM with long tool prompts.
function getModels() {
  const models = [];
  if (process.env.OPENROUTER_API_KEY) models.push(openrouter.chat('meta-llama/llama-3.3-70b-instruct:free'));
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) models.push(google('gemini-2.0-flash'));
  if (process.env.GROQ_API_KEY) models.push(groq('llama-3.3-70b-versatile'));
  return models;
}

function isRateLimit(e: any) {
  const msg = String(e?.message ?? e?.errorText ?? '').toLowerCase();
  return (
    e?.statusCode === 429 ||
    e?.status === 429 ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('quota') ||
    msg.includes('tpm')
  );
}

function getLastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== 'user') continue;
    return m.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ')
      .trim() ?? '';
  }
  return '';
}

type ChartShortcut = {
  match: RegExp;
  toolName: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  reply: string;
};

const CHART_SHORTCUTS: ChartShortcut[] = [
  {
    match: /\b(apple\s+stock|aapl|apple\s+stock\s+chart)\b/i,
    toolName: 'showLineChart',
    input: {
      title: 'Apple (AAPL) Stock Price',
      unit: 'USD',
      items: [
        { label: '2018', value: 39 },
        { label: '2019', value: 73 },
        { label: '2020', value: 132 },
        { label: '2021', value: 178 },
        { label: '2022', value: 130 },
        { label: '2023', value: 193 },
        { label: '2024', value: 250 },
      ],
    },
    output: {
      chartType: 'line',
      title: 'Apple (AAPL) Stock Price',
      unit: 'USD',
      data: [
        { label: '2018', value: 39 },
        { label: '2019', value: 73 },
        { label: '2020', value: 132 },
        { label: '2021', value: 178 },
        { label: '2022', value: 130 },
        { label: '2023', value: 193 },
        { label: '2024', value: 250 },
      ],
    },
    reply: 'Here is the Apple (AAPL) stock price chart from 2018 to 2024.',
  },
];

function findChartShortcut(userText: string): ChartShortcut | null {
  return CHART_SHORTCUTS.find((s) => s.match.test(userText)) ?? null;
}

function buildShortcutStream(shortcut: ChartShortcut) {
  const toolCallId = `shortcut-${Date.now()}`;
  const textId = 'txt-shortcut';

  const stream = createUIMessageStream({
    execute({ writer }) {
      writer.write({ type: 'start' });
      writer.write({ type: 'start-step' });
      writer.write({ type: 'tool-input-start', toolCallId, toolName: shortcut.toolName });
      writer.write({
        type: 'tool-input-available',
        toolCallId,
        toolName: shortcut.toolName,
        input: shortcut.input,
      });
      writer.write({ type: 'tool-output-available', toolCallId, output: shortcut.output });
      writer.write({ type: 'finish-step' });
      writer.write({ type: 'start-step' });
      writer.write({ type: 'text-start', id: textId });
      writer.write({ type: 'text-delta', id: textId, delta: shortcut.reply });
      writer.write({ type: 'text-end', id: textId });
      writer.write({ type: 'finish-step' });
      writer.write({ type: 'finish' });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

function streamChunkHasError(text: string) {
  return text.includes('"type":"error"') || text.includes('"type": "error"');
}

function streamChunkHasContent(text: string) {
  return (
    text.includes('tool-input-start') ||
    text.includes('tool-output-available') ||
    text.includes('"type":"text-delta"') ||
    text.includes('"type": "text-delta"')
  );
}

export async function POST(req: Request) {
  const {
    messages,
    mode = 'chat',
    reportContext,
  }: { messages: UIMessage[]; mode?: Mode; reportContext?: FinanceReportContext } = await req.json();

  if (mode === 'finance' && !reportContext?.report) {
    return new Response(JSON.stringify({ error: 'Finance mode requires an active report.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const models = getModels();
  if (models.length === 0) {
    return new Response(JSON.stringify({ error: 'No AI API keys configured.' }), { status: 500 });
  }

  const modelMessages = convertToModelMessages(messages);
  const isChat = mode === 'chat';
  const isFinance = mode === 'finance';

  if (isChat) {
    const shortcut = findChartShortcut(getLastUserText(messages));
    if (shortcut) {
      return buildShortcutStream(shortcut);
    }
  }

  for (const model of models) {
    try {
      const result = isChat
        ? streamText({
            model,
            system: nemotronSystemPrompts.chat,
            messages: modelMessages,
            tools: dashboardTools,
            stopWhen: stepCountIs(10),
            maxRetries: 0,
          })
        : isFinance
        ? streamText({
            model,
            system: buildFinanceSystemPrompt(reportContext!),
            messages: modelMessages,
            maxRetries: 0,
          })
        : streamText({
            model,
            system: nemotronSystemPrompts[mode as 'search' | 'code'],
            messages: modelMessages,
            maxRetries: 0,
          });

      const modelResponse = result.toUIMessageStreamResponse();
      if (!modelResponse.body) continue;

      // Tee the stream: peek branch detects errors, main branch goes to client.
      // tee() buffers so mainStream still has all chunks even after we read from peekStream.
      const [peekStream, mainStream] = modelResponse.body.tee();
      const reader = peekStream.getReader();
      let isStreamError = false;

      try {
        // Peek SSE stream (AI SDK v5) for early errors before committing to this model.
        for (let i = 0; i < 8; i++) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = new TextDecoder().decode(value);
          if (streamChunkHasError(text)) {
            isStreamError = true;
            break;
          }
          if (streamChunkHasContent(text)) break;
        }
      } catch (peekErr: any) {
        isStreamError = isRateLimit(peekErr);
        if (!isStreamError) { reader.releaseLock(); throw peekErr; }
      }

      reader.releaseLock();
      peekStream.cancel().catch(() => {});

      if (isStreamError) {
        console.warn('[Rate limit] Stream error detected, trying next model');
        mainStream.cancel().catch(() => {});
        continue;
      }

      return new Response(mainStream, { headers: modelResponse.headers });

    } catch (error: any) {
      if (isRateLimit(error)) {
        console.warn(`[Rate limit] Model failed, trying next. Error: ${error?.message}`);
        continue;
      }
      console.error('[Stream error]', error?.message);
      break;
    }
  }

  return new Response(
    JSON.stringify({ error: 'All models are rate limited. Please wait a moment and try again.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}

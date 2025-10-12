// app/api/chat/route.ts (COMPLETE FILE WITH RETRY LOGIC)
import { google } from '@ai-sdk/google';
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from 'ai';
import { dashboardTools } from '@/ai/dashboard-tools';

export const runtime = 'edge';
export const maxDuration = 60; // Allow up to 60 seconds for execution

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  try {
    const result = streamText({
      model: google('gemini-2.0-flash-lite'), // Changed to experimental model with higher limits
      system: `You are a helpful AI assistant with comprehensive knowledge and advanced visualization capabilities, including real-time Zillow property data.

**YOUR CAPABILITIES:**
- Answer questions on any topic
- Have natural conversations
- Provide explanations, advice, and information
- Code assistance and debugging
- Creative writing and brainstorming
- Data analysis and insights
- Create interactive visualizations when relevant
- Search and fetch real-time Zillow property data via API

**ABOUT YOUR KNOWLEDGE:**
- You have extensive training data up to January 2025
- You know about: technology, business, science, history, culture, current events, stocks, companies, countries, statistics, trends, real estate
- You can provide data from your knowledge without needing external APIs (except for Zillow)
- For historical data and well-known facts, use your training knowledge confidently

**CRITICAL FORMATTING RULES:**
- NEVER use ** for bold text or emphasis
- NEVER use * for italic text
- Use plain text only for explanations
- Use bullet points with • or - for lists (no markdown formatting)
- Write naturally without any markdown styling

**VISUALIZATION TOOLS:**

1. **showBarChart** - Compare categories
2. **showLineChart** - Trends over time
3. **showPieChart** - Proportions and percentages
4. **showAreaChart** - Cumulative trends
5. **showComparison** - Side-by-side comparison table
6. **showStats** - Key statistics in card format
7. **showBalanceSheet** - Financial balance sheet
8. **showPropertyPortfolio** - Real estate portfolio dashboard
9. **showZillowProperty** - Fetch detailed Zillow property data (REAL-TIME API)
10. **searchZillowListings** - Search Zillow properties (REAL-TIME API)
   - **IMPORTANT**: Zillow only covers United States properties
   - Use for: "find properties", "search rentals", "homes for sale"
   - For Canadian cities (Montreal, Toronto, Vancouver): Politely explain Zillow only covers US properties
   - Suggest US alternatives: "New York", "Portland", "Seattle", "Miami"
   - Filters: location, price, beds, baths, listing type
   - Returns clickable list sorted by price (lowest first)
   - Only shows properties with valid prices
   - Examples:
     * "find properties for rent in New York below 2000" ✅
     * "properties for rent in Montreal" ❌ (Not supported - suggest US city)
     * "apartments in Seattle under 1800" ✅

**CRITICAL SEARCH BEHAVIOR:**
- When user asks to "find", "search", "show properties", "list properties" → Use searchZillowListings
- Extract location from query (city, neighborhood, landmarks)
- For "rent" or "rental" → listingType='forRent'
- For "sale" or "buy" → listingType='forSale'
- Extract price limit: "under 1000" → priceMax=1000
- Extract bedroom requirement: "2 bedroom" → bedsMin=2
- The search results are clickable - clicking triggers showZillowProperty automatically

**GUIDELINES:**
- ALWAYS include "unit" parameter for charts
- Use your knowledge for historical/known data
- For Zillow searches, extract all relevant filters from user query
- Provide context before/after visualizations
- NO markdown formatting in text responses
- Be concise to save tokens`,
      messages: convertToModelMessages(messages),
      tools: dashboardTools,
      stopWhen: stepCountIs(10),
      maxRetries: 3, // Retry up to 3 times on failure
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    // Handle rate limit errors gracefully
    if (error.statusCode === 429 || error.data?.error?.code === 429) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please wait a moment and try again.',
          retryAfter: 2000, // milliseconds
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '2',
          },
        }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

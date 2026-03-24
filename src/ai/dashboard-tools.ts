// ai/dashboard-tools.ts (COMPLETE FILE)
import { tool, type ToolSet } from 'ai';
import { z } from 'zod';
import { normalizeBalanceSheetInput } from '@/utils/normalizeBalanceSheetInput';

export const dashboardTools = {
  showBarChart: tool({
    description: 'Display a bar chart for comparing values across categories',
    inputSchema: z.object({
      title: z.string().describe('Chart title'),
      unit: z.string().describe('Unit of measurement (e.g., "millions", "billions USD", "percent", "sq km")'),
      items: z.array(z.object({
        label: z.string().describe('Category label'),
        value: z.number().describe('Numeric value'),
      })).describe('Data points'),
    }),
    execute: async function ({ title, unit, items }) {
      return { chartType: 'bar', title, unit, data: items };
    },
  }),
  
  showLineChart: tool({
    description: 'Display a line chart for trends over time or continuous data',
    inputSchema: z.object({
      title: z.string().describe('Chart title'),
      unit: z.string().describe('Unit of measurement (e.g., "billions USD", "percent growth", "users")'),
      items: z.array(z.object({
        label: z.string().describe('X-axis label (year, month, date)'),
        value: z.number().describe('Y-axis value'),
      })).describe('Data points in order'),
    }),
    execute: async function ({ title, unit, items }) {
      return { chartType: 'line', title, unit, data: items };
    },
  }),
  
  showPieChart: tool({
    description: 'Display a pie chart for showing proportions and percentages of a whole',
    inputSchema: z.object({
      title: z.string().describe('Chart title'),
      unit: z.string().describe('Unit of measurement'),
      items: z.array(z.object({
        label: z.string().describe('Segment label'),
        value: z.number().describe('Segment value'),
      })).describe('Data segments'),
    }),
    execute: async function ({ title, unit, items }) {
      return { chartType: 'pie', title, unit, data: items };
    },
  }),
  
  showAreaChart: tool({
    description: 'Display an area chart for showing cumulative trends or volume over time',
    inputSchema: z.object({
      title: z.string().describe('Chart title'),
      unit: z.string().describe('Unit of measurement'),
      items: z.array(z.object({
        label: z.string().describe('X-axis label'),
        value: z.number().describe('Y-axis value'),
      })).describe('Data points'),
    }),
    execute: async function ({ title, unit, items }) {
      return { chartType: 'area', title, unit, data: items };
    },
  }),
  
  showComparison: tool({
    description: 'Display a comparison table with multiple metrics side by side',
    inputSchema: z.object({
      title: z.string().describe('Title of the comparison'),
      items: z.array(z.object({
        name: z.string().describe('Entity name'),
        metrics: z.record(z.string(), z.union([z.number(), z.string()])).describe('Key-value pairs of metrics'),
      })).describe('Items to compare'),
    }),
    execute: async function ({ title, items }) {
      return { title, items };
    },
  }),

  generateImage: tool({
    description: "Generate an image from a text prompt using Hugging Face FLUX.1-schnell (free).",
    inputSchema: z.object({
      prompt: z.string().describe("Detailed image prompt"),
    }),
    execute: async function({ prompt }) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (process.env.HUGGINGFACE_API_KEY) {
          headers['Authorization'] = `Bearer ${process.env.HUGGINGFACE_API_KEY}`;
        }

        const response = await fetch(
          'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell',
          {
            method: 'POST',
            headers,
            body: JSON.stringify({ inputs: prompt }),
          }
        );

        if (!response.ok) {
          if (response.status === 503) {
            return { error: "Image model is warming up — please try again in a few seconds." };
          }
          return { error: `Image generation failed (${response.status}). Please try again.` };
        }

        // Convert binary response to base64 data URL
        const arrayBuffer = await response.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunk = 8192;
        for (let i = 0; i < bytes.length; i += chunk) {
          binary += String.fromCharCode(...(bytes.slice(i, i + chunk) as any));
        }
        const base64 = btoa(binary);
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return { imageUrl: `data:${contentType};base64,${base64}`, prompt };
      } catch (error: any) {
        return { error: `Error generating image: ${error.message}` };
      }
    }
  }),
  
  
  showStats: tool({
    description: 'Display key statistics or metrics in a card layout',
    inputSchema: z.object({
      title: z.string().describe('Title for the stats section'),
      stats: z.array(z.object({
        label: z.string().describe('Stat label'),
        value: z.string().describe('Stat value'),
        change: z.string().optional().describe('Change indicator (e.g., "+5%")'),
      })).describe('Statistics to display'),
    }),
    execute: async function ({ title, stats }) {
      return { title, stats };
    },
  }),
  
  showBalanceSheet: tool({
    description: `
    Display a financial balance sheet. 
    IMPORTANT: Format all tool inputs as follows:
    assets: {
      current: [{ label: "Cash", value: 1000 }],
      nonCurrent: [{ label: "Property", value: 4000 }]
    },
    liabilities: {
      current: [{ label: "Accounts Payable", value: 500 }],
      nonCurrent: [{ label: "Long-term Debt", value: 1200 }]
    },
    equity: [{ label: "Shareholders' Equity", value: 3300 }]
    DO NOT use arrays for assets or liabilities directly. Always use an object with current/nonCurrent keys even if some are empty.
  `,
    inputSchema: z.object({
      title: z.string().describe('Balance sheet title (e.g., "Apple Inc. Balance Sheet Q4 2024")'),
      period: z.string().describe('Period (e.g., "Q4 2024", "FY 2023")'),
      currency: z.string().describe('Currency (e.g., "USD", "EUR")'),
      assets: z.object({
        current: z.array(z.object({
          label: z.string().describe('Asset name (e.g., "Cash and equivalents")'),
          value: z.number().describe('Value in specified currency'),
        })).describe('Current assets'),
        nonCurrent: z.array(z.object({
          label: z.string().describe('Asset name (e.g., "Property, plant and equipment")'),
          value: z.number().describe('Value in specified currency'),
        })).describe('Non-current assets'),
      }).describe('Assets breakdown'),
      liabilities: z.object({
        current: z.array(z.object({
          label: z.string().describe('Liability name (e.g., "Accounts payable")'),
          value: z.number().describe('Value in specified currency'),
        })).describe('Current liabilities'),
        nonCurrent: z.array(z.object({
          label: z.string().describe('Liability name (e.g., "Long-term debt")'),
          value: z.number().describe('Value in specified currency'),
        })).describe('Non-current liabilities'),
      }).describe('Liabilities breakdown'),
      equity: z.array(z.object({
        label: z.string().describe('Equity item (e.g., "Common stock", "Retained earnings")'),
        value: z.number().describe('Value in specified currency'),
      })).describe('Shareholders equity'),
    }),
    execute: async function (input) {
      // Always normalize the input (fix Gemini array-outputs)
      const { title, period, currency, equity } = input;
      const { assets, liabilities } = normalizeBalanceSheetInput(input);
      return { title, period, currency, assets, liabilities, equity };
    },
  
  }),
  
  showPropertyPortfolio: tool({
    description: 'Display a detailed property portfolio dashboard showing property information, owner details, valuation, and metrics. Use for real estate portfolio management.',
    inputSchema: z.object({
      properties: z.array(z.object({
        id: z.string().describe('Property ID'),
        ownerName: z.string().describe('Property owner name'),
        address: z.string().describe('Full property address'),
        propertyType: z.string().describe('Type: Residential, Commercial, Industrial, Land'),
        purchaseDate: z.string().describe('Date purchased (YYYY-MM-DD)'),
        purchasePrice: z.number().describe('Original purchase price'),
        currentValue: z.number().describe('Current market value'),
        bedrooms: z.number().optional().describe('Number of bedrooms (for residential)'),
        bathrooms: z.number().optional().describe('Number of bathrooms (for residential)'),
        squareFeet: z.number().describe('Property size in square feet'),
        yearBuilt: z.number().describe('Year the property was built'),
        status: z.string().describe('Status: Active, Rented, For Sale, Sold'),
        rentalIncome: z.number().optional().describe('Monthly rental income (if applicable)'),
      })).describe('Array of properties in the portfolio'),
    }),
    execute: async function ({ properties }) {
      return { properties };
    },
  }),
  showZillowProperty: tool({
    description: 'Fetch and display detailed Zillow property data including price, address, specifications, price history, agent info, and photos. Use when user provides a Zillow URL or asks about specific property details.',
    inputSchema: z.object({
      zillowUrl: z.string().describe('Full Zillow property URL (e.g., https://www.zillow.com/homedetails/...)'),
    }),
    execute: async function ({ zillowUrl }) {
      try {
        const apiKey = 'e2f9b74a-b7ba-49f4-9983-03c55908da92';
        
        // Ensure URL is complete
        let fullUrl = zillowUrl;
        if (!fullUrl.startsWith('http')) {
          fullUrl = 'https://www.zillow.com' + (fullUrl.startsWith('/') ? '' : '/') + fullUrl;
        }
        
        // URL encode for API
        const encodedUrl = encodeURIComponent(fullUrl);
        
        console.log('Fetching property:', fullUrl); // Debug log
        
        const response = await fetch(
          `https://api.hasdata.com/scrape/zillow/property?url=${encodedUrl}&extractAgentEmails=false`,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
          }
        );
  
        console.log('API Response status:', response.status); // Debug log
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error:', errorText);
          return { 
            error: `Failed to fetch property data (Status: ${response.status}). The property might not be available or the URL format is incorrect.`,
            zillowUrl: fullUrl
          };
        }
  
        const data = await response.json();
        
        console.log('API Response data:', data); // Debug log
        
        if (!data.property) {
          return { 
            error: 'No property data found. This property may have been removed from Zillow or is not accessible.',
            zillowUrl: fullUrl
          };
        }
  
        return {
          success: true,
          property: data.property,
          zillowUrl: fullUrl,
        };
      } catch (error: any) {
        console.error('Tool execution error:', error);
        return {
          error: `Error fetching property: ${error.message}. Please check the URL and try again.`,
          zillowUrl,
        };
      }
    },
  }),
  
  // ai/dashboard-tools.ts (UPDATE searchZillowListings tool only)

searchZillowListings: tool({
    description: 'Search for properties on Zillow based on location, price, beds, and other criteria. Use when user wants to find properties for rent or sale in a specific area.',
    inputSchema: z.object({
      location: z.string().describe('Location to search (e.g., "Montreal, QC", "New York, NY", "Old Port Montreal")'),
      listingType: z.enum(['forRent', 'forSale']).describe('Type of listing: forRent or forSale'),
      priceMin: z.number().optional().describe('Minimum price'),
      priceMax: z.number().optional().describe('Maximum price'),
      bedsMin: z.number().optional().describe('Minimum number of bedrooms'),
      bedsMax: z.number().optional().describe('Maximum number of bedrooms'),
      bathsMin: z.number().optional().describe('Minimum number of bathrooms'),
    }),
    execute: async function ({ location, listingType, priceMin, priceMax, bedsMin, bedsMax, bathsMin }) {
      try {
        const apiKey = 'e2f9b74a-b7ba-49f4-9983-03c55908da92';
        
        // Build query parameters
        const params = new URLSearchParams({
          keyword: location,
          type: listingType,
        });
        
        if (priceMin !== undefined) params.append('price_min', priceMin.toString());
        if (priceMax !== undefined) params.append('price_max', priceMax.toString());
        if (bedsMin !== undefined) params.append('beds_min', bedsMin.toString());
        if (bedsMax !== undefined) params.append('beds_max', bedsMax.toString());
        if (bathsMin !== undefined) params.append('baths_min', bathsMin.toString());
        
        const response = await fetch(
          `https://api.hasdata.com/scrape/zillow/listing?${params.toString()}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
          }
        );
  
        if (!response.ok) {
          return { 
            error: `Failed to search properties: ${response.status}`,
            searchCriteria: { location, listingType, priceMin, priceMax, bedsMin },
            properties: []
          };
        }
  
        const data = await response.json();
        
        if (!data.properties || data.properties.length === 0) {
          return { 
            error: 'No properties found matching your criteria',
            searchCriteria: { location, listingType, priceMin, priceMax, bedsMin },
            properties: []
          };
        }
  
        // CLIENT-SIDE FILTERING - Remove invalid properties
        let filteredProperties = data.properties.filter((prop: any) => {
          // Must have a valid price
          if (!prop.price || prop.price === null || isNaN(prop.price)) {
            return false;
          }
  
          // Must be within price range
          if (priceMin !== undefined && prop.price < priceMin) {
            return false;
          }
          if (priceMax !== undefined && prop.price > priceMax) {
            return false;
          }
  
          // Must meet bedroom requirements
          if (bedsMin !== undefined && prop.beds && prop.beds < bedsMin) {
            return false;
          }
          if (bedsMax !== undefined && prop.beds && prop.beds > bedsMax) {
            return false;
          }
  
          // Must meet bathroom requirements
          if (bathsMin !== undefined && prop.baths && prop.baths < bathsMin) {
            return false;
          }
  
          return true;
        });
  
        // Sort by price (lowest first)
        filteredProperties.sort((a: any, b: any) => a.price - b.price);
  
        // Limit to 20 results
        filteredProperties = filteredProperties.slice(0, 20);
  
        if (filteredProperties.length === 0) {
          return { 
            error: 'No properties found matching your exact criteria. Try adjusting your filters.',
            searchCriteria: { location, listingType, priceMin, priceMax, bedsMin },
            properties: []
          };
        }
  
        return {
          success: true,
          properties: filteredProperties,
          totalResults: filteredProperties.length,
          searchCriteria: { location, listingType, priceMin, priceMax, bedsMin },
        };
      } catch (error: any) {
        return {
          error: `Error searching properties: ${error.message}`,
          searchCriteria: { location, listingType },
          properties: []
        };
      }
    },
  }),
  
} satisfies ToolSet;

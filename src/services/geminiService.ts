import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

/**
 * Initialize Google GenAI with the API key from environment variables.
 */
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

/**
 * Represents a single financial data point.
 */
export interface FinanceData {
  name: string;
  value: string;
  change: string;
  unit: string;
  lastUpdated: string;
  description: string;
}

/**
 * Represents the full structure of the dashboard data.
 */
export interface DashboardData {
  exchangeRate: FinanceData;
  oilPrices: {
    wti: FinanceData;
    brent: FinanceData;
    dubai: FinanceData;
  };
  kospi: FinanceData;
  kosdaq: FinanceData;
  nasdaq: FinanceData;
  goldPrice: FinanceData;
}

/**
 * Fetches the latest financial data using Gemini AI with Google Search grounding.
 * Includes retry logic for robustness.
 * 
 * @param lang - The language for the trend descriptions ('ko' or 'en').
 * @param retries - Number of retry attempts in case of failure.
 * @returns A promise that resolves to DashboardData.
 */
export async function fetchFinanceData(lang: 'ko' | 'en' = 'en', retries = 2): Promise<DashboardData> {
  // Security check for API key
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing. Please configure it in the environment.");
  }

  // Construct the prompt for Gemini
  const prompt = `
    Get the most recent financial data for:
    1. USD/KRW Exchange Rate
    2. International Oil Prices (WTI, Brent, Dubai) in USD/barrel
    3. KOSPI Index
    4. KOSDAQ Index
    5. NASDAQ Composite Index
    6. International Gold Price (USD/oz)
    
    Provide the data in a structured JSON format including the current value, daily change (percentage or absolute), unit, and a brief 1-sentence description of the current trend.
    The description MUST be in ${lang === 'ko' ? 'Korean' : 'English'}.
  `;

  try {
    // Call Gemini API with specific configuration and schema
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        tools: [{ googleSearch: {} }], // Use Google Search for real-time data
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            exchangeRate: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                change: { type: Type.STRING },
                unit: { type: Type.STRING },
                lastUpdated: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "value", "change", "unit", "lastUpdated", "description"],
            },
            oilPrices: {
              type: Type.OBJECT,
              properties: {
                wti: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    change: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    lastUpdated: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["name", "value", "change", "unit", "lastUpdated", "description"],
                },
                brent: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    change: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    lastUpdated: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["name", "value", "change", "unit", "lastUpdated", "description"],
                },
                dubai: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.STRING },
                    change: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    lastUpdated: { type: Type.STRING },
                    description: { type: Type.STRING },
                  },
                  required: ["name", "value", "change", "unit", "lastUpdated", "description"],
                },
              },
              required: ["wti", "brent", "dubai"],
            },
            kospi: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                change: { type: Type.STRING },
                unit: { type: Type.STRING },
                lastUpdated: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "value", "change", "unit", "lastUpdated", "description"],
            },
            kosdaq: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                change: { type: Type.STRING },
                unit: { type: Type.STRING },
                lastUpdated: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "value", "change", "unit", "lastUpdated", "description"],
            },
            nasdaq: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                change: { type: Type.STRING },
                unit: { type: Type.STRING },
                lastUpdated: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "value", "change", "unit", "lastUpdated", "description"],
            },
            goldPrice: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                value: { type: Type.STRING },
                change: { type: Type.STRING },
                unit: { type: Type.STRING },
                lastUpdated: { type: Type.STRING },
                description: { type: Type.STRING },
              },
              required: ["name", "value", "change", "unit", "lastUpdated", "description"],
            },
          },
          required: ["exchangeRate", "oilPrices", "kospi", "kosdaq", "nasdaq", "goldPrice"],
        },
      },
    });

    // Parse the JSON response from Gemini
    const data = JSON.parse(response.text || "{}");
    return data as DashboardData;
  } catch (error) {
    // Retry logic for robustness against transient API errors
    if (retries > 0) {
      console.warn(`Fetch failed, retrying... (${retries} left)`);
      return fetchFinanceData(lang, retries - 1);
    }
    console.error("Failed to fetch or parse Gemini response after retries:", error);
    throw new Error("Failed to fetch financial data");
  }
}

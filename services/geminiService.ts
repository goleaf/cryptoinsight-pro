import { GoogleGenAI, Type } from "@google/genai";
import { CoinData, PredictionResult } from "../types";

// Initialize Gemini
// NOTE: In a real production app, you should not expose API keys on the client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketPrediction = async (
  marketData: CoinData[]
): Promise<PredictionResult> => {
  try {
    const marketSummary = marketData
      .map(
        (c) =>
          `${c.symbol}: $${c.price.toFixed(2)} (${c.changePercent.toFixed(
            2
          )}%) Vol: ${c.volume.toFixed(0)}`
      )
      .join("\n");

    const prompt = `
      You are a Senior Crypto Market Analyst and Risk Manager.
      Your task is to analyze the provided cryptocurrency market data and identify a notable technical setup or trend.

      Market Data:
      ${marketSummary}

      Guidelines:
      1.  **Objective Analysis**: Focus on technical indicators (Volume, Price Action, Support/Resistance). Do NOT use hype, slang, or "moon" terminology.
      2.  **Risk Management**: Always highlight potential risks.
      3.  **Persona**: Professional, concise, analytical, and cautious.
      4.  **Language**: RUSSIAN (Professional Financial Tone).

      Task:
      Identify ONE asset that shows a clear technical signal (Bullish or Bearish).
      Provide a reasoned analysis based on the data.

      Return a JSON object strictly adhering to the schema provided.
      - 'action': Signal based on technicals (BUY, SELL, HOLD).
      - 'riskLevel': LOW (Stable), MEDIUM (Standard), HIGH (Volatile), SPECULATIVE (Very High Risk).
      - 'confidence': 0-100 (Based on technical signal clarity).
      - 'reasoning': A clear, professional explanation in RUSSIAN citing data points (e.g., "High volume breakout", "Rejecting resistance at $X").
      - 'targetPrice': A realistic technical target based on recent price action.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            coin: { type: Type.STRING },
            action: { type: Type.STRING, enum: ["BUY", "SELL", "HOLD"] },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            riskLevel: {
              type: Type.STRING,
              enum: ["LOW", "MEDIUM", "HIGH", "SPECULATIVE"],
            },
            targetPrice: { type: Type.STRING },
          },
          required: [
            "coin",
            "action",
            "confidence",
            "reasoning",
            "riskLevel",
            "targetPrice",
          ],
        },
        thinkingConfig: { thinkingBudget: 1024 },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as PredictionResult;
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback in case of error
    return {
      coin: "BTC",
      action: "HOLD",
      confidence: 0,
      reasoning: "Данные рынка в данный момент недоступны для детального анализа. Рекомендуется воздержаться от активных действий.",
      riskLevel: "HIGH",
      targetPrice: "---",
    };
  }
};
import { GoogleGenAI } from "@google/genai";
import { Scenario, AssetPool, Tranche } from '@/core/types';

// Safely initialize the AI client
const apiKey = process.env.API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const analyzeDealStructure = async (
  pool: AssetPool,
  tranches: Tranche[],
  scenario: Scenario
): Promise<string> => {
  if (!ai) return "Gemini API Key not configured. Please add an API Key to metadata/environment.";

  const prompt = `
    Act as a senior structured credit analyst specializing in the Indian market (PTCs/ABS).
    Analyze the following deal structure:

    Asset Pool:
    - Principal: ₹${pool.principalBalance.toLocaleString()}
    - WAC: ${pool.wac}%
    - WAM: ${pool.wam} months

    Tranche Structure:
    ${tranches.map(t => `- ${t.name} (${t.type}): ₹${t.originalBalance.toLocaleString()} @ ${t.coupon}% (${t.rating})`).join('\n')}

    Scenario Assumptions:
    - CPR (Prepayment): ${scenario.cpr}%
    - CDR (Default): ${scenario.cdr}%
    - Severity: ${scenario.severity}%

    Please provide:
    1. A brief commentary on the Credit Enhancement (CE) levels.
    2. Risks associated with the Equity tranche given the CDR assumption.
    3. How this compares to typical Indian MFI or Auto Loan securitizations.
    4. Keep the response concise (under 200 words) and professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to generate analysis due to an API error.";
  }
};

export const suggestOptimizations = async (
  pool: AssetPool,
  tranches: Tranche[]
): Promise<string> => {
    if (!ai) return "Gemini API Key not configured.";

    const prompt = `
      Given the following structured finance deal in India:
      Pool WAC: ${pool.wac}%
      Senior Tranche Coupon: ${tranches.find(t => t.type === 'Senior')?.coupon || 0}%
      
      Suggest 2-3 ways to optimize the tranche sizing or coupon stack to maximize the issuer's arbitrage (excess spread) while maintaining rating stability.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "No suggestions generated.";
    } catch (error) {
        console.error("Gemini Suggestion Error:", error);
        return "Failed to generate suggestions.";
    }
}

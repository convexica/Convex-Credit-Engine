import { Scenario, AssetPool, Tranche } from '@/types';

export const analyzeDealStructure = async (
  pool: AssetPool,
  tranches: Tranche[],
  scenario: Scenario
): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/analyze', {
      method: 'POST',
      body: JSON.stringify({ pool, tranches, scenario }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        const errorData = await response.json();
        return errorData.error || "Failed to generate analysis.";
    }

    const { text } = await response.json();
    return text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Failed to connect to AI server. Please check your network or try again later.";
  }
};

export const suggestOptimizations = async (
  pool: AssetPool,
  tranches: Tranche[]
): Promise<string> => {
  try {
    const response = await fetch('/.netlify/functions/optimize', {
        method: 'POST',
        body: JSON.stringify({ pool, tranches }),
        headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
        const errorData = await response.json();
        return errorData.error || "Failed to generate suggestions.";
    }

    const { text } = await response.json();
    return text || "No suggestions generated.";
  } catch (error) {
    console.error("Gemini Suggestion Error:", error);
    return "Failed to connect to AI server.";
  }
}

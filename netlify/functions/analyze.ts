const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_URL = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(GEMINI_URL(apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(data?.error?.message || `Gemini API error ${response.status}`);
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

export const handler = async (event: any) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.CONVEX_GEMINI_KEY || "";
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "AI service is not configured." }) };
  }

  try {
    const { pool, tranches, scenario } = JSON.parse(event.body);

    const prompt = `
      Act as a senior structured credit analyst specializing in the Indian market (PTCs/ABS).
      Analyze the following deal structure:

      Asset Pool:
      - Principal: ₹${pool.principalBalance.toLocaleString()}
      - WAC: ${pool.wac}%
      - WAM: ${pool.wam} months

      Tranche Structure:
      ${tranches.map((t: any) => `- ${t.name} (${t.type}): ₹${t.originalBalance.toLocaleString()} @ ${t.coupon}% (${t.rating})`).join('\n')}

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

    const text = await callGemini(apiKey, prompt);
    return { statusCode: 200, body: JSON.stringify({ text: text || "No analysis generated." }) };
  } catch (error: any) {
    console.error("[analyze] Gemini error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate analysis. Please try again." }) };
  }
};

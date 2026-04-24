const GEMINI_MODEL = "gemini-pro";
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
    console.error("[Gemini API Error]", data?.error);
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
    console.warn("[optimize] Warning: CONVEX_GEMINI_KEY is missing from environment.");
    return { statusCode: 500, body: JSON.stringify({ error: "AI service is not configured (Missing API Key)." }) };
  }

  try {
    const { pool, tranches } = JSON.parse(event.body);

    const seniorCoupon = tranches.find((t: any) => t.type === 'Senior')?.coupon || 0;
    const prompt = `
      Given the following structured finance deal in India:
      Pool WAC: ${pool.wac}%
      Senior Tranche Coupon: ${seniorCoupon}%
      
      Suggest 2-3 ways to optimize the tranche sizing or coupon stack to maximize the issuer's arbitrage (excess spread) while maintaining rating stability. Be concise and professional.
    `;

    const text = await callGemini(apiKey, prompt);
    return { statusCode: 200, body: JSON.stringify({ text: text || "No suggestions generated." }) };
  } catch (error: any) {
    console.error("[optimize] Gemini error:", error.message);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate suggestions. Please try again." }) };
  }
};

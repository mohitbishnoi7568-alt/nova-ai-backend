const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

function cleanHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .filter(item =>
      item &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    )
    .slice(-20)
    .map(item => ({
      role: item.role === "assistant" ? "model" : "user",
      parts: [{ text: item.content.slice(0, 12000) }]
    }));
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured in Vercel."
    });
  }

  try {
    const body = req.body || {};
    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return res.status(400).json({ error: "message is required" });
    }

    const contents = [
      ...cleanHistory(body.history),
      { role: "user", parts: [{ text: message }] }
    ];

    const payload = {
      systemInstruction: {
        parts: [{
          text: `You are NOVA, Mohit's personal AI assistant.
Be friendly, intelligent, calm, helpful, and natural.
Reply in Hindi when the user speaks Hindi, Hinglish when they use Hinglish, and English when they speak English.
Help with general knowledge, studies, explanations, writing, translation, brainstorming, and everyday questions.
Answer directly. Keep simple answers concise and provide details when asked.
Never claim to perform phone actions unless the Android app actually performs them.
Never claim permissions or background microphone access you do not have.
You are NOVA, an original AI assistant.`
        }]
      },
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    };

    if (body.useWeb === true) {
      payload.tools = [{ google_search: {} }];
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API error:",
        response.status,
        data?.error?.message || "Unknown error"
      );

      return res.status(response.status === 429 ? 429 : 502).json({
        error: response.status === 429
          ? "Gemini quota/rate limit reached. Please try again later."
          : "Gemini AI request failed. Check Vercel logs for details."
      });
    }

    const reply = (data?.candidates?.[0]?.content?.parts || [])
      .map(part => typeof part.text === "string" ? part.text : "")
      .join("")
      .trim();

    if (!reply) {
      return res.status(502).json({
        error: "AI returned an empty response."
      });
    }

    return res.status(200).json({ reply, model: MODEL });
  } catch (error) {
    console.error("NOVA backend error:", error?.message || error);
    return res.status(500).json({
      error: "NOVA AI request failed."
    });
  }
}

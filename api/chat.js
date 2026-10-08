
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MODEL = process.env.OPENAI_MODEL || "gpt-6-astra";
const ALLOWED_ORIGIN =
  process.env.ALLOWED_ORIGIN || "*";

function setCors(res) {
  res.setHeader(
    "Access-Control-Allow-Origin",
    ALLOWED_ORIGIN
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  res.setHeader("Vary", "Origin");
}

function cleanHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter(
      item =>
        item &&
        (item.role === "user" ||
          item.role === "assistant") &&
        typeof item.content === "string"
    )
    .slice(-20)
    .map(item => ({
      role: item.role,
      content: item.content.slice(0, 12000)
    }));
}

export default async function handler(req, res) {

  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST required"
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is not configured."
    });
  }

  try {

    const body = req.body || {};

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return res.status(400).json({
        error: "message is required"
      });
    }

    const history =
      cleanHistory(body.history);

    const useWeb =
      body.useWeb === true;

    const input = [
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    const params = {
      model: MODEL,

      instructions: `
You are NOVA, Mohit's personal AI assistant.

Personality:
- Friendly
- Futuristic
- Intelligent
- Calm
- Helpful
- Slightly witty when appropriate

Language:
- Reply in Hindi when the user speaks Hindi.
- Reply in Hinglish when the user uses Hinglish.
- Reply in English when the user speaks English.
- Understand Hindi, Hinglish and English naturally.

Capabilities:
- Answer general knowledge questions.
- Explain concepts.
- Solve problems.
- Help with studies.
- Write and rewrite text.
- Translate languages.
- Brainstorm ideas.
- Have normal conversations.
- Give step-by-step instructions.
- Answer current-information questions when web search is enabled.

Important:
Do not claim that you performed a phone action unless the Android app actually performed it.
Do not claim to have permissions that you do not have.
Do not claim background microphone access unless the Android app actually provides it.

Answer the user's actual question directly.
Keep simple answers concise.
Give detailed answers when the user asks for detail.

You are an original AI assistant called NOVA.
Do not pretend to be a movie character.
`,

      input,

      reasoning: {
        effort: "low"
      }
    };

    if (useWeb) {
      params.tools = [
        {
          type: "web_search"
        }
      ];
    }

    const response =
      await client.responses.create(params);

    const reply =
      (response.output_text || "").trim();

    if (!reply) {
      return res.status(502).json({
        error: "AI returned an empty response."
      });
    }

    return res.status(200).json({
      reply: reply,
      model: response.model || MODEL
    });

  } catch (error) {

    console.error(
      "NOVA backend error:",
      error
    );

    return res.status(500).json({
      error: "NOVA AI request failed."
    });
  }
}

import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
const model = process.env.OPENAI_MODEL || 'gpt-6-astra';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST required' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: 'OPENAI_API_KEY is not configured on the server.'
    });
  }

  try {
    const { message, history = [], useWeb = false } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter(
            x =>
              x &&
              ['user', 'assistant'].includes(x.role) &&
              typeof x.content === 'string'
          )
      : [];

    const instructions = `
You are NOVA, Mohit's personal AI assistant.

Personality:
- Calm
- Futuristic
- Friendly
- Helpful
- Respectful
- Slightly witty when appropriate
- Concise by default

Speak naturally in Hindi/Hinglish when the user does.

Answer general questions clearly and naturally.

Do not pretend that you performed an Android action unless the client confirms it.

Never claim background microphone access, permissions, phone control, or device control that you do not actually have.

If the user asks for dangerous or illegal activity, refuse and redirect safely.
`;

    const input = [
      ...safeHistory.map(x => ({
        role: x.role,
        content: x.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const params = {
      model,
      instructions,
      input
    };

    if (useWeb) {
      params.tools = [{ type: 'web_search' }];
    }

    const response = await client.responses.create(params);

    return res.status(200).json({
      reply:
        response.output_text ||
        'माफ़ करना, अभी जवाब नहीं बन पाया।',
      model
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: 'NOVA backend request failed.'
    });
  }
}

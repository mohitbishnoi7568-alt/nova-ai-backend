# NOVA AI Backend — Vercel + OpenAI

This is the secure backend for the NOVA GitHub Pages website. The OpenAI API key stays on the server as an environment variable and is never placed in browser JavaScript.

## Deploy from phone

1. Create a new GitHub repository, for example `nova-ai-backend`.
2. Upload ALL files from this folder, including the `api` folder and `package.json`.
3. Open Vercel and import that GitHub repository.
4. In Vercel Project Settings → Environment Variables, add:
   - `OPENAI_API_KEY` = your secret API key
   - `OPENAI_MODEL` = `gpt-6-astra` (or another model available to your account)
   - `ALLOWED_ORIGIN` = `https://mohitbishnoi7568-alt.github.io`
5. Deploy / redeploy after saving the variables.
6. Your endpoint will be: `https://YOUR-VERCEL-DOMAIN.vercel.app/api/chat`
7. Put that endpoint into the NOVA website config as `NOVA_BACKEND_URL`.

IMPORTANT: Never paste the API key into `script.js`, `index.html`, GitHub Pages, or chat. If a key is ever exposed, revoke/rotate it immediately.

## API request

POST /api/chat
Content-Type: application/json

{
  "message": "NOVA, black hole kya hota hai?",
  "history": [],
  "useWeb": false
}

Response:
{"reply":"...","model":"..."}

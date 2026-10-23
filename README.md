# Nudge — Socratic Study Bot

A temporary, hint-first AI tutor built with Next.js and TypeScript. Includes three answer modes and browser-native voice typing.

## Free-first design

- **No user accounts, database, or saved chat history.** Conversation state lives in React memory and disappears on refresh/closing the tab.
- **Voice typing** uses the browser's built-in Web Speech API where supported. Browser/vendor support varies; Chrome or Edge is recommended. Microphone permission is required.
- **AI** uses Google's Gemini API. Check the current free-tier availability and quotas for your account/model before launch: https://ai.google.dev/gemini-api/docs/pricing
- **Hosting** can use Vercel's free Hobby plan for eligible personal projects: https://vercel.com/pricing
- No paid APIs are required by the app code, but free quotas and service terms can change. Public use is not guaranteed to remain unlimited or available at zero cost.

## Run locally

Requirements: Node.js 18.17+ and npm.

1. Create a Gemini API key at https://aistudio.google.com/app/apikey.
2. Copy `.env.example` to `.env.local`.
3. Put your key in `.env.local`:
   ```env
   GEMINI_API_KEY=your_key_here
   ```
4. Install dependencies and start:
   ```bash
   npm install
   npm run dev
   ```
5. Open http://localhost:3000.

**Never put `GEMINI_API_KEY` in a `NEXT_PUBLIC_` variable or in client-side code.**

## Deploy to GitHub + Vercel

1. Create an empty repository on GitHub.
2. Unzip this project, then in its folder run:
   ```bash
   git init
   git add .
   git commit -m "Build Nudge study chatbot"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git push -u origin main
   ```
3. Sign in to Vercel and import that GitHub repository.
4. In Vercel → Project → Settings → Environment Variables, add `GEMINI_API_KEY` for Preview and Production (and Development if desired).
5. Deploy. If you change environment variables, redeploy for them to take effect.

## Answer modes

- **Short Hints**: one concise sentence, avoids the final answer.
- **Long Hints**: conceptual explanation and guided reasoning without the final solution.
- **Complete Answer**: direct answer allowed only after the user selects this mode.

These are strong prompting instructions, not a mathematical guarantee. An AI model can occasionally ignore constraints, so test it with representative questions before sharing it widely.

## Important limitations and safety

- This is broad AI tutoring, **not a live search engine**. It does not browse the entire internet, and it may be outdated or incorrect. Adding web search would require a separate source/API and could introduce more limits.
- The API route applies a best-effort in-memory limit of 25 requests per IP per hour. Serverless instances may not share this memory, so it is not a robust public abuse-prevention system. Use provider-side quotas as the primary usage control.
- This starter uses `gemini-3.5-flash-lite`, a current lightweight model listed in Google's model docs at the time this starter was prepared. Model availability and free quotas can change; if needed, update the model name in `app/api/chat/route.ts` to a currently available model in your AI Studio account.
- The free allowance is shared at the API-key/project level, so public users can consume it. Do not expose the API key. For a public deployment, set the smallest practical provider quota and monitor usage.
- User questions are sent to Google's API for processing. “Temporary chat” means this app does not store chat history in its own database; it does not mean the AI provider never processes or retains submitted data.
- This is a starter implementation. Review provider policies and your deployment settings before using it with children, schools, or sensitive student data.

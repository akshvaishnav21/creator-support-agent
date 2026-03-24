# CreatorIQ

AI-powered tools for YouTube creators, built with Next.js and Google Gemini. Deploy to Vercel in one click — no backend API keys required.

## Tools

| Tool | What it does |
|---|---|
| **Sponsorship Fit Analyzer** | Paste a transcript + comments → get audience profile, 4 ranked sponsorship categories, and 5 brand suggestions with pitch angles |
| **Comment Intelligence** | Paste audience comments → get topic clusters, sentiment breakdown, 5 future video ideas, top complaints, and appreciation highlights |
| **Hook & Title Factory** | Enter a video concept → get 15 title/hook variations grouped by psychological principle (curiosity gap, listicle, story, etc.) |

## Browser Extension

A Chrome extension is included (`/extension`) that lets you import YouTube transcripts and comments with one click — directly from any YouTube video page.

## Getting Started

### 1. Get a free Gemini API key

Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and generate a free API key. No credit card required.

### 2. Clone and install

```bash
git clone https://github.com/akshvaishnav21/creator-support-agent.git
cd creator-support-agent
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), go to **Settings**, and paste your Gemini API key. That's it — no `.env` file needed.

### 3. Install the Chrome extension (optional)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the `/extension` folder from this repo

The extension will appear in your toolbar. Visit any YouTube video to import transcript and comments directly into CreatorIQ.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/akshvaishnav21/creator-support-agent)

No environment variables required. Users bring their own Gemini API key.

After deploying, update `APP_URL` in `extension/popup.js` to your Vercel URL so the extension opens the correct app.

## Architecture

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **AI**: Google Gemini (`gemini-2.0-flash`) via `@google/generative-ai`
- **Auth model**: BYOK — users supply their own Gemini API key, stored in `localStorage`
- **Data**: Completely stateless — nothing stored server-side
- **Extension**: Chrome Manifest V3

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Google Generative AI SDK](https://github.com/google-gemini/generative-ai-js)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

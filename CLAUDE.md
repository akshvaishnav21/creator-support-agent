# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start dev server at http://localhost:3000
npm run build     # production build
npm run start     # start production server
npm run lint      # ESLint check (uses next/core-web-vitals)
```

No test suite is configured. Playwright is available as a devDependency for visual auditing (`screenshots/audit.mjs`).

## Architecture

**CreatorIQ** is a Next.js 14 (App Router) app providing AI-powered tools for YouTube creators, plus a general-purpose Creator Chat. It is fully stateless server-side — no database, no server-stored secrets.

### Auth / API Key Model (BYOK)

Users supply their own Gemini API key via `/settings`. It is stored in `localStorage` under `creatoriq_gemini_key`. An optional YouTube Data API key is stored under `creatoriq_yt_key` (used for auto-fetching video data by URL). Every API route receives the key in the POST body (`{ apiKey, ... }`) and instantiates a Gemini client per-request via `lib/gemini.ts`. The `ApiKeyGate` component blocks access to tool pages until a Gemini key is set.

### Shared Libraries

| File | Purpose |
|---|---|
| `lib/gemini.ts` | Exports `GEMINI_MODEL` constant (`gemini-3-flash-preview`) and `getGeminiClient()` factory |
| `lib/types.ts` | All TypeScript interfaces for AI response shapes |
| `lib/api-utils.ts` | `safeParseJSON()` (strips markdown fences), `truncate()`, `INPUT_LIMITS` (15K chars for captions/comments) |
| `lib/hooks.ts` | `useApiCall()` hook (fetch + 180s AbortController timeout + error handling), `getGeminiKey()` |

### API Routes

| Route | Tool | Key param |
|---|---|---|
| `/api/analyze-sponsorship` | Sponsorship Fit Analyzer | `apiKey` (Gemini) |
| `/api/analyze-comments` | Comment Intelligence | `apiKey` (Gemini) |
| `/api/generate-titles` | Hook & Title Factory | `apiKey` (Gemini) |
| `/api/chat` | Creator Chat | `apiKey` (Gemini) |
| `/api/generate-email` | Outreach email generation | `apiKey` (Gemini) |
| `/api/search-brands` | Brand contact page search (uses Gemini grounding) | `apiKey` (Gemini) |
| `/api/youtube/fetch` | YouTube data fetch | `ytApiKey` (YouTube Data API v3) |

All AI routes use `gemini-3-flash-preview` via the shared `GEMINI_MODEL` constant. JSON routes use `responseMimeType: "application/json"` and parse responses via `safeParseJSON()`. All inputs are truncated server-side via `INPUT_LIMITS` (15K chars per field).

### Dashboard UI Pattern

All tool components follow the same layout pattern:
- **Input state**: centered form at `max-w-3xl` with color-themed CTA button
- **Results state**: form hides, container expands to `max-w-7xl` full-width dashboard
- "New Analysis" back button + "Clear Results" button replace the form
- Each tool has its own color theme: blue (Sponsorship), purple (Comments), orange (Titles)

### YouTube Data Fetching

`/api/youtube/fetch` calls YouTube Data API v3 for video metadata and comments (with `textFormat=plainText` for clean text). Captions are fetched by scraping the YouTube watch page HTML using a brace-counting JSON extractor for `ytInitialPlayerResponse`, then fetching caption track URLs. YouTube blocks server-side timedtext requests, so captions may return empty — the response includes `captionsAvailable: boolean` so the UI can show a warning. The Chrome extension fetches captions reliably from the browser.

### Chrome Extension

`/extension` is a Manifest V3 Chrome extension with CIQ monogram icons. Features:
- **Content script** (`content-script.js`): Runs in `MAIN` world on `youtube.com/watch*`. Extracts captions from 3 sources (ytInitialPlayerResponse, ytplayer.bootstrapPlayerResponse, movie_player.getPlayerResponse). Scrapes comments from DOM. Re-collects on SPA navigation.
- **Popup** (`popup.html/popup.js`): Shows video title, data badges (captions word count, comment count), Copy Captions/Copy Comments buttons, Refresh button, and color-coded tool launch buttons that pass data via URL params.
- `APP_URL` constant in `popup.js` must be updated to your deployed URL.

### Dark Mode

Tailwind `class` strategy with flash-free blocking `<script>` in `layout.tsx`. Theme stored in `creatoriq_theme` localStorage key.

### Analysis Persistence

Each tool persists its last analysis to localStorage (`creatoriq_last_sponsorship`, `creatoriq_last_comments`, `creatoriq_last_titles`). Results survive page reloads. A "Clear Results" button removes them.

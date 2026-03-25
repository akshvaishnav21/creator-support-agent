# CreatorIQ — Architecture & Design

## System Architecture

```
┌─────────────────────────────────────────────────┐
│              Chrome Extension (MV3)              │
│                                                  │
│  content-script.js (MAIN world)                  │
│    ├─ Extracts captions via 3 sources:           │
│    │  ytInitialPlayerResponse,                   │
│    │  ytplayer.bootstrapPlayerResponse,           │
│    │  movie_player.getPlayerResponse()            │
│    ├─ Scrapes comments from DOM (up to 100)      │
│    ├─ Auto-scrolls to trigger lazy load          │
│    └─ Exposes window.__creatoriq                 │
│                                                  │
│  popup.html / popup.js                           │
│    ├─ Data badges (captions/comments status)     │
│    ├─ Copy Captions / Copy Comments buttons      │
│    ├─ Refresh data button                        │
│    ├─ Color-coded tool launch buttons            │
│    └─ Passes data via URL params to web app      │
│                                                  │
│  background.js (service worker)                  │
│    └─ Minimal: handles extension lifecycle       │
│                                                  │
│  icons/ (CIQ monogram, 16/48/128px)             │
└──────────────────┬──────────────────────────────┘
                   │ Opens web app URL with
                   │ ?videoUrl= and optional
                   │ &captions=...&comments=...
                   ▼
┌─────────────────────────────────────────────────┐
│           Next.js Web App (Vercel)               │
│                                                  │
│  Pages:                                          │
│    /              → Landing dashboard            │
│    /settings      → API key entry (Gemini + YT)  │
│    /sponsorship   → Sponsorship Fit Analyzer     │
│    /comments      → Comment Intelligence         │
│    /titles        → Hook & Title Factory         │
│    /chat          → Creator Chat                 │
│                                                  │
│  API Routes:                                     │
│    POST /api/analyze-sponsorship                 │
│    POST /api/analyze-comments                    │
│    POST /api/generate-titles                     │
│    POST /api/chat                                │
│    POST /api/generate-email                      │
│    POST /api/search-brands                       │
│    POST /api/youtube/fetch                       │
│                                                  │
│  Shared Libraries:                               │
│    lib/gemini.ts    → GEMINI_MODEL + factory     │
│    lib/types.ts     → TypeScript interfaces      │
│    lib/api-utils.ts → safeParseJSON, truncate,   │
│                       INPUT_LIMITS (15K)         │
│    lib/hooks.ts     → useApiCall (180s timeout), │
│                       getGeminiKey               │
│                                                  │
│  Shared Components:                              │
│    NavBar, ThemeToggle, ErrorBoundary,           │
│    CopyButton, LoadingSkeleton,                  │
│    ApiKeyGate, YouTubeUrlInput                   │
└──────────────────┬──────────────────────────────┘
                   │ Google Generative AI SDK
                   │ (user's API key from request body)
                   ▼
┌─────────────────────────────────────────────────┐
│          Google Gemini API                       │
│          Model: gemini-3-flash-preview           │
│          Mode: JSON response (responseMimeType)  │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS (class-based dark mode) | 3.3 |
| AI SDK | `@google/generative-ai` | latest |
| Extension | Chrome MV3 | - |
| Testing | Playwright (visual auditing) | - |
| Deployment | Vercel | free tier |

---

## BYOK (Bring Your Own Key) Flow

```
User enters keys on /settings
         │
         ▼
localStorage: creatoriq_gemini_key (required)
              creatoriq_yt_key     (optional)
              creatoriq_theme      (dark/light)
         │
         ▼
Tool component: reads key via getGeminiKey() (lib/hooks.ts)
         │
         ▼
useApiCall() hook: POST /api/* { apiKey, ...inputs }
  ├─ AbortController with 180s timeout
  ├─ Automatic error handling
  └─ Returns typed response
         │
         ▼
API route: getGeminiClient(apiKey) → Gemini call
           safeParseJSON() → strips markdown fences
           truncate() → enforces INPUT_LIMITS (15K)
         │
         ▼
Response returned, key never stored server-side
```

**Key storage locations:**
- Web app: `localStorage` key `creatoriq_gemini_key`
- Extension: `chrome.storage.local` key `geminiKey`
- YouTube API: `localStorage` key `creatoriq_yt_key`
- Theme: `localStorage` key `creatoriq_theme`
- Analysis cache: `localStorage` keys `creatoriq_last_sponsorship`, `creatoriq_last_comments`, `creatoriq_last_titles`

---

## Dashboard UI Pattern

All tool components follow a consistent input→dashboard pattern:

**Input state** (`max-w-3xl` centered):
- YouTubeUrlInput for auto-fetch
- Tool-specific form fields
- Color-themed CTA button (blue/purple/orange)

**Results state** (`max-w-7xl` full-width dashboard):
- Form hides completely
- "New Analysis" back button + "Clear Results" button
- Gradient summary banner with cross-tool links
- Metric cards row with large numbers
- Multi-column grid sections
- Smooth width transition animation

**Tool color themes:**
- Sponsorship: blue-to-indigo gradient, blue CTA
- Comments: violet-to-purple gradient, purple CTA
- Titles: orange-to-rose gradient, orange CTA

---

## YouTube Data Fetching (`/api/youtube/fetch`)

1. Extracts video ID from URL (supports `?v=`, `youtu.be/`, `embed/` formats)
2. Fetches video metadata + statistics via YouTube Data API v3
3. In parallel:
   - Fetches top 100 comments via `commentThreads` endpoint with `textFormat=plainText`
   - Fetches 10 recent channel uploads via `playlistItems`
   - Fetches captions by scraping YouTube watch page HTML:
     - Uses brace-counting JSON extractor (`extractJSON()`) to parse `ytInitialPlayerResponse` from page source
     - Finds English caption tracks in the player response
     - Attempts to fetch caption text via timedtext URL (JSON3 and XML formats)
     - Returns `captionsAvailable: boolean` — YouTube blocks server-side timedtext requests, so captions may return empty even when available

---

## YouTube Captions: Server vs Extension

| Approach | Works? | Notes |
|---|---|---|
| Server: timedtext API | No | YouTube returns empty body for server-side requests (ip=0.0.0.0) |
| Server: InnerTube player API | No | All client types (WEB, ANDROID, IOS, MWEB) return 0 caption tracks |
| Server: InnerTube get_transcript | No | Returns FAILED_PRECONDITION |
| Server: npm packages | No | youtube-transcript, youtubei.js, youtube-captions-scraper all fail |
| **Extension: browser fetch** | **Yes** | timedtext works from browser context with valid cookies/session |

The web app shows a warning when `captionsAvailable && !captions`: "Captions are available but YouTube blocks server-side access. Paste manually or use the Chrome extension."

---

## Browser Extension Architecture

```
extension/
├── manifest.json           ← MV3 manifest (MAIN world content script)
├── background.js           ← Service worker (minimal)
├── content-script.js       ← Runs on youtube.com/watch* pages
├── popup.html              ← Extension popup UI
├── popup.js                ← Popup logic (APP_URL constant)
├── generate-icons.mjs      ← CIQ monogram icon generator
└── icons/
    ├── icon16.png           ← CIQ on blue, rounded corners
    ├── icon48.png
    └── icon128.png
```

**Content script caption sources (fallback chain):**
1. `window.ytInitialPlayerResponse` — available on initial page load
2. `window.ytplayer.bootstrapPlayerResponse` — updated on SPA navigation
3. `document.getElementById("movie_player").getPlayerResponse()` — fallback

**Popup features:**
- Data badges showing caption word count and comment count (green/amber/gray)
- "Copy Captions" and "Copy Comments" clipboard buttons with "Copied!" flash
- "Refresh data" button to re-collect without page reload
- Color-coded tool buttons (blue/purple/orange) matching web app themes
- Passes captions + comments directly via URL params (up to 8K chars each)

---

## Environment Variables

| Variable | Usage |
|---|---|
| *(none required)* | All API keys are user-supplied via BYOK |

---

## Vercel Deployment Notes

- No environment variables required (BYOK model)
- All API routes are serverless functions (stateless)
- `gemini-3-flash-preview` responses are fast enough for Vercel Hobby timeout
- Extension is distributed separately (loaded unpacked or via Chrome Web Store)
- Update `APP_URL` in `extension/popup.js` to your Vercel URL after deploy

# CreatorIQ — Implementation Plan

## Overview

Build order was bottom-up: shared utilities -> API routes -> UI components -> pages -> extension -> polish -> dashboard redesign.

All phases are complete. This document serves as a record of what was built and a reference for future work.

---

## Phase 1 — Foundation [DONE]

- **`lib/gemini.ts`**: `GEMINI_MODEL` constant (`gemini-3-flash-preview`) + `getGeminiClient()` factory with JSON response mode
- **`lib/types.ts`**: All shared TypeScript interfaces (`SponsorshipAnalysis`, `CommentAnalysis`, `TitleAnalysis`, `YouTubeVideoData` with `captions`, `captionsAvailable`, etc.)
- **`lib/api-utils.ts`**: `safeParseJSON()` (markdown fence stripping), `truncate()`, `INPUT_LIMITS` (15K chars for captions/comments)
- **`lib/hooks.ts`**: `useApiCall()` hook (fetch + 180s AbortController timeout + error handling), `getGeminiKey()`
- **`components/ApiKeySettings.tsx`**: Gemini + YouTube API key input forms with save/clear
- **`components/ApiKeyGate.tsx`**: Blocks tool pages until Gemini key is set
- **`components/NavBar.tsx`**: Responsive nav with hamburger menu on mobile, active route highlighting
- **`components/ThemeToggle.tsx`**: Dark/light mode toggle
- **`components/ErrorBoundary.tsx`**: React error boundary with retry
- **`components/CopyButton.tsx`**: Reusable clipboard copy with "Copied!" feedback
- **`components/LoadingSkeleton.tsx`**: Shimmer skeletons for Sponsorship, Comments, and Titles
- **`components/YouTubeUrlInput.tsx`**: URL input + fetch, shows `captionsAvailable` warning when captions can't be fetched server-side

---

## Phase 2 — API Routes [DONE]

All routes validate `apiKey` (401), required inputs (400), truncate inputs via `INPUT_LIMITS` (15K), and use `safeParseJSON()`.

- **`/api/analyze-sponsorship`**: Sponsorship strategist persona, accepts `captions` + `comments`, returns `SponsorshipAnalysis`
- **`/api/analyze-comments`**: Audience research analyst persona, returns `CommentAnalysis`
- **`/api/generate-titles`**: YouTube growth strategist persona, accepts `concept` + `captions`, returns `TitleAnalysis`
- **`/api/chat`**: Creator support agent persona (uses `systemInstruction`, no JSON mode)
- **`/api/generate-email`**: Outreach email generation for brand suggestions
- **`/api/search-brands`**: Gemini grounding/search to find brand contact pages (no JSON mode, uses `googleSearchRetrieval`)
- **`/api/youtube/fetch`**: YouTube Data API v3 for metadata + comments (`textFormat=plainText`), brace-counting page scraper for captions, returns `captionsAvailable` boolean

---

## Phase 3 — Tool Components [DONE]

All tool components use:
- `useApiCall()` hook with 180s timeout
- `ApiKeyGate` wrapper
- `YouTubeUrlInput` for auto-fetching
- Full-width dashboard layout (`max-w-7xl`) when results appear
- Form hides on results, replaced by "New Analysis" + "Clear Results" buttons
- Color-coded themes (blue/purple/orange)
- Dark mode throughout
- Loading skeletons
- localStorage persistence
- Cross-tool navigation links

### Sponsorship Fit Analyzer (`SponsorshipAnalyzer.tsx`)
- Inputs: captions + comments textareas
- Dashboard: gradient summary banner, 4 metric cards (CPM, Authenticity, Age, Income), 3-col info grid, 5-col categories+brands split
- Brand cards: contact page search, on-demand outreach email generation

### Comment Intelligence (`CommentIntelligence.tsx`)
- Input: comments textarea
- Dashboard: violet gradient summary, 3-col (sentiment donut + complaints + appreciation), 2-col (topic clusters + video ideas with "Generate titles" links)

### Hook & Title Factory (`TitleFactory.tsx`)
- Inputs: concept text input + optional captions textarea
- Dashboard: orange gradient top pick banner, stats bar, 2-col masonry grid of principle groups

### Creator Chat (`ChatInterface.tsx`)
- Message history with user/assistant bubbles
- Simple conversational interface

---

## Phase 4 — Pages [DONE]

All pages use `<Suspense>` boundaries and dark mode backgrounds.

- **`/`** — Landing dashboard with 3 tool cards, setup prompt, extension callout
- **`/sponsorship`** — Renders `SponsorshipAnalyzer`
- **`/comments`** — Renders `CommentIntelligence`
- **`/titles`** — Renders `TitleFactory`
- **`/chat`** — Renders `ChatInterface`
- **`/settings`** — Renders `ApiKeySettings`
- **`layout.tsx`** — `NavBar` + `ErrorBoundary` + dark mode blocking script

---

## Phase 5 — Browser Extension [DONE]

- **`manifest.json`**: MV3, `MAIN` world content script on `youtube.com/watch*`
- **`content-script.js`**: Extracts captions from 3 sources (ytInitialPlayerResponse, ytplayer.bootstrapPlayerResponse, movie_player.getPlayerResponse), comments via DOM, exposes `window.__creatoriq` with `captionsAvailable` and `commentCount`, re-collects on SPA navigation
- **`popup.html/popup.js`**: Gradient header with CIQ badge, data badges (word count/comment count), Copy Captions/Copy Comments buttons, Refresh button, color-coded tool launch buttons, passes data via URL params
- **`background.js`**: Minimal service worker
- **`generate-icons.mjs`**: Generates CIQ monogram PNGs (white text on blue rounded-corner background) at 16/48/128px

---

## Phase 6 — Polish & Fixes [DONE]

- Dark mode with flash-free blocking script
- Mobile-responsive hamburger nav
- Loading skeletons replacing plain "Analyzing..." text
- Copy buttons on all tools (individual items + full reports)
- Cross-tool navigation links with pre-filled params
- Analysis persistence in localStorage
- ESLint config (next/core-web-vitals)
- Removed dead Anthropic SDK code and dependency
- Consistent `GEMINI_MODEL` constant across all routes
- Renamed `transcript` -> `captions` throughout entire codebase
- Comments fetched with `textFormat=plainText` (no more HTML entities)
- Fixed YouTube captions extraction with brace-counting JSON parser
- Added `captionsAvailable` boolean and UI warning for server-side caption blocking
- Increased client timeout to 180s, reduced input limits to 15K chars
- Playwright added for visual auditing (`screenshots/audit.mjs`)

---

## Phase 7 — Dashboard UI Redesign [DONE]

- Full-width `max-w-7xl` results layout replacing narrow `max-w-2xl` single-column
- Form hides when results appear, "New Analysis" back button
- Sponsorship: gradient summary, metric cards row, 3-column info, 5-column categories+brands
- Comments: violet gradient, sentiment donut chart, 3-column sentiment/complaints/appreciation, 2-column topics/ideas
- Titles: orange gradient top pick, 2-column masonry principle grid
- Color-coded CTA buttons with shadows (blue/purple/orange)
- Rounded-xl inputs and cards throughout
- Tool-specific color identities

---

## File Checklist (All Complete)

### Shared Libraries
- [x] `lib/gemini.ts`
- [x] `lib/types.ts`
- [x] `lib/api-utils.ts`
- [x] `lib/hooks.ts`

### Shared Components
- [x] `components/NavBar.tsx`
- [x] `components/ThemeToggle.tsx`
- [x] `components/ErrorBoundary.tsx`
- [x] `components/CopyButton.tsx`
- [x] `components/LoadingSkeleton.tsx`
- [x] `components/ApiKeySettings.tsx`
- [x] `components/ApiKeyGate.tsx`
- [x] `components/YouTubeUrlInput.tsx`

### Tool Components
- [x] `components/SponsorshipAnalyzer.tsx`
- [x] `components/CommentIntelligence.tsx`
- [x] `components/TitleFactory.tsx`
- [x] `components/ChatInterface.tsx`

### API Routes
- [x] `app/api/analyze-sponsorship/route.ts`
- [x] `app/api/analyze-comments/route.ts`
- [x] `app/api/generate-titles/route.ts`
- [x] `app/api/chat/route.ts`
- [x] `app/api/generate-email/route.ts`
- [x] `app/api/search-brands/route.ts`
- [x] `app/api/youtube/fetch/route.ts`

### Pages
- [x] `app/page.tsx` (landing)
- [x] `app/layout.tsx` (nav + error boundary + dark mode)
- [x] `app/sponsorship/page.tsx`
- [x] `app/comments/page.tsx`
- [x] `app/titles/page.tsx`
- [x] `app/chat/page.tsx`
- [x] `app/settings/page.tsx`

### Extension
- [x] `extension/manifest.json`
- [x] `extension/content-script.js`
- [x] `extension/popup.html`
- [x] `extension/popup.js`
- [x] `extension/background.js`
- [x] `extension/generate-icons.mjs`
- [x] `extension/icons/` (CIQ monogram PNGs)

### Testing
- [x] `screenshots/audit.mjs` (Playwright visual audit script)

---

## Testing Checklist

1. Enter Gemini API key on `/settings` -> key saves to localStorage
2. Navigate away and return -> key still present
3. Toggle dark mode -> persists across page loads
4. Mobile: hamburger menu opens/closes correctly
5. Paste captions on `/sponsorship` -> skeleton loads -> full-width dashboard renders
6. Sponsorship: metric cards show CPM, Authenticity, Age, Income
7. Sponsorship: "Generate titles for this audience" -> navigates to `/titles` with concept
8. Paste comments on `/comments` -> dashboard renders with sentiment donut
9. Comments: "Generate titles" on a video idea -> navigates to `/titles` with concept
10. Enter concept on `/titles` -> 15 titles render in 2-column masonry grid
11. Copy buttons work (individual items + full reports + "Copy all titles as list")
12. Click "New Analysis" -> form reappears at `max-w-3xl`
13. Refresh page -> last analysis restored from localStorage
14. Click "Clear Results" -> results removed from UI and localStorage
15. `/chat` -> send message -> response renders
16. YouTube URL fetch: paste URL -> comments auto-fill with plain text (no HTML entities)
17. YouTube URL fetch: `captionsAvailable` warning shown when captions can't be fetched
18. Chrome extension: CIQ icon visible in toolbar
19. Extension popup: data badges show caption word count and comment count
20. Extension popup: Copy Captions / Copy Comments buttons work
21. Extension popup: Refresh button re-collects data
22. Extension popup: tool buttons open web app with data passed via URL params
23. `npm run build` passes with 0 errors
24. `npm run lint` passes with 0 warnings

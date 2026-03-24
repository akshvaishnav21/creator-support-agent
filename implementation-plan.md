# CreatorIQ — Implementation Plan

## Overview

Build order is bottom-up: shared utilities → API routes → UI components → pages → extension.
Each phase produces working, testable output before the next begins.

---

## Phase 0 — Documentation ✅
Create `prd.md`, `design.md`, `implementation-plan.md` in repo root.

---

## Phase 1 — Foundation

### 1.1 Install Gemini SDK
```bash
npm install @google/generative-ai
```

### 1.2 Create `lib/gemini.ts`
Factory function that instantiates a Gemini model with the user's API key.
Uses `gemini-2.0-flash` with `responseMimeType: "application/json"` for reliable structured output.

### 1.3 Create `lib/types.ts`
All shared TypeScript interfaces:
- `SponsorshipAnalysis`
- `CommentAnalysis`
- `TitleAnalysis`
- Supporting sub-interfaces (`SponsorshipCategory`, `BrandSuggestion`, etc.)

### 1.4 Create `components/ApiKeySettings.tsx`
- Input field for Gemini API key (password type)
- Save button → `localStorage.setItem("creatoriq_gemini_key", key)`
- Clear button → `localStorage.removeItem("creatoriq_gemini_key")`
- Visual confirmation on save

### 1.5 Create `app/settings/page.tsx`
- Renders `ApiKeySettings`
- Links to Google AI Studio for key generation

### 1.6 Create `components/ApiKeyGate.tsx`
- Client component that checks `localStorage` for key on mount
- If no key: shows "Please set your Gemini API key" with link to /settings
- If key exists: renders `children`

### 1.7 Update `app/layout.tsx`
Add top nav bar with `next/link` links:
- CreatorIQ (home)
- Sponsorship Analyzer (`/sponsorship`)
- Comment Intelligence (`/comments`)
- Hook & Title Factory (`/titles`)
- Settings (`/settings`)

### 1.8 Update `components/ChatInterface.tsx`
- Remove Anthropic SDK import
- Read key from `localStorage.getItem("creatoriq_gemini_key")`
- Send key with API request body
- Update API call to new route (or update existing `/api/chat` to use Gemini)

---

## Phase 2 — Sponsorship Fit Analyzer

### 2.1 Create `app/api/analyze-sponsorship/route.ts`
- POST endpoint
- Request: `{ apiKey, transcript?, comments? }`
- Validate: return 400 if both transcript and comments are empty, 401 if no apiKey
- System prompt: expert YouTube sponsorship strategist persona
- User prompt: concatenate transcript + comments with separator
- Return: `{ analysis: SponsorshipAnalysis }`

**Prompt structure:**
```
You are an expert YouTube sponsorship strategist analyzing creator content.

Analyze the following content and return a JSON object matching this exact schema:
[schema definition here]

Content to analyze:
VIDEO TRANSCRIPT:
{transcript}

---

AUDIENCE COMMENTS:
{comments}
```

### 2.2 Create `components/SponsorshipAnalyzer.tsx`
Client component with:
- State: `transcript`, `comments`, `loading`, `analysis`, `error`
- Two `<textarea>` inputs with labels
- Submit handler calling `/api/analyze-sponsorship`
- Results rendering (5 sections — see design.md)
- Wrapped in `ApiKeyGate`

**Results sections:**
1. Executive Summary card (blue highlight)
2. Audience Profile card (demographics + interest pills)
3. Content Tone card (keywords + authenticity score)
4. Top Sponsorship Categories (4 items with score bars)
5. Brand Suggestions (5 cards with pitch angles)

### 2.3 Create `app/sponsorship/page.tsx`
- Server component
- Metadata: "Sponsorship Fit Analyzer | CreatorIQ"
- Renders `<SponsorshipAnalyzer />`

---

## Phase 3 — Comment Intelligence

### 3.1 Create `app/api/analyze-comments/route.ts`
- POST endpoint
- Request: `{ apiKey, comments }`
- Validate: return 400 if comments empty, 401 if no apiKey
- System prompt: audience research analyst persona
- Return: `{ analysis: CommentAnalysis }`

### 3.2 Create `components/CommentIntelligence.tsx`
Client component with:
- State: `comments`, `loading`, `analysis`, `error`
- One large `<textarea>` for comments (with character/line count hint)
- Results rendering (6 sections):
  1. Summary Insight card
  2. Sentiment Breakdown (visual percentage bars)
  3. Topic Clusters (accordion or cards with quotes)
  4. Future Video Ideas (5 cards with demand scores)
  5. Top Complaints (3 items)
  6. Appreciation Highlights (3 items)
- Wrapped in `ApiKeyGate`

### 3.3 Create `app/comments/page.tsx`
- Server component
- Metadata: "Comment Intelligence | CreatorIQ"
- Renders `<CommentIntelligence />`

---

## Phase 4 — Hook & Title Factory

### 4.1 Create `app/api/generate-titles/route.ts`
- POST endpoint
- Request: `{ apiKey, concept, transcript? }`
- Validate: return 400 if concept empty, 401 if no apiKey
- System prompt: YouTube growth strategist + copywriter persona
- Generates exactly 15 title variations across 7 psychological principles
- Return: `{ analysis: TitleAnalysis }`

### 4.2 Create `components/TitleFactory.tsx`
Client component with:
- State: `concept`, `transcript`, `loading`, `analysis`, `error`
- `<input>` for video concept (required)
- `<textarea>` for optional transcript/outline
- Results rendering:
  1. Top Pick card (highlighted)
  2. Audience Angle
  3. Titles grouped by psychological principle (7 groups)
     - Each title card: title text, hook sentence, score badge, "why it works" explanation
- Wrapped in `ApiKeyGate`

### 4.3 Create `app/titles/page.tsx`
- Server component
- Metadata: "Hook & Title Factory | CreatorIQ"
- Renders `<TitleFactory />`

---

## Phase 5 — Landing Dashboard

### 5.1 Update `app/page.tsx`
Replace the existing chat interface with a tool picker dashboard:
- Hero section: "CreatorIQ — AI tools for YouTube creators"
- 3 tool cards (grid layout):
  - Sponsorship Fit Analyzer: icon, description, "Analyze" button → `/sponsorship`
  - Comment Intelligence: icon, description, "Analyze" button → `/comments`
  - Hook & Title Factory: icon, description, "Generate" button → `/titles`
- Settings prompt if no API key detected

---

## Phase 6 — Browser Extension

### 6.1 Create `extension/manifest.json`
```json
{
  "manifest_version": 3,
  "name": "CreatorIQ",
  "version": "1.0.0",
  "description": "AI tools for YouTube creators",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["https://www.youtube.com/*"],
  "action": {
    "default_popup": "popup.html",
    "default_icon": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }
  },
  "content_scripts": [{
    "matches": ["https://www.youtube.com/watch*"],
    "js": ["content-script.js"],
    "run_at": "document_idle"
  }],
  "background": { "service_worker": "background.js" }
}
```

### 6.2 Create `extension/content-script.js`
Runs on YouTube watch pages. Responsibilities:
- **Transcript extraction**: Open transcript panel (click "..." → "Show transcript"), wait for panel to populate, collect `.ytd-transcript-segment-renderer` text, strip timestamps
- **Comment extraction**: Wait for comments to lazy-load (IntersectionObserver or scroll), collect `#content-text` from `ytd-comment-renderer`, up to 100 items
- Expose via `window.__creatoriq = { transcript, comments, videoTitle }`

### 6.3 Create `extension/popup.html`
Simple popup UI:
- CreatorIQ header
- API key input (if not set) or key indicator (if set)
- "Import from this video" section showing video title
- 3 buttons: "Sponsorship Analyzer", "Comment Intelligence", "Title Factory"
- Each button opens the web app with imported data as query params

### 6.4 Create `extension/popup.js`
- On load: read key from `chrome.storage.local`, populate key field if missing
- On key save: `chrome.storage.local.set({ geminiKey: key })`
- On tool button click:
  1. Execute content script to get `window.__creatoriq` data
  2. Encode transcript/comments as URLSearchParams
  3. Open `chrome.tabs.create({ url: APP_URL + "/sponsorship?" + params })`

### 6.5 Create `extension/background.js`
Minimal service worker — handle extension install event, no active logic needed for MVP.

### 6.6 Create placeholder icons
Simple colored square PNGs at 16x16, 48x48, 128x128 as placeholders.

---

## Phase 7 — Polish & Deploy

### 7.1 Handle URL params in tool pages
Each tool page should read query params on mount and pre-fill textarea inputs:
```ts
// In client components, check URL search params
const searchParams = useSearchParams();
const transcriptParam = searchParams.get("transcript");
// Pre-fill state if param exists
```

### 7.2 Update README.md
- New product name and description
- BYOK setup instructions
- Extension installation instructions (load unpacked)
- Vercel deploy button

### 7.3 Build verification
```bash
npm run build   # Must pass with 0 TypeScript errors
```

### 7.4 Git commit and push
```bash
git add .
git commit -m "feat: build CreatorIQ platform with 3 AI tools and Chrome extension"
git push -u origin claude/creator-sponsorship-agent-g7f97
```

---

## File Creation Checklist

### Documentation
- [x] `prd.md`
- [x] `design.md`
- [x] `implementation-plan.md`

### Foundation
- [ ] `lib/gemini.ts`
- [ ] `lib/types.ts`
- [ ] `components/ApiKeySettings.tsx`
- [ ] `app/settings/page.tsx`
- [ ] `components/ApiKeyGate.tsx`

### Tool 1 — Sponsorship Analyzer
- [ ] `app/api/analyze-sponsorship/route.ts`
- [ ] `components/SponsorshipAnalyzer.tsx`
- [ ] `app/sponsorship/page.tsx`

### Tool 2 — Comment Intelligence
- [ ] `app/api/analyze-comments/route.ts`
- [ ] `components/CommentIntelligence.tsx`
- [ ] `app/comments/page.tsx`

### Tool 3 — Hook & Title Factory
- [ ] `app/api/generate-titles/route.ts`
- [ ] `components/TitleFactory.tsx`
- [ ] `app/titles/page.tsx`

### Extension
- [ ] `extension/manifest.json`
- [ ] `extension/content-script.js`
- [ ] `extension/popup.html`
- [ ] `extension/popup.js`
- [ ] `extension/background.js`
- [ ] `extension/icons/icon16.png`
- [ ] `extension/icons/icon48.png`
- [ ] `extension/icons/icon128.png`

### Modified Files
- [ ] `app/layout.tsx` (nav bar)
- [ ] `app/page.tsx` (landing dashboard)
- [ ] `components/ChatInterface.tsx` (Gemini + BYOK)
- [ ] `package.json` (`@google/generative-ai` dependency)

---

## Testing Checklist

1. Enter Gemini API key on `/settings` → key saves to localStorage
2. Navigate away and return → key still present
3. Paste transcript on `/sponsorship` → analysis renders with all 5 sections
4. Paste comments on `/comments` → analysis renders with all 6 sections
5. Enter video concept on `/titles` → 15 title variations render grouped by principle
6. Load extension unpacked in Chrome → popup appears
7. Visit YouTube video → import buttons work
8. Open web app from extension → data pre-fills in textareas
9. `npm run build` passes with 0 errors

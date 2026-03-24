# CreatorIQ — Architecture & Design

## System Architecture

```
┌─────────────────────────────────────────────────┐
│              Chrome Extension (MV3)              │
│                                                  │
│  content-script.js                               │
│    └─ Scrapes YouTube transcript + comments      │
│       on youtube.com/watch* pages                │
│                                                  │
│  popup.html / popup.js                           │
│    └─ Mini UI: key input, tool launch buttons    │
│    └─ Reads from chrome.storage.local            │
│                                                  │
│  background.js (service worker)                  │
│    └─ Minimal: handles extension lifecycle       │
└──────────────────┬──────────────────────────────┘
                   │ Opens web app URL with
                   │ transcript/comments as
                   │ query params (URLSearchParams)
                   ▼
┌─────────────────────────────────────────────────┐
│           Next.js Web App (Vercel)               │
│                                                  │
│  Pages:                                          │
│    /              → Landing dashboard            │
│    /settings      → Gemini API key entry         │
│    /sponsorship   → Sponsorship Fit Analyzer     │
│    /comments      → Comment Intelligence         │
│    /titles        → Hook & Title Factory         │
│                                                  │
│  API Routes:                                     │
│    POST /api/analyze-sponsorship                 │
│    POST /api/analyze-comments                    │
│    POST /api/generate-titles                     │
│                                                  │
│  Shared:                                         │
│    lib/gemini.ts    → Gemini client factory      │
│    lib/types.ts     → TypeScript interfaces      │
│    components/      → Reusable UI components     │
└──────────────────┬──────────────────────────────┘
                   │ Google Generative AI SDK
                   │ (user's API key from request body)
                   ▼
┌─────────────────────────────────────────────────┐
│          Google Gemini API                       │
│          Model: gemini-2.0-flash                 │
│          Mode: JSON response (responseMimeType)  │
└─────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.3 |
| AI SDK | `@google/generative-ai` | latest |
| Extension | Chrome MV3 | - |
| Deployment | Vercel | free tier |

---

## BYOK (Bring Your Own Key) Flow

```
User enters key on /settings
         │
         ▼
localStorage.setItem("creatoriq_gemini_key", key)
         │
         ▼
Any tool page: reads key from localStorage
         │
         ▼
POST /api/analyze-* { apiKey: key, ...inputs }
         │
         ▼
API route: const { apiKey, ...inputs } = req.json()
           const model = getGeminiClient(apiKey)
           → calls Gemini with user's key
         │
         ▼
Response returned, key never stored server-side
```

**Key storage locations:**
- Web app: `localStorage` key `creatoriq_gemini_key`
- Extension: `chrome.storage.local` key `geminiKey`

**Security notes:**
- Key is sent over HTTPS only
- Never logged server-side
- User can clear/rotate key on /settings at any time

---

## Page Structure & Routing

```
app/
├── layout.tsx              ← Shared nav bar (all routes)
├── page.tsx                ← Landing: tool picker dashboard
├── settings/
│   └── page.tsx            ← API key entry
├── sponsorship/
│   └── page.tsx            ← Sponsorship Fit Analyzer
├── comments/
│   └── page.tsx            ← Comment Intelligence
├── titles/
│   └── page.tsx            ← Hook & Title Factory
└── api/
    ├── analyze-sponsorship/route.ts
    ├── analyze-comments/route.ts
    └── generate-titles/route.ts
```

---

## Component Architecture

```
components/
├── ApiKeySettings.tsx    ← Key input form, localStorage save/clear
├── ApiKeyGate.tsx        ← Wrapper: redirects to /settings if no key
├── SponsorshipAnalyzer.tsx
├── CommentIntelligence.tsx
├── TitleFactory.tsx
└── ChatInterface.tsx     ← Existing (updated for Gemini + BYOK)
```

**Shared UI patterns (Tailwind only, no libraries):**
- `bg-blue-50 border border-blue-200 rounded-lg p-4` — highlighted insight cards
- `bg-gray-100 rounded-lg p-4` — standard section cards
- `bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-0.5` — pill badges
- `bg-green-400 h-2 rounded` inside `bg-gray-200 rounded` — score progress bars

---

## Gemini Integration (`lib/gemini.ts`)

```ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}
```

**All API routes follow this pattern:**
```ts
export async function POST(req: NextRequest) {
  const { apiKey, ...inputs } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key required" }, { status: 401 });
  }

  const model = getGeminiClient(apiKey);
  const result = await model.generateContent(buildPrompt(inputs));
  const analysis = JSON.parse(result.response.text());

  return NextResponse.json({ analysis });
}
```

**Why `responseMimeType: "application/json"`?**
Gemini's native JSON mode guarantees valid JSON output without prompt-level enforcement. More reliable than asking the model to avoid markdown fences.

---

## API Route Schemas

### POST `/api/analyze-sponsorship`
**Request:** `{ apiKey, transcript?, comments? }`
**Response:** `{ analysis: SponsorshipAnalysis }`

```ts
interface SponsorshipAnalysis {
  audienceProfile: {
    ageRange: string;
    primaryInterests: string[];
    likelyGender: string;
    incomeSignal: string;
    engagementStyle: string;
  };
  contentTone: {
    primaryTone: string;
    styleKeywords: string[];
    authenticityScore: number;
    brandSafetyNotes: string;
  };
  topSponsorshipCategories: {
    category: string;
    fitScore: number;
    rationale: string;
  }[];
  specificBrandSuggestions: {
    brandName: string;
    category: string;
    fitReason: string;
    pitchAngle: string;
  }[];
  summaryInsight: string;
}
```

### POST `/api/analyze-comments`
**Request:** `{ apiKey, comments }`
**Response:** `{ analysis: CommentAnalysis }`

```ts
interface CommentAnalysis {
  topicClusters: {
    topic: string;
    commentCount: number;
    sentiment: "positive" | "negative" | "mixed";
    keyQuotes: string[];
  }[];
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  futureVideoIdeas: {
    title: string;
    evidenceQuotes: string[];
    demandScore: number;
  }[];
  topComplaints: {
    complaint: string;
    frequency: string;
  }[];
  appreciationHighlights: string[];
  summaryInsight: string;
}
```

### POST `/api/generate-titles`
**Request:** `{ apiKey, concept, transcript? }`
**Response:** `{ analysis: TitleAnalysis }`

```ts
interface TitleAnalysis {
  titles: {
    title: string;
    hook: string;
    psychPrinciple: "curiosity_gap" | "controversy" | "how_to" | "listicle" | "urgency" | "social_proof" | "story";
    score: number;
    whyItWorks: string;
  }[];
  topPick: string;
  audienceAngle: string;
}
```

---

## Browser Extension Architecture

```
extension/
├── manifest.json           ← MV3 manifest
├── background.js           ← Service worker (minimal)
├── content-script.js       ← Runs on youtube.com/watch* pages
├── popup.html              ← Extension popup UI
├── popup.js                ← Popup logic
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

**Manifest V3 key fields:**
```json
{
  "manifest_version": 3,
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["https://www.youtube.com/*"],
  "content_scripts": [{
    "matches": ["https://www.youtube.com/watch*"],
    "js": ["content-script.js"]
  }]
}
```

**Data handoff (Extension → Web App):**
1. Content script extracts transcript + comments into `window.__creatoriq`
2. Popup reads data via `chrome.scripting.executeScript`
3. Popup opens web app URL: `https://[app-url]/sponsorship?transcript=...&comments=...`
4. Web app reads URL params on mount and pre-fills textareas

**Transcript extraction strategy:**
- Target: `.ytd-transcript-segment-renderer` elements (YouTube transcript panel)
- Fallback: video description text
- Strips timestamps, joins segments with spaces

**Comment extraction strategy:**
- Target: `#content-text` inside `ytd-comment-renderer`
- Scroll to trigger lazy loading before extraction
- Collect up to 100 comments, join with newlines

---

## Navigation Bar (layout.tsx)

All pages share a top nav:
```
CreatorIQ  |  Chat  |  Sponsorship  |  Comments  |  Titles  |  ⚙ Settings
```

---

## Environment Variables

| Variable | Usage |
|---|---|
| *(none required)* | All API keys are user-supplied via BYOK |

The existing `ANTHROPIC_API_KEY` env var is no longer needed (Gemini replaces Anthropic).

---

## Vercel Deployment Notes

- No environment variables required (BYOK model)
- All API routes are serverless functions (stateless)
- `gemini-2.0-flash` responses are fast enough for the 10s Vercel Hobby timeout
- Extension is distributed separately (loaded unpacked or via Chrome Web Store)

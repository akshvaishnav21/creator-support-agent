# CreatorIQ — Product Requirements Document

## Product Overview

**CreatorIQ** is a multi-tool AI platform for YouTube creators. It helps creators make smarter decisions about monetization, audience understanding, and content strategy — without requiring expensive analytics tools or marketing expertise.

Powered by Google Gemini AI (`gemini-3-flash-preview`) with a bring-your-own-key (BYOK) model, CreatorIQ runs entirely in the browser and on Vercel with zero server-side data storage.

---

## Problem Statement

YouTube creators spend the majority of their time producing content, leaving almost no bandwidth for strategic analysis. Key problems:

- **Monetization is guesswork**: Creators don't know which brands actually fit their audience, leading to poor sponsorship deals that damage trust
- **Comments are a gold mine left unmined**: Thousands of comments contain audience desires, frustrations, and future video ideas — but reading them manually is impractical
- **Titles and hooks are the #1 growth lever**: Most creators write one title and ship it, leaving clicks on the table from untested alternatives

---

## Target Users

- YouTube creators of any size (from 1K to 1M+ subscribers)
- Creators considering brand sponsorships
- Creators looking to grow faster through better content strategy
- Creators who want data-driven insights without hiring a team

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS (with dark mode) |
| AI Engine | Google Gemini (`gemini-3-flash-preview`) via `@google/generative-ai` |
| Auth model | None — BYOK (bring your own Gemini API key) |
| Data fetching | YouTube Data API v3 (optional, user-supplied key) |
| Deployment | Vercel (free tier compatible) |
| Extension | Chrome Extension, Manifest V3 |
| Testing | Playwright (visual auditing) |

---

## BYOK Model

Users supply their own Google Gemini API key. The key is:
- Entered once on the `/settings` page
- Stored in `localStorage` (web app) and `chrome.storage.local` (extension)
- Sent with each API request in the POST body
- **Never stored server-side**

An optional YouTube Data API key can be added for auto-fetching video comments and metadata by URL.

---

## Features

### Feature 1 — Sponsorship Fit Analyzer (`/sponsorship`)

**Purpose**: Identify which brand categories and specific companies are the best fit for a creator's audience.

**Input**:
- Video captions (paste text or import via Chrome extension)
- Audience comments (paste text, import via extension, or auto-fetch from YouTube URL with `textFormat=plainText`)
- At least one input required

**Output** (full-width dashboard layout):
- **Executive Summary**: gradient banner with insight text, copy report button, cross-tool links
- **Key Metrics Row**: 4 metric cards — CPM range, Authenticity Score, Age Range, Income Signal
- **3-Column Row**: Audience Profile (interest pills) | Content Tone (style keywords, brand safety) | Deal Intelligence (deal type, brands to avoid)
- **2-Column Row**: Sponsorship Categories (score bars) | Brand Suggestions (card grid with contact links, email generation)

**Persistence**: Last analysis saved to localStorage, survives page reload.

---

### Feature 2 — Comment Intelligence (`/comments`)

**Purpose**: Turn raw comment sections into structured audience intelligence.

**Input**:
- Bulk comments (paste, import via extension, or auto-fetch from YouTube URL)

**Output** (full-width dashboard layout):
- **Summary banner**: violet gradient with insight, cross-tool links
- **3-Column Row**: Sentiment donut chart | Top Complaints (red accent) | What They Love (green accent)
- **2-Column Row**: Topic Clusters (with sentiment badges, key quotes) | Video Ideas (demand scores, "Generate titles" links)

**Persistence**: Last analysis saved to localStorage, survives page reload.

---

### Feature 3 — Hook & Title Factory (`/titles`)

**Purpose**: Generate high-converting title and hook variations for any video concept.

**Input**:
- Video concept / topic (short description, required)
- Optional captions or outline
- Can be pre-filled from YouTube URL fetch or cross-tool navigation

**Output** (full-width dashboard layout):
- **Top Pick banner**: orange-to-rose gradient with best title, audience angle, copy buttons
- **Stats bar**: title count, principle count, "copy all" action
- **2-Column masonry grid**: principle groups as cards with colored badges, individual title cards with scores, hooks, copy buttons

**Persistence**: Last analysis saved to localStorage, survives page reload.

---

### Feature 4 — Creator Chat (`/chat`)

**Purpose**: General-purpose AI assistant for YouTube creators.

**Input**: Free-text messages about content strategy, analytics, audience growth, monetization.

**Output**: Conversational AI responses powered by Gemini.

---

## Browser Extension

**Platform**: Chrome (Manifest V3)

**Core capabilities**:
- **CIQ monogram icons**: visible in Chrome toolbar at 16/48/128px
- **Captions extraction**: 3-source fallback (ytInitialPlayerResponse, ytplayer.bootstrapPlayerResponse, movie_player.getPlayerResponse)
- **Comment extraction**: Scrapes top 100 comments from DOM, auto-scrolls to trigger lazy loading
- **Copy buttons**: One-click "Copy Captions" and "Copy Comments" to clipboard
- **Data badges**: Green/amber/gray status showing word count and comment count
- **Refresh button**: Re-collects data without page reload
- **Tool launch**: Color-coded buttons (blue/purple/orange) that pass captions and comments directly via URL params
- **SPA navigation**: Re-collects data when YouTube navigates between videos
- **Gemini key storage**: Stores user's key in `chrome.storage.local`

---

## Non-Functional Requirements

| Requirement | Spec |
|---|---|
| No server-side data storage | API routes are stateless — process and discard |
| Vercel free tier compatible | All routes complete within timeout using `gemini-3-flash-preview` |
| No authentication | No login, no accounts, no sessions |
| Mobile-friendly UI | Responsive nav (hamburger on mobile), Tailwind responsive classes |
| Dark mode | Class-based Tailwind dark mode, flash-free with blocking script |
| Dashboard results | Full-width `max-w-7xl` multi-column grid layouts when results are shown |
| Client-side persistence | Last analysis per tool in localStorage |
| Robust JSON parsing | `safeParseJSON()` strips markdown fences from AI responses |
| Input validation | Server-side truncation at 15K chars per field, client-side `maxLength` |
| Request timeouts | 180s AbortController timeout on all client-side API calls |
| Error boundaries | React ErrorBoundary wraps all page content |
| TypeScript strict mode | All types defined in `lib/types.ts` |
| Zero UI libraries | Tailwind only, no component libraries |

---

## Out of Scope (Current)

- Saved analysis history (beyond last-result persistence)
- User accounts / authentication
- Monetization / subscription model
- Firefox extension
- Multi-language support
- Video upload / direct audio transcription
- Server-side caption fetching (blocked by YouTube as of 2025)

# CreatorIQ — Product Requirements Document

## Product Overview

**CreatorIQ** is a multi-tool AI platform for YouTube creators. It helps creators make smarter decisions about monetization, audience understanding, and content strategy — without requiring expensive analytics tools or marketing expertise.

Powered by Google Gemini AI with a bring-your-own-key (BYOK) model, CreatorIQ runs entirely in the browser and on Vercel with zero server-side data storage.

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
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| AI Engine | Google Gemini (`gemini-2.0-flash`) via `@google/generative-ai` |
| Auth model | None — BYOK (bring your own Gemini API key) |
| Deployment | Vercel (free tier compatible) |
| Extension | Chrome Extension, Manifest V3 |

---

## BYOK Model

Users supply their own Google Gemini API key. The key is:
- Entered once on the `/settings` page
- Stored in `localStorage` (web app) and `chrome.storage.local` (extension)
- Sent with each API request in the POST body
- **Never stored server-side**

This eliminates backend infrastructure costs and gives users full control over their API usage.

---

## Features

### Feature 1 — Sponsorship Fit Analyzer (`/sponsorship`)

**Purpose**: Identify which brand categories and specific companies are the best fit for a creator's audience.

**Input**:
- Video transcript (paste text, up to ~15,000 chars)
- Audience comments (paste text or import via extension)
- At least one input required

**Output** (structured JSON rendered as UI):
- **Audience Profile**: age range, primary interests (pill badges), likely gender split, income signal, engagement style
- **Content Tone**: primary tone, style keywords, authenticity score (1–10), brand safety notes
- **Top Sponsorship Categories** (4): category name, fit score (1–10) with visual bar, rationale
- **Specific Brand Suggestions** (5): brand name, category, fit reasoning, pitch angle
- **Executive Summary**: 2–3 sentence creator-facing insight

---

### Feature 2 — Comment Intelligence (`/comments`)

**Purpose**: Turn raw comment sections into structured audience intelligence.

**Input**:
- Bulk comments (paste or import via extension, up to 200 comments)

**Output**:
- **Topic Clusters**: grouped by theme, with sentiment label and key quotes per cluster
- **Sentiment Breakdown**: positive / negative / neutral percentages (visual breakdown)
- **Future Video Ideas** (5): title suggestion, supporting quotes from comments, demand score (1–10)
- **Top Complaints** (3): what the audience is frustrated about
- **Appreciation Highlights** (3): what the audience loves most
- **Summary Insight**: 2–3 sentence executive summary

---

### Feature 3 — Hook & Title Factory (`/titles`)

**Purpose**: Generate high-converting title and hook variations for any video concept.

**Input**:
- Video concept / topic (short description, required)
- Optional transcript or outline (for more personalized output)

**Output**:
- **15+ title + hook variations** grouped by psychological principle:
  - Curiosity Gap
  - Controversy
  - How-To / Tutorial
  - Listicle
  - Urgency / FOMO
  - Social Proof
  - Story / Journey
- Each variation includes: title, hook sentence, score (1–10), why it works
- **Top Pick**: single best recommendation
- **Audience Angle**: one sentence on who this appeals to most

---

## Browser Extension

**Platform**: Chrome (Manifest V3)

**Core capabilities**:
- **One-click transcript import**: Reads YouTube's auto-generated transcript from the transcript panel on any video page
- **Comment importer**: Scrapes top comments (up to 100) from the current video
- **Quick launch**: Opens web app with imported data pre-filled via URL params
- **Gemini key storage**: Stores user's key in `chrome.storage.local`
- **Popup UI**: Shows current video title, import buttons, and links to each tool

**Extension pages**:
- Popup (`popup.html`): Main UI shown when clicking the extension icon
- Content script (`content-script.js`): Runs on `youtube.com/watch*` pages to extract data

---

## Non-Functional Requirements

| Requirement | Spec |
|---|---|
| No server-side data storage | API routes are stateless — process and discard |
| Vercel free tier compatible | All routes complete within 10s (use `gemini-2.0-flash` for speed) |
| No authentication | No login, no accounts, no sessions |
| Mobile-friendly UI | Tailwind responsive classes throughout |
| TypeScript strict mode | All types defined, no `any` |
| Zero new UI libraries | Tailwind only, no component libraries |

---

## Out of Scope (MVP)

- YouTube Data API integration (real analytics)
- Saved analysis history
- User accounts / authentication
- Monetization / subscription model
- Firefox extension
- Multi-language support
- Video upload / direct audio transcription

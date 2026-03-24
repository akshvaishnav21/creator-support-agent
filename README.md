# Creator Support Agent

An AI-powered support agent for YouTube creators, built with Next.js and Claude.

## Features

- Chat interface for creator Q&A
- Powered by Anthropic's Claude (claude-sonnet-4-6)
- Deployable to Vercel in one click

## Getting Started

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and add your Anthropic API key:
   ```bash
   cp .env.example .env.local
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/creator-support-agent)

Set the `ANTHROPIC_API_KEY` environment variable in your Vercel project settings.

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

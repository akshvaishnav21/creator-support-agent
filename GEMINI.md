# CreatorIQ: AI-Powered Tools for YouTube Creators

## Project Overview

CreatorIQ is a Next.js application that provides a suite of AI-powered tools for YouTube creators. It leverages the Google Gemini API to offer features like sponsorship analysis, comment intelligence, and title generation. The project is built with a modern stack, including Next.js 14, TypeScript, and Tailwind CSS. It also includes a Chrome extension for easy data import from YouTube.

The application operates on a "Bring Your Own Key" (BYOK) model, where users provide their own Gemini API key, which is stored locally in the browser. This approach simplifies deployment and avoids the need for server-side secret management.

## Building and Running

### Prerequisites

- Node.js and npm
- A free Google Gemini API key

### Development

To run the project in a development environment, follow these steps:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Production

To build and run the project in a production environment:

1.  **Build the application:**
    ```bash
    npm run build
    ```
2.  **Start the production server:**
    ```bash
    npm run start
    ```

### Linting

To check for code quality and style issues, run the linter:

```bash
npm run lint
```

## Development Conventions

- **Framework:** The project uses the Next.js App Router for routing and server-side rendering.
- **Language:** The codebase is written in TypeScript.
- **Styling:** Tailwind CSS is used for styling.
- **API Integration:** The application interacts with the Google Gemini API using the `@google/generative-ai` SDK.
- **State Management:** User-specific data, like the Gemini API key, is stored in the browser's `localStorage`. The application is otherwise stateless.
- **Browser Extension:** The Chrome extension is located in the `/extension` directory and is built using Manifest V3.

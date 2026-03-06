# Dot - AI Companion

A friendly, minimalist AI companion built with React, Tailwind CSS, and the Gemini API.

## Features
- **Editorial Style**: Beautiful magazine-like layout for complex topics.
- **Developer Mode**: Specialized mode for coding and technical advice.
- **Artifacts**: Support for Markdown, CSV tables, and Mermaid diagrams.
- **File Support**: Upload and analyze files.

## Deployment

### Vercel Troubleshooting
If you see an error saying `GEMINI_API_KEY is not configured` after deploying to Vercel:
1. Go to your project in the **Vercel Dashboard**.
2. Go to **Settings > Environment Variables**.
3. Ensure you have a variable named `GEMINI_API_KEY` (all caps, exactly as shown).
4. **Important**: After adding the variable, you **MUST** trigger a new deployment for the changes to take effect. Go to the **Deployments** tab and click **Redeploy** on your latest build.
5. If you are still having issues, try adding `VITE_GEMINI_API_KEY` with the same value as a backup.

### Local Development
1. Clone the repository.
2. Run `npm install`.
3. Create a `.env` file based on `.env.example` and add your `GEMINI_API_KEY`.
4. Run `npm run dev`.

## Tech Stack
- React 18
- Vite
- Tailwind CSS
- Google Generative AI SDK (@google/genai)
- Framer Motion
- Lucide React
- Mermaid.js
- React Markdown

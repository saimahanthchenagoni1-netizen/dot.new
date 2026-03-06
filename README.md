# Dot - AI Companion

A friendly, minimalist AI companion built with React, Tailwind CSS, and the Gemini API.

## Features
- **Editorial Style**: Beautiful magazine-like layout for complex topics.
- **Developer Mode**: Specialized mode for coding and technical advice.
- **Artifacts**: Support for Markdown, CSV tables, and Mermaid diagrams.
- **File Support**: Upload and analyze files.

## Deployment

### Vercel / Netlify / Cloudflare Pages
1. Push this repository to GitHub.
2. Connect your GitHub repository to your deployment platform.
3. **Crucial**: Add an environment variable named `GEMINI_API_KEY`.
   - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
4. Deploy!

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

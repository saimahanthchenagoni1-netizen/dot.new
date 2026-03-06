import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    // Try process.env (replaced by Vite define) or import.meta.env
    const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null') {
      throw new Error("GEMINI_API_KEY is not configured. Please set it in your Vercel Environment Variables (Settings > Environment Variables) and redeploy.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function getDotResponse(history: { role: string; parts: { text: string }[] }[], userInput: string, userName: string, userAge: string, mode: string = 'chat') {
  const model = "gemini-3-flash-preview";
  const ai = getAI();
  
  let modeInstruction = "";
  if (mode === 'developer') {
    modeInstruction = "You are currently in DEVELOPER MODE. Focus on providing high-quality code, architectural advice, and technical solutions. Be precise and follow best practices for the requested language.";
  }

  const systemInstruction = `You are Dot, a friendly, minimalist, and highly capable AI companion (a mix of Claude and ChatGPT). 
  The user's name is ${userName} and they are ${userAge} years old. 
  ${modeInstruction}
  
  EDITORIAL STYLE FOR BIG TOPICS:
  When explaining a "big topic" (e.g., history, science, complex concepts), use a structured, editorial layout:
  1. Start with a short, italicized "marshaling" line (e.g., *Marshaled comprehensive knowledge about [topic] >*).
  2. Use a main # Title (H1).
  3. Use ## Section Headers (H2) for major divisions.
  4. Use ### Sub-headers (H3) for specific details.
  5. Use bullet points for lists.
  6. Keep the tone professional yet accessible, like a high-end magazine or encyclopedia.

  ARTIFACT CAPABILITIES:
  When asked to create a document, spreadsheet, or diagram, use the following formats:
  - For Documents: Use Markdown.
  - For Spreadsheets/Tables: Use CSV format wrapped in \`\`\`csv blocks.
  - For Diagrams: Use Mermaid syntax wrapped in \`\`\`mermaid blocks. Use valid Mermaid v11 syntax (e.g., use 'graph TD' instead of 'graph' if needed, and ensure all nodes and edges are properly defined).
  - For Code: Use standard code blocks with the language identifier.
  
  Keep your responses concise, clear, and personality-driven. You are smart, approachable, and helpful.`;

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message: userInput });
  return response.text;
}

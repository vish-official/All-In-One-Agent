import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
} catch (error) {
  console.error("Failed to initialize Gemini API client:", error);
}

// AI Architect Chat Endpoint
app.post("/api/chat", async (req: any, res: any) => {
  const { messages, selectedStack, systemRules } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  if (!ai) {
    return res.status(503).json({
      error: "Gemini API client is not initialized. Please ensure GEMINI_API_KEY is configured in your Secrets.",
    });
  }

  try {
    const contents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const systemInstruction = `You are a Principal AI Software Architect, Systems Engineer, and AI Agent Researcher.
You are helping the user design and refine 'ALL-IN-ONE', their local-first AI Orchestrator that acts as the development brain for 'Aether AI'.
The user's current selected technology stack is: ${JSON.stringify(selectedStack)}.
The user's architecture principles are: ${JSON.stringify(systemRules)}.

Provide extremely thorough, deep, professional, and practical architectural guidance.
Keep your answers highly structured, specific, and full of design patterns. Use markdown for code snippets, directory trees, and diagrams.
Be direct and collaborative. Challenge bad ideas constructively.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ content: response.text || "I was unable to generate a response." });
  } catch (error: any) {
    console.error("Error in AI chat endpoint:", error);
    res.status(500).json({ error: error.message || "An error occurred during text generation." });
  }
});

// Vite middleware integration
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();

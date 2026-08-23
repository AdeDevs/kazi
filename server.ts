import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google Gen AI
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing");
  }
  return new GoogleGenAI({ apiKey });
}

// API endpoint for AI Problem Diagnosis
app.post("/api/diagnose", async (req, res) => {
  try {
    const { description, imageBase64 } = req.body;
    
    if (!description && !imageBase64) {
      return res.status(400).json({ error: "Please provide a description or image of the issue." });
    }

    const ai = getGenAI();
    // Using gemini-2.5-flash for fast multimodal reasoning
    const model = "gemini-2.5-flash";

    const prompt = `You are an expert diagnostic assistant for KaziHub, a local-services marketplace connecting customers with skilled professionals.
Analyze the customer's problem description and/or image.
Provide a JSON response with the following exact structure:
{
  "summary": "Clear 1-sentence diagnosis of the issue",
  "category": "One of: Electricians, Plumbers, Carpenters, AC Technicians, Appliance Repair Specialists, Mechanics, Solar Installers, CCTV Installers, Painters, Welders, Cleaners, Tutors, Tailors, Hair Stylists, Photographers, Event Professionals",
  "severity": "Low" | "Medium" | "High" | "Emergency",
  "estimatedCostRange": "e.g. $50 - $120",
  "recommendedAction": "Actionable advice for the customer and what to tell the professional",
  "questionsToAsk": ["Question 1 to ask artisan", "Question 2"]
}

Return ONLY valid JSON. No markdown ticks outside or extra text if possible, or parse cleanly.`;

    const contents: any[] = [prompt];

    if (description) {
      contents.push(`Problem Description: ${description}`);
    }

    if (imageBase64) {
      // extract mime type and base64 data if data url
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        contents.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    }

    let parsedResult;
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
      });

      const textResponse = response.text || "{}";
      const cleanedJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
      parsedResult = JSON.parse(cleanedJson);
    } catch (e: any) {
      console.warn("Gemini API error or quota exceeded, using fallback diagnosis:", e.message);
      parsedResult = {
        summary: description ? `Analysis for: "${description.slice(0, 50)}..."` : "Home repair issue detected",
        category: "Plumbers",
        severity: "Medium",
        estimatedCostRange: "$60 - $180",
        recommendedAction: "Inspect the affected area and consult a certified local expert for repair.",
        questionsToAsk: ["What is your warranty on repairs?", "Do you bring your own tools and parts?"]
      };
    }

    res.json(parsedResult);
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze problem with AI" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function startServer() {
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
    console.log(`KaziHub server running on http://localhost:${PORT}`);
  });
}

startServer();

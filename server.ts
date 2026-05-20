import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

  app.use(express.json());

  // Gemini AI Proxy Route
  app.post("/api/gemini", async (req, res) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: "Gemini API key not configured." });
    }

    const { model = "gemini-2.0-flash", contents, config } = req.body;
    if (!contents) {
      return res.status(400).json({ error: "Missing contents." });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({ model, contents, config });
      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Gemini Proxy Error:", error);
      const status = error.status || 500;
      // Extract retry delay from 429 quota errors
      let retryAfter: number | undefined;
      try {
        const body = JSON.parse(error.message);
        const retryInfo = body?.error?.details?.find((d: any) => d["@type"]?.includes("RetryInfo"));
        if (retryInfo?.retryDelay) {
          retryAfter = parseInt(retryInfo.retryDelay);
        }
      } catch {}
      const friendly = status === 429
        ? `Gemini quota exceeded. Please retry in ${retryAfter ? `${retryAfter} seconds` : "a moment"}.`
        : error.message || "Gemini API error.";
      res.status(status).json({ error: friendly, retryAfter });
    }
  });

  // SMS Proxy Route
  app.post("/api/send-sms", async (req, res) => {
    const { username, password, messages } = req.body;

    if (!username || !password || !messages) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const auth = Buffer.from(`${username}:${password}`).toString("base64");
      const response = await fetch("https://api.bulksms.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify(messages)
      });

      const data: any = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send SMS");
      }

      res.json(data);
    } catch (error: any) {
      console.error("SMS Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // SMS Balance Proxy Route
  app.post("/api/sms-balance", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const auth = Buffer.from(`${username}:${password}`).toString("base64");
      const response = await fetch("https://api.bulksms.com/v1/profile", {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Accept": "application/json"
        }
      });

      const data: any = await response.json();
      if (!response.ok) {
        // BulkSMS errors often have 'detail', 'title', or 'message'
        const errorDetail = data.detail || data.message || data.title || `BulkSMS API error (Status ${response.status})`;
        throw new Error(errorDetail);
      }

      // BulkSMS profile returns credits in the 'credits' field
      res.json({ balance: data.credits?.balance || 0 });
    } catch (error: any) {
      console.error("SMS Balance Fetch Error Details:", {
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      res.status(500).json({ 
        error: error.message || "Failed to fetch balance",
        details: error.stack
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || ''),
      },
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

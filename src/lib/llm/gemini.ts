import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) throw new Error("GOOGLE_AI_API_KEY is not set");
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

// Routing: fast model
export function getRoutingModel() {
  return getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
}

// Main pipeline: same model (free tier)
export function getPipelineModel() {
  return getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });
}

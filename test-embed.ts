import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

async function run() {
  try {
    const res = await ai.models.embedContent({
      model: "text-embedding-004",
      contents: ["Text 1", "Text 2"],
      config: {
        taskType: "RETRIEVAL_DOCUMENT"
      }
    });
    console.log("Embeddings length text-embedding-004:", res.embeddings?.length);
  } catch (err) {
    console.error("text-embedding-004 failed");
  }

  try {
    const res = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: ["Text 1", "Text 2"],
      config: {
        taskType: "RETRIEVAL_DOCUMENT"
      }
    });
    console.log("Embeddings length gemini-embedding-001:", res.embeddings?.length);
  } catch (err) {
    console.error("gemini-embedding-001 failed");
  }

  try {
    const res = await ai.models.embedContent({
      model: "embedding-001",
      contents: ["Text 1", "Text 2"],
      config: {
        taskType: "RETRIEVAL_DOCUMENT"
      }
    });
    console.log("Embeddings length embedding-001:", res.embeddings?.length);
  } catch (err) {
    console.error("embedding-001 failed");
  }
}

run();

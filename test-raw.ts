import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const apiKeyMatch = envContent.match(/GEMINI_API_KEY=(.+)/);
const apiKey = apiKeyMatch ? apiKeyMatch[1].trim() : process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

async function run() {
  const prompt = `Analyze the following message for scam patterns.
Return a JSON object with EXACTLY the following structure:
{
  "riskScore": number (0 to 100, where 100 is definite scam and 0 is completely safe),
  "flags": array of strings (specific red flags found, e.g., "Requests sensitive info"),
  "explanation": string (plain-language explanation of why it looks risky or safe)
}

IMPORTANT: Write the "explanation" field in English. Keep all "flags" array values in English.

Message to analyze:
"""
Hey mom, I will be home by 5 PM today for dinner.
"""
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    console.log("--- RAW GEMINI RESPONSE ---");
    console.log(response.text);
    console.log("---------------------------");
  } catch (err) {
    console.error("Error:", err);
  }
}

run();

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client using the key from .env.local
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.text || typeof body.text !== "string" || body.text.trim() === "") {
      return NextResponse.json(
        { error: "Missing or empty 'text' field in request body." },
        { status: 400 }
      );
    }

    const text = body.text;
    const lowerText = text.toLowerCase();
    
    // --- 1. Rule-based checks ---
    const ruleFlags = new Set<string>();
    
    const urgencyWords = ["immediately", "arrest", "block", "suspend", "urgent", "action required"];
    for (const word of urgencyWords) {
      if (lowerText.includes(word)) {
        ruleFlags.add("Urgency language");
        break;
      }
    }

    const paymentWords = ["otp", "payment", "pay", "bank", "account", "transfer", "cvv", "pin"];
    for (const word of paymentWords) {
      if (lowerText.includes(word)) {
        ruleFlags.add("Payment/OTP phrase");
        break;
      }
    }

    if (/https?:\/\/|www\./i.test(text)) {
      ruleFlags.add("Contains link/URL");
    }

    // --- 2. Gemini AI Call ---
    const prompt = `Analyze the following message for scam patterns.
Return a JSON object with EXACTLY the following structure:
{
  "riskScore": number (0 to 100, where 100 is definite scam and 0 is completely safe),
  "flags": array of strings (specific red flags found, e.g., "Requests sensitive info"),
  "explanation": string (plain-language explanation of why it looks risky or safe)
}

Message to analyze:
"""
${text}
"""
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const aiResult = JSON.parse(response.text || "{}");
    const aiFlags = Array.isArray(aiResult.flags) ? aiResult.flags : [];
    
    // --- 3. Merge flags ---
    const finalFlags = Array.from(new Set([...ruleFlags, ...aiFlags]));

    const finalResponse = {
      riskScore: typeof aiResult.riskScore === 'number' ? aiResult.riskScore : (ruleFlags.size > 0 ? 50 : 0),
      flags: finalFlags,
      explanation: aiResult.explanation || "No explanation provided.",
    };

    return NextResponse.json(finalResponse);
  } catch (error: unknown) {
    console.error("Scam check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze message." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client using the key from .env.local
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let textToAnalyze = "";

    if (body.imageBase64 && body.mimeType) {
      // --- Image OCR Phase ---
      const ocrResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: body.mimeType,
              data: body.imageBase64,
            },
          },
          {
            text: "Extract and return all the text visible in this image. If there is no text at all, output EXACTLY the word: NO_TEXT_FOUND. Do not add any extra commentary. If this image is not a screenshot of a text message, chat, or email — for example if it's a photo of a person, an object, or unrelated text like clothing or signage — respond with exactly NOT_A_MESSAGE instead of extracting the text.",
          },
        ],
      });

      textToAnalyze = ocrResponse.text || "";

      // Validate extracted text
      const cleanText = textToAnalyze.trim();
      if (cleanText.includes("NOT_A_MESSAGE")) {
        return NextResponse.json(
          { error: "This doesn't look like a message screenshot. Try uploading a screenshot of a text, chat, or email." },
          { status: 400 }
        );
      }
      if (!cleanText || cleanText.includes("NO_TEXT_FOUND") || cleanText.length < 3) {
        return NextResponse.json(
          { error: "No readable text was found in this image. Try a clearer screenshot." },
          { status: 400 }
        );
      }
    } else if (body.text) {
      // --- Text Phase ---
      textToAnalyze = body.text;
    } else {
      return NextResponse.json(
        { error: "Missing 'text' or 'imageBase64' field in request body." },
        { status: 400 }
      );
    }

    if (typeof textToAnalyze !== "string" || textToAnalyze.trim() === "") {
      return NextResponse.json(
        { error: "Missing or empty text." },
        { status: 400 }
      );
    }

    const text = textToAnalyze.trim();
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

    const rawText = response.text || "{}";
    const cleanedJsonText = rawText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    
    let aiResult: any = {};
    try {
      aiResult = JSON.parse(cleanedJsonText);
    } catch (e) {
      console.error("Failed to parse Gemini output:", cleanedJsonText);
      aiResult = {};
    }
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

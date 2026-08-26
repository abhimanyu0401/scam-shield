import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// Initialize Gemini client using the key from .env.local
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Load precomputed patterns
let scamPatterns: any[] = [];
try {
  const patternsFile = path.join(process.cwd(), "lib", "scam-pattern-embeddings.json");
  const rawData = fs.readFileSync(patternsFile, "utf8");
  scamPatterns = JSON.parse(rawData);
} catch (err) {
  console.warn("Could not load scam patterns library:", err);
}

// Cosine similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Normalizes audio MIME types for Gemini API compatibility
function normalizeAudioMimeType(mime: string): string {
  const clean = mime.toLowerCase().trim();
  const map: Record<string, string> = {
    "audio/mp3": "audio/mp3",
    "audio/mpeg": "audio/mp3",
    "audio/wav": "audio/wav",
    "audio/x-wav": "audio/wav",
    "audio/ogg": "audio/ogg",
    "audio/opus": "audio/ogg",
    "audio/webm": "audio/webm",
    "audio/aac": "audio/aac",
    "audio/m4a": "audio/aac",
    "audio/x-m4a": "audio/aac",
    "audio/mp4": "audio/mp4",
    "audio/flac": "audio/flac",
    "audio/x-flac": "audio/flac",
  };
  return map[clean] || clean;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // --- Language selection (defaults to English) ---
    const language: "en" | "hi" = body.language === "hi" ? "hi" : "en";
    const languageLabel = language === "hi" ? "Hindi" : "English";

    let textToAnalyze = "";
    let audioDataForReasoning: { data: string; mimeType: string } | null = null;

    if (body.audioBase64 && body.mimeType) {
      // --- Audio Phase ---
      // Check payload size (~2.5MB binary is ~3.33MB in base64, safe under Vercel's 4.5MB limit)
      if (typeof body.audioBase64 === "string" && body.audioBase64.length > 3.8 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Audio file too large. Please keep it under 2.5MB." },
          { status: 413 }
        );
      }

      const normalizedMimeType = normalizeAudioMimeType(body.mimeType);

      audioDataForReasoning = {
        data: body.audioBase64,
        mimeType: normalizedMimeType,
      };

      const audioResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: normalizedMimeType,
              data: body.audioBase64,
            },
          },
          {
            text: "Transcribe the spoken content of this audio accurately and completely. Do not judge or filter based on topic — transcribe any clear human speech regardless of subject matter, length, or whether it seems scam-related. If there is no discernible speech at all — for example silence, instrumental music with no vocals, or unintelligible noise — output EXACTLY the word: NO_SPEECH_DETECTED. Only if the audio is unambiguously not a voice recording at all — for example pure background/ambient noise, a sound effect, or music — respond with exactly NOT_A_CALL instead of transcribing. Any audio containing actual spoken words, on any topic, should be transcribed normally.",
          },
        ],
      });

      const cleanAudioText = (audioResponse.text || "").trim();
      if (cleanAudioText.includes("NOT_A_CALL")) {
        return NextResponse.json(
          { error: "This doesn't look like a voice note or call recording. Try uploading a suspicious voice message or call excerpt." },
          { status: 400 }
        );
      }
      if (!cleanAudioText || cleanAudioText.includes("NO_SPEECH_DETECTED") || cleanAudioText.includes("NO_SPEECH_FOUND") || cleanAudioText.length < 3) {
        return NextResponse.json(
          { error: "No readable speech was detected in this audio. Try a clearer voice note or call recording." },
          { status: 400 }
        );
      }

      textToAnalyze = cleanAudioText;
    } else if (body.imageBase64 && body.mimeType) {
      // --- Image OCR Phase ---
      // Check payload size (~2.5MB binary is ~3.33MB in base64, safe under Vercel's 4.5MB limit)
      if (typeof body.imageBase64 === "string" && body.imageBase64.length > 3.8 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Image file too large. Please keep it under 2.5MB." },
          { status: 413 }
        );
      }

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
        { error: "Missing 'text', 'imageBase64', or 'audioBase64' field in request body." },
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

    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    const foundUrls = text.match(urlRegex) || [];
    if (foundUrls.length > 0) {
      ruleFlags.add("Contains link/URL");
    }

    // --- 2. Prepare Concurrent Promises ---
    
    // Promise 1: Safe Browsing API (Fails safely, never rejects)
    const safeBrowsingPromise = (async () => {
      if (foundUrls.length === 0 || !process.env.SAFE_BROWSING_API_KEY) return null;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.SAFE_BROWSING_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client: { clientId: "scam-shield", clientVersion: "1.0.0" },
            threatInfo: {
              threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
              platformTypes: ["ANY_PLATFORM"],
              threatEntryTypes: ["URL"],
              threatEntries: foundUrls.map(url => ({ url }))
            }
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) return null; // resolve silently on error
        const data = await response.json();
        return data.matches && data.matches.length > 0 ? true : false;
      } catch (err) {
        return null; // always resolve on any failure (timeout, network error, etc.)
      }
    })();

    // Promise 2: Pattern Matching (Embeddings)
    const patternMatchPromise = (async () => {
      if (scamPatterns.length === 0 || text.length <= 10) return null;
      try {
        const embedRes = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: text,
          config: { taskType: "RETRIEVAL_QUERY" },
        });
        
        const queryEmbedding = embedRes.embeddings?.[0]?.values || null;
        if (!queryEmbedding) return null;
        
        let bestMatch = null;
        let highestSim = -1;
        
        for (const pattern of scamPatterns) {
          const sim = cosineSimilarity(queryEmbedding, pattern.embedding);
          if (sim > highestSim) {
            highestSim = sim;
            bestMatch = pattern;
          }
        }
        
        if (bestMatch && highestSim > 0.7) {
          return { matchName: bestMatch.name, queryEmbedding };
        }
        return { matchName: null, queryEmbedding };
      } catch (err) {
        console.warn("Pattern matching failed:", err);
        return null;
      }
    })();

    // Promise 3: Gemini AI Call
    const geminiPromise = (async () => {
      const audioGuidance = audioDataForReasoning
        ? `
AUDIO ANALYSIS INSTRUCTIONS:
The attached audio is provided alongside the transcript above. In addition to analyzing the spoken words, evaluate the delivery, tone, cadence, and acoustic characteristics of the speech:

1. Audio-Specific Flags Vocabulary:
   - "Scripted or robotic delivery": The speaker sounds unnaturally mechanical, monotone, reading from a rigid script without natural human inflections, or exhibits artificial cadence.
   - "Generic call-center ambience": Background sounds characteristic of a call-center environment — overlapping call chatter, hold-queue noise, headset audio quality — rather than a single person's normal calling environment.
   - "Delivery inconsistent with message urgency": Specifically when the tone is flat, calm, or disengaged while the words describe severe/urgent consequences (e.g. claiming imminent arrest or account freeze in a routine, unemotional, or clearly prerecorded manner). Do not flag the reverse — a genuinely distressed or emotional speaker describing a real problem is not itself suspicious.

2. Guardrails (Strict):
   - Do NOT flag accent, non-native pronunciation, regional speech patterns, or speech impediments as robotic or scripted.
   - Do NOT attempt to identify, verify, or describe who the speaker is — no voice-biometric or speaker-identity judgments, only delivery characteristics of the speech itself.
   - Legitimate automated systems (bank IVR, appointment reminders) can sound robotic without being scams — treat delivery as one signal among several feeding the overall score, not a standalone verdict, and avoid flagging clearly-labeled automated/IVR systems just for sounding automated.
`
        : "";

      const prompt = `Analyze the following message for scam patterns.
Return a JSON object with EXACTLY the following structure:
{
  "riskScore": number (0 to 100, where 100 is definite scam and 0 is completely safe),
  "flags": array of strings (specific red flags found, e.g., "Requests sensitive info"),
  "explanation": string (plain-language explanation of why it looks risky or safe),
  "financialLossLikely": boolean (true ONLY if the message text strongly suggests the recipient has ALREADY sent money, made a payment, or suffered a financial loss — e.g. "I already transferred", "money was deducted". False for suspected/attempted scams where no loss has occurred yet.),
  "complaintDraft": string (if riskScore >= 75, produce a filled-in fraud complaint draft in this format:
"Suspected Scam Type: [type, e.g. Bank KYC Fraud / OTP Scam / Lottery Fraud / Investment Scam / etc.]

Description: [2-3 sentence plain description of what the fraudulent message claimed and what it asked the recipient to do]

Entities Involved:
[List ONLY entities that actually appear in the message text — phone numbers, WhatsApp numbers, URLs/links, UPI IDs, email addresses, amounts of money mentioned. If none are present in the text, write: None identified in this message.]

Recommended Action: [one sentence on what the recipient should do next]"

If riskScore is below 75, return an empty string for this field. Extract entities only from what is literally present in the message — do not invent or guess.)
}
${audioGuidance}
IMPORTANT: Write the "explanation" field in ${languageLabel}. Keep all "flags" array values in English. Write "complaintDraft" in English regardless of language setting.

Message to analyze:
"""
${text}
"""
`;

      try {
        const geminiContents = audioDataForReasoning
          ? [
              {
                inlineData: {
                  mimeType: audioDataForReasoning.mimeType,
                  data: audioDataForReasoning.data,
                },
              },
              {
                text: prompt,
              },
            ]
          : prompt;

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: geminiContents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                riskScore: { type: Type.INTEGER },
                flags: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING },
                financialLossLikely: { type: Type.BOOLEAN },
                complaintDraft: { type: Type.STRING },
              },
              required: ["riskScore", "flags", "explanation", "financialLossLikely", "complaintDraft"],
            },
          },
        });
        
        const rawText = response.text || "{}";
        const cleanedJsonText = rawText.replace(/^```json\s*/, "").replace(/```$/, "").trim();
        return JSON.parse(cleanedJsonText);
      } catch (e) {
        console.error("Gemini analysis failed:", e);
        return {
          explanation: "Something went wrong analysing this — please try again."
        };
      }
    })();

    // --- 3. Execute Concurrently and Merge Results ---
    const [isMaliciousLink, patternMatchResult, aiResult] = await Promise.all([
      safeBrowsingPromise,
      patternMatchPromise,
      geminiPromise
    ]);

    if (isMaliciousLink) {
      ruleFlags.add("⚠️ Known malicious link");
    }
    
    if (patternMatchResult && patternMatchResult.matchName) {
      ruleFlags.add(`Matches known pattern: ${patternMatchResult.matchName}`);
    }

    const aiFlags = Array.isArray(aiResult.flags) ? aiResult.flags : [];
    const finalFlags = Array.from(new Set([...ruleFlags, ...aiFlags]));

    const finalResponse = {
      text: text, // provide the analyzed text
      riskScore: typeof aiResult.riskScore === 'number' ? aiResult.riskScore : (ruleFlags.size > 0 ? 50 : 0),
      flags: finalFlags,
      explanation: aiResult.explanation || "No explanation provided.",
      embedding: patternMatchResult ? patternMatchResult.queryEmbedding : null,
      complaintDraft: typeof aiResult.complaintDraft === 'string' ? aiResult.complaintDraft : "",
      financialLossLikely: aiResult.financialLossLikely === true,
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

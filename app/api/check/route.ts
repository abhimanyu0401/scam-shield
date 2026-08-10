import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Phase 1: hardcoded fake response.
  // Phase 2 will replace this with a real Gemini API call.
  const body = await req.json();

  if (!body?.text || typeof body.text !== "string" || body.text.trim() === "") {
    return NextResponse.json(
      { error: "Missing or empty 'text' field in request body." },
      { status: 400 }
    );
  }

  const fakeResponse = {
    riskScore: 78,
    flags: ["Urgency language", "Requests OTP"],
    explanation: "This is a placeholder explanation.",
  };

  return NextResponse.json(fakeResponse);
}

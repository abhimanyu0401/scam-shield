import { Type, Schema } from "@google/genai";

const schema: Schema = {
  type: Type.OBJECT,
  properties: {
    riskScore: { type: Type.INTEGER },
    flags: { type: Type.ARRAY, items: { type: Type.STRING } },
    explanation: { type: Type.STRING }
  },
  required: ["riskScore", "flags", "explanation"]
};
console.log("Success", schema);

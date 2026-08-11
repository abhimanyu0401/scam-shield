import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Ensure we load env variables for the API key (assumes running from project root)
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

interface Pattern {
  id: string;
  name: string;
  text: string;
}

interface PatternWithEmbedding extends Pattern {
  embedding: number[];
}

async function run() {
  const libDir = path.join(process.cwd(), "lib");
  const patternsFile = path.join(libDir, "scam-patterns.json");
  const outputFile = path.join(libDir, "scam-pattern-embeddings.json");

  // Read the source patterns
  let rawData = "";
  try {
    rawData = fs.readFileSync(patternsFile, "utf8");
  } catch (err) {
    console.error(`Failed to read ${patternsFile}:`, err);
    process.exit(1);
  }

  const patterns: Pattern[] = JSON.parse(rawData);
  console.log(`Loaded ${patterns.length} patterns from ${patternsFile}`);

  // Extract all the texts to batch embed
  const contentsToEmbed = patterns.map((p) => p.text);

  console.log("Calling Gemini API to compute embeddings...");
  
  try {
    const res = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: contentsToEmbed,
      config: {
        taskType: "RETRIEVAL_DOCUMENT",
      },
    });

    const embeddings = res.embeddings;
    if (!embeddings || embeddings.length !== patterns.length) {
      console.error("Mismatch: Expected", patterns.length, "embeddings, but got", embeddings?.length);
      process.exit(1);
    }

    // Zip patterns with their computed embeddings
    const computedLibrary: PatternWithEmbedding[] = patterns.map((pattern, i) => {
      const values = embeddings[i].values;
      if (!values) {
        throw new Error(`Missing embedding values at index ${i}`);
      }
      return {
        ...pattern,
        embedding: values,
      };
    });

    fs.writeFileSync(outputFile, JSON.stringify(computedLibrary, null, 2));
    console.log(`✅ Successfully saved ${computedLibrary.length} embeddings to ${outputFile}`);

  } catch (err) {
    console.error("Failed to generate embeddings:", err);
  }
}

run();

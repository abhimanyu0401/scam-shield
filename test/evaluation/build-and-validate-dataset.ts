import * as fs from "fs";
import * as path from "path";
import { englishScams, englishLegitimate } from "../samples/text/english/data-english";
import { hindiScams, hindiLegitimate } from "../samples/text/hindi/data-hindi";
import { hinglishScams, hinglishLegitimate } from "../samples/text/hinglish/data-hinglish";
import { multilingualScams, multilingualLegitimate } from "../samples/text/multilingual/data-multilingual";
import type { BenchmarkSample } from "./types";

function main() {
  console.log("=======================================================");
  console.log("   Building & Validating ScamShield 480-Sample Dataset ");
  console.log("=======================================================");

  const allSamples: BenchmarkSample[] = [
    ...englishScams,
    ...englishLegitimate,
    ...hindiScams,
    ...hindiLegitimate,
    ...hinglishScams,
    ...hinglishLegitimate,
    ...multilingualScams,
    ...multilingualLegitimate,
  ];

  console.log(`\nTotal samples gathered: ${allSamples.length}`);

  // 1. Check Total and Label Balance
  const scams = allSamples.filter((s) => s.label === "scam");
  const legit = allSamples.filter((s) => s.label === "legitimate");

  console.log(`Scams: ${scams.length}`);
  console.log(`Legitimate: ${legit.length}`);

  if (allSamples.length !== 480) {
    throw new Error(`Expected 480 samples, got ${allSamples.length}`);
  }
  if (scams.length !== 240 || legit.length !== 240) {
    throw new Error(`Dataset is not balanced! Scams: ${scams.length}, Legit: ${legit.length}`);
  }

  // 2. Check Language Breakdown
  const languages = ["english", "hindi", "hinglish", "marathi", "urdu", "french", "german"] as const;
  const langExpected: Record<string, { scam: number; legit: number }> = {
    english: { scam: 80, legit: 80 },
    hindi: { scam: 60, legit: 60 },
    hinglish: { scam: 60, legit: 60 },
    marathi: { scam: 10, legit: 10 },
    urdu: { scam: 10, legit: 10 },
    french: { scam: 10, legit: 10 },
    german: { scam: 10, legit: 10 },
  };

  console.log("\n--- Language Distribution ---");
  for (const lang of languages) {
    const lScams = allSamples.filter((s) => s.language === lang && s.label === "scam").length;
    const lLegit = allSamples.filter((s) => s.language === lang && s.label === "legitimate").length;
    const exp = langExpected[lang];
    console.log(`  ${lang.toUpperCase().padEnd(10)}: Total=${(lScams + lLegit).toString().padStart(3)} | Scam=${lScams.toString().padStart(2)} (exp ${exp.scam}) | Legit=${lLegit.toString().padStart(2)} (exp ${exp.legit})`);
    if (lScams !== exp.scam || lLegit !== exp.legit) {
      throw new Error(`Mismatch in language ${lang}: got scam=${lScams}, legit=${lLegit}`);
    }
  }

  // 3. Check for Duplicate IDs and Duplicate Messages
  const seenIds = new Set<string>();
  const seenMessages = new Set<string>();

  for (const s of allSamples) {
    if (seenIds.has(s.sampleId)) {
      throw new Error(`Duplicate sampleId found: ${s.sampleId}`);
    }
    seenIds.add(s.sampleId);

    const normMsg = s.message.trim().toLowerCase();
    if (seenMessages.has(normMsg)) {
      throw new Error(`Duplicate message found in sample ${s.sampleId}: "${s.message}"`);
    }
    seenMessages.add(normMsg);
  }
  console.log("\n[PASS] No duplicate sampleIds or duplicate messages found.");

  // 4. Check Difficulty Distribution for English, Hindi, Hinglish
  console.log("\n--- Difficulty Distribution ---");
  const primaryLangs = ["english", "hindi", "hinglish"] as const;
  for (const lang of primaryLangs) {
    const subset = allSamples.filter((s) => s.language === lang);
    const easy = subset.filter((s) => s.difficulty === "easy").length;
    const med = subset.filter((s) => s.difficulty === "medium").length;
    const hard = subset.filter((s) => s.difficulty === "hard").length;
    const total = subset.length;
    console.log(`  ${lang.toUpperCase().padEnd(10)}: Easy=${easy} (${Math.round((easy / total) * 100)}%) | Med=${med} (${Math.round((med / total) * 100)}%) | Hard=${hard} (${Math.round((hard / total) * 100)}%)`);
  }

  // 5. Check Category / Domain Diversity
  const categories = new Set(allSamples.map((s) => s.domain));
  console.log(`\n--- Categories & Domains ---`);
  console.log(`Total unique domains/categories covered: ${categories.size}`);

  const categoryCounts: Record<string, { scam: number; legit: number }> = {};
  for (const s of allSamples) {
    if (!categoryCounts[s.domain]) categoryCounts[s.domain] = { scam: 0, legit: 0 };
    if (s.label === "scam") categoryCounts[s.domain].scam++;
    else categoryCounts[s.domain].legit++;
  }

  const sortedCats = Object.entries(categoryCounts).sort((a, b) => (b[1].scam + b[1].legit) - (a[1].scam + a[1].legit));
  console.log("Top 15 Categories by Volume:");
  for (const [cat, counts] of sortedCats.slice(0, 15)) {
    console.log(`  - ${cat.padEnd(35)}: Scam=${counts.scam}, Legit=${counts.legit}, Total=${counts.scam + counts.legit}`);
  }

  // 6. Write JSON and CSV files to test/benchmarks/text/
  const outputDir = path.join(__dirname, "../benchmarks/text");
  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, "scamshield-text-benchmark.json");
  const csvPath = path.join(outputDir, "scamshield-text-benchmark.csv");

  fs.writeFileSync(jsonPath, JSON.stringify(allSamples, null, 2), "utf-8");
  console.log(`\n[SUCCESS] Wrote JSON dataset to: ${jsonPath}`);

  // Create CSV
  const csvHeaders = ["sampleId", "label", "language", "domain", "difficulty", "expectedRiskBand", "expectedMajorSignals", "notes", "message"];
  const csvRows = [
    csvHeaders.join(","),
    ...allSamples.map((s) => {
      const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
      return [
        s.sampleId,
        s.label,
        s.language,
        escapeCsv(s.domain),
        s.difficulty,
        s.expectedRiskBand,
        escapeCsv(s.expectedMajorSignals.join("; ")),
        escapeCsv(s.notes),
        escapeCsv(s.message),
      ].join(",");
    }),
  ];

  fs.writeFileSync(csvPath, csvRows.join("\n"), "utf-8");
  console.log(`[SUCCESS] Wrote CSV dataset to: ${csvPath}`);
}

main();

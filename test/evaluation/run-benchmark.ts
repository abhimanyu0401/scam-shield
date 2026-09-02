/**
 * test/evaluation/run-benchmark.ts
 *
 * Production-Path 480-Sample Benchmark Runner for ScamShield.
 * Supports both LIVE-AI and DETERMINISTIC-FALLBACK evaluation modes.
 */

import { loadEnvConfig } from "@next/env";
// 1. Load Next.js environment variables (.env.local, .env) at startup
loadEnvConfig(process.cwd());

import * as fs from "fs";
import * as path from "path";
import { NextRequest } from "next/server";
import { POST } from "../../app/api/check/route";
import type { BenchmarkSample, EvaluationResultRow, RiskBandType } from "./types";
import { runResilienceSuite, type ResilienceReportData } from "./run-resilience-suite";

const BENCHMARK_JSON_PATH = path.join(__dirname, "../benchmarks/text/scamshield-text-benchmark.json");

// Classification threshold for scam determination
const SCAM_DECISION_THRESHOLD = 60;

function getRiskBand(score: number): RiskBandType {
  if (score <= 20) return "0-20";
  if (score <= 40) return "21-40";
  if (score <= 60) return "41-60";
  if (score <= 80) return "61-80";
  return "81-100";
}

function calculateMetrics(rows: EvaluationResultRow[]) {
  const tp = rows.filter((r) => r.classificationType === "TP").length;
  const tn = rows.filter((r) => r.classificationType === "TN").length;
  const fp = rows.filter((r) => r.classificationType === "FP").length;
  const fn = rows.filter((r) => r.classificationType === "FN").length;

  const total = rows.length;
  const totalScams = tp + fn;
  const totalLegit = tn + fp;

  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = totalScams > 0 ? tp / totalScams : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const fpr = totalLegit > 0 ? fp / totalLegit : 0;
  const fnr = totalScams > 0 ? fn / totalScams : 0;
  const scamDetectionRate = recall;
  const legitAcceptanceRate = totalLegit > 0 ? tn / totalLegit : 0;

  return {
    total,
    tp,
    tn,
    fp,
    fn,
    totalScams,
    totalLegit,
    accuracy,
    precision,
    recall,
    f1,
    fpr,
    fnr,
    scamDetectionRate,
    legitAcceptanceRate,
  };
}

function calculatePercentiles(latencies: number[]) {
  if (latencies.length === 0) return { min: 0, avg: 0, median: 0, p95: 0, max: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  return { min, avg, median, p95, max };
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runBenchmark() {
  console.log("=======================================================");
  console.log("       ScamShield Production Benchmark Runner          ");
  console.log("=======================================================");

  const targetMode = process.argv.includes("--deterministic") ? "deterministic" : "live";

  // Safe Provider Configuration Detection (NEVER prints key values)
  const isGeminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== "");
  const isGroqConfigured = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== "");

  console.log("\n--- Provider Configuration Status ---");
  console.log(`  GEMINI configured: ${isGeminiConfigured}`);
  console.log(`  GROQ configured:   ${isGroqConfigured}`);
  console.log(`  Target Mode:       ${targetMode.toUpperCase()}`);

  if (targetMode === "live" && !isGeminiConfigured && !isGroqConfigured) {
    console.error("\n[ABORT] Cannot execute LIVE-AI benchmark:");
    console.error("  Neither GEMINI_API_KEY nor GROQ_API_KEY is configured in the environment / .env.local.");
    console.error("  To test deterministic fallback specifically, run with '--deterministic'.");
    process.exit(1);
  }

  if (!fs.existsSync(BENCHMARK_JSON_PATH)) {
    throw new Error(`Benchmark dataset not found at ${BENCHMARK_JSON_PATH}. Run build-and-validate-dataset.ts first.`);
  }

  const rawData = fs.readFileSync(BENCHMARK_JSON_PATH, "utf-8");
  const dataset: BenchmarkSample[] = JSON.parse(rawData);

  console.log(`\nLoaded ${dataset.length} samples from ${BENCHMARK_JSON_PATH}`);
  console.log(`Starting execution through POST /api/check ...\n`);

  const results: EvaluationResultRow[] = [];
  const startTime = Date.now();

  const origGeminiKey = process.env.GEMINI_API_KEY;
  const origGroqKey = process.env.GROQ_API_KEY;
  if (targetMode === "deterministic") {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
  }

  try {
    for (let i = 0; i < dataset.length; i++) {
      const sample = dataset[i];
      const langCode = sample.language === "hindi" ? "hi" : "en";

      // Distribute IP across samples to test through clean rate limiter
      const clientIp = `10.0.${Math.floor(i / 4)}.${(i % 4) + 1}`;

      const req = new NextRequest("http://localhost:3000/api/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify({
          text: sample.message,
          language: langCode,
        }),
      });

      const itemStart = Date.now();
      try {
        const res = await POST(req);
        const latency = Date.now() - itemStart;
        const data = await res.json();

        const predictedScore = typeof data.riskScore === "number" ? data.riskScore : 0;
        const predictedFlags: string[] = Array.isArray(data.flags) ? data.flags : [];
        const predictedExplanation = typeof data.explanation === "string" ? data.explanation : "";
        const predictedBand = getRiskBand(predictedScore);

        const isPredictedScam = predictedScore >= SCAM_DECISION_THRESHOLD;
        const isActualScam = sample.label === "scam";

        let classificationType: "TP" | "TN" | "FP" | "FN";
        if (isActualScam && isPredictedScam) classificationType = "TP";
        else if (!isActualScam && !isPredictedScam) classificationType = "TN";
        else if (!isActualScam && isPredictedScam) classificationType = "FP";
        else classificationType = "FN";

        const isCorrect = classificationType === "TP" || classificationType === "TN";

        const row: EvaluationResultRow = {
          sampleId: sample.sampleId,
          label: sample.label,
          language: sample.language,
          domain: sample.domain,
          message: sample.message,
          difficulty: sample.difficulty,
          expectedRiskBand: sample.expectedRiskBand,
          predictedScore,
          predictedBand,
          predictedFlags,
          predictedExplanation,
          isPredictedScam,
          isCorrect,
          classificationType,
          modelId: data.modelId || "unknown",
          providerId: data.providerId || "unknown",
          analysisMode: data.analysisMode || "unknown",
          isFallback: Boolean(data.isFallback),
          isDegraded: Boolean(data.isDegraded),
          financialLossLikely: Boolean(data.financialLossLikely),
          hasComplaintDraft: Boolean(data.complaintDraft && data.complaintDraft.length > 0),
          latencyMs: latency,
        };

        results.push(row);

        const statusIcon = isCorrect ? "✓" : "✗";
        console.log(`[${(i + 1).toString().padStart(3)}/${dataset.length}] ${statusIcon} [${row.classificationType}] ${sample.sampleId} | Score: ${predictedScore.toString().padStart(3)} | Mode: ${row.analysisMode} (${row.providerId}/${row.modelId}) | ${latency}ms`);
      } catch (err: unknown) {
        console.error(`Error on sample ${sample.sampleId}:`, err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.push({
          sampleId: sample.sampleId,
          label: sample.label,
          language: sample.language,
          domain: sample.domain,
          message: sample.message,
          difficulty: sample.difficulty,
          expectedRiskBand: sample.expectedRiskBand,
          predictedScore: 0,
          predictedBand: "0-20",
          predictedFlags: [],
          predictedExplanation: "",
          isPredictedScam: false,
          isCorrect: sample.label === "legitimate",
          classificationType: sample.label === "scam" ? "FN" : "TN",
          modelId: "error",
          providerId: "error",
          analysisMode: "error",
          isFallback: false,
          isDegraded: true,
          financialLossLikely: false,
          hasComplaintDraft: false,
          latencyMs: Date.now() - itemStart,
          error: errorMsg,
        });
      }

      await sleep(targetMode === "live" ? 150 : 20);
    }
  } finally {
    if (targetMode === "deterministic") {
      process.env.GEMINI_API_KEY = origGeminiKey;
      process.env.GROQ_API_KEY = origGroqKey;
    }
  }

  const totalEvaluationMs = Date.now() - startTime;
  console.log(`\nCompleted evaluation of ${results.length} samples in ${(totalEvaluationMs / 1000).toFixed(1)}s.`);

  const geminiCount = results.filter((r) => r.providerId === "gemini").length;
  const groqCount = results.filter((r) => r.providerId === "groq").length;
  const deterministicCount = results.filter((r) => r.providerId === "deterministic" || r.analysisMode === "degraded-deterministic").length;
  const degradedCount = results.filter((r) => r.isDegraded).length;
  const fallbackCount = results.filter((r) => r.isFallback).length;

  console.log("\n--- Execution Breakdown ---");
  console.log(`  Gemini responses:        ${geminiCount} (${((geminiCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Groq responses:          ${groqCount} (${((groqCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Deterministic fallback:  ${deterministicCount} (${((deterministicCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`  Degraded responses:      ${degradedCount}`);
  console.log(`  Fallback responses:      ${fallbackCount}`);

  // Save raw results in test/benchmarks/text/
  const modeJsonPath = path.join(__dirname, `../benchmarks/text/results-${targetMode}-raw.json`);
  fs.writeFileSync(modeJsonPath, JSON.stringify(results, null, 2), "utf-8");
  console.log(`Saved raw results to: ${modeJsonPath}`);

  // Run Resilience Suite
  const resilienceData: ResilienceReportData = await runResilienceSuite();
  console.log(`Resilience Suite: ${resilienceData.assertionsPassed}/${resilienceData.assertionsTotal} assertions passed.`);
}

if (require.main === module) {
  runBenchmark().then(() => {
    console.log("\n[ALL TASKS COMPLETED] Benchmark run finished.");
  });
}

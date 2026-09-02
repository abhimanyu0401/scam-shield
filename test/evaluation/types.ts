/**
 * test/evaluation/types.ts
 *
 * Types and contracts for the ScamShield 480-sample evaluation benchmark.
 */

export type LabelType = "scam" | "legitimate";

export type LanguageType =
  | "english"
  | "hindi"
  | "hinglish"
  | "marathi"
  | "urdu"
  | "french"
  | "german";

export type DifficultyType = "easy" | "medium" | "hard";

export type RiskBandType = "0-20" | "21-40" | "41-60" | "61-80" | "81-100";

export interface BenchmarkSample {
  sampleId: string;
  label: LabelType;
  language: LanguageType;
  domain: string;
  message: string;
  expectedRiskBand: RiskBandType;
  expectedMajorSignals: string[];
  difficulty: DifficultyType;
  notes: string;
}

export interface EvaluationResultRow {
  sampleId: string;
  label: LabelType;
  language: LanguageType;
  domain: string;
  message: string;
  difficulty: DifficultyType;
  expectedRiskBand: RiskBandType;
  predictedScore: number;
  predictedBand: RiskBandType;
  predictedFlags: string[];
  predictedExplanation: string;
  isPredictedScam: boolean;
  isCorrect: boolean;
  classificationType: "TP" | "TN" | "FP" | "FN";
  modelId: string;
  providerId: string;
  analysisMode: string;
  isFallback: boolean;
  isDegraded: boolean;
  financialLossLikely: boolean;
  hasComplaintDraft: boolean;
  latencyMs: number;
  error?: string;
}

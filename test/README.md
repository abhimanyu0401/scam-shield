# ScamShield Test, Benchmark & Evaluation Repository

This directory contains the canonical evaluation datasets, sample collections, benchmark telemetry, and authoritative evaluation reports for **ScamShield**.

---

## Directory Structure

```text
test/
├── README.md                                # This document
├── report/
│   └── SCAMSHIELD_EVALUATION_REPORT.md      # The SINGLE authoritative evaluation report
├── samples/
│   ├── text/
│   │   ├── english/
│   │   │   └── data-english.ts              # 160 English samples (80 scam / 80 legit)
│   │   ├── hindi/
│   │   │   └── data-hindi.ts                # 120 Hindi Devanagari samples (60 scam / 60 legit)
│   │   ├── hinglish/
│   │   │   └── data-hinglish.ts             # 120 Hinglish samples (60 scam / 60 legit)
│   │   └── multilingual/
│   │       └── data-multilingual.ts         # 80 Multilingual samples (Marathi, Urdu, French, German)
│   ├── audio/
│   │   └── README.md                        # Documentation of synthetic audio tests & media status
│   └── image/
│       └── README.md                        # Documentation of screenshot evaluation methodology
├── benchmarks/
│   ├── text/
│   │   ├── scamshield-text-benchmark.json   # Canonical 480-sample dataset (JSON)
│   │   ├── scamshield-text-benchmark.csv    # Canonical 480-sample dataset (CSV)
│   │   ├── results-deterministic-raw.json   # Raw execution telemetry from deterministic run
│   │   └── results-live-raw.json            # Raw execution telemetry from live AI run
│   ├── audio/
│   │   └── README.md                        # Audio benchmark notes
│   └── image/
│       └── README.md                        # Image benchmark notes
└── evaluation/
    ├── types.ts                             # Benchmark TypeScript types
    ├── build-and-validate-dataset.ts        # Dataset compiler & validator
    ├── run-benchmark.ts                     # Production endpoint benchmark harness
    └── run-resilience-suite.ts              # Architectural resilience regression suite
```

---

## Reproducibility & Commands

### 1. Validate Dataset Integrity
```bash
npx tsx test/evaluation/build-and-validate-dataset.ts
```
Verifies 480 balanced samples, 0 duplicate IDs/texts, 7 languages, and 93 categories.

### 2. Run Architectural Resilience Suite
```bash
npx tsx test/evaluation/run-resilience-suite.ts
```
Verifies multi-model fallback, fail-open behavior, input validation, and privacy guards.

### 3. Run Permanent Product Regression Tests
```bash
npx tsx scripts/test-b5.ts
npx tsx scripts/test-b6.ts
npx tsx scripts/test-b7.ts
npx tsx scripts/test-b8.ts
npx tsx scripts/test-b9.ts
npx tsx scripts/test-resilience-e2e.ts
npx tsx scripts/test-word-boundary.ts
```

### 4. Run Deterministic Baseline Benchmark
```bash
npx tsx test/evaluation/run-benchmark.ts --deterministic
```

### 5. Run Live Multi-Model AI Benchmark
```bash
npx tsx test/evaluation/run-benchmark.ts
```
*(Requires `GEMINI_API_KEY` and `GROQ_API_KEY` configured in `.env.local`)*

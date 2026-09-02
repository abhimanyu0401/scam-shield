# Image & Screenshot Test Samples

## Overview
ScamShield's multimodal OCR and visual threat extraction pipeline evaluates phishing screenshots, fake payment receipts, electricity disconnection notices, and fraudulent APK download prompts.

## Preliminary Evaluation Findings ($n = 80$)
- **Scam Detection Recall:** 95.0%
- **Accuracy (Preliminary):** 68.8%
- **Precision (Preliminary):** 62.3%

## Open Verification Gaps
1. **Corpus / Template Confound:** False positives occurred when benign screenshots shared layout structures with common scam templates.
2. **Hinglish Visual Rendering:** Automated visual verification on rendered Hinglish script is pending live device telemetry.

*(Note: Raw image files are excluded from git tracking to maintain a lightweight repository footprint).*

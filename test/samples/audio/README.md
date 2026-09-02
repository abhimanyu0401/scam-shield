# Audio Test Samples

## Overview
Audio analysis in ScamShield is evaluated using synthetic buffers, simulated voice note payloads, and acoustic property test suites.

## Evaluation Coverage
- **Silence & Non-Speech Guards:** Verified in `scripts/test-silence-guards.ts` and `scripts/test-b7.ts`. Ensures audio containing pure silence or non-speech background noise safely triggers `NO_SPEECH_DETECTED` (HTTP 400) without hallucinating malicious scam text.
- **Cadence & Urgency Cues:** Audio transcription evaluates delivery tone, automated IVR phrasing, and urgency cues.
- **Payload Limits:** Audio files larger than 2.5MB return HTTP 413.

*(Note: Raw call audio recordings are not stored locally in this repository to protect user and media privacy).*

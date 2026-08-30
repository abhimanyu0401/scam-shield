# Scam Shield — Live Status

_Update this when you start, pause, or finish a session — and always as part of your PR. This is a status board, not documentation (that's roadmap.md)._

---

## 🔨 In Progress

| Phase | Feature | Owner | Branch | Status |
|---|---|---|---|---|
| 10 | Audio-specific flags (cadence/phrasing) | Sneha | `feature/audio-specific-flags` | Ready to merge — Delivery reasoning, Unicode word boundaries, silence guards & 10-test matrix fully verified |
| Fix | Regex word-boundary keyword matching | Sneha | `fix/regex-word-boundary` | Ready to merge — isolated keyword word-boundary fix |
| 10 | In-browser live recording | Sneha/Abhash | `feature/live-recording` | Ready to start — depends on merged audio branches |
| 11 | Named community confirmations | Abhimanyu | `feature/community-confirmations` | Ready to start — Phase 9 schema & Phase B1-B10 AI resilience fully complete |

## ✅ Done & Merged

- Phases 1-8 (see `roadmap.md` Section 2 for full detail)
- Phase 9a: Supabase auth foundation (`feature/supabase-auth`, merged)
- Phase 9b: Groups & invite-only circles (`feature/circles-groups`, merged) — invite-code display, state-leak on auth transitions, auth-gated Radar view, permanent join/create entry points, state consolidated into `useGroups` hook
- **Phase 9c: Multi-group reporting** (`feature/multi-group-reporting`, completed & verified) — single canonical report submission to multiple groups simultaneously, immediate `groupIds` deduplication, server-side `group_members` authorization guard (HTTP 403 Forbidden security), strictly isolated per-group `clusterIds: Record<string, string>` map, canonical Redis key `report:${id}` with 60-day TTL, and multi-group toggle UI defaulting to active circle.
- Phase 10: Voice/audio input v1 (`feature/audio-input`, merged) — v1 audio transcription: file upload only (.mp3, .wav, .m4a, .ogg, .webm, .aac; in-browser recording deferred to buffer days), generic flags only (audio-specific cadence/phrasing flags deferred)
- **Phase B1–B10: Production AI Resilience Subsystem** (`feature/API-rate-limiting-and-fallback`, completed & verified)

---

## 🛡️ AI Resilience Architecture (Phases B1–B10 Implemented & Verified)

### Components Implemented
- **Multi-Model AI Router**: Capability-filtered routing (`text`, `ocr`, `audio`), iterating candidate models (`gemini-3.5-flash-lite` → `gemini-3.5-flash` → `gemini-3.1-flash-lite` → `openai/gpt-oss-120b`).
- **Provider Adapters**: Gemini SDK adapter (`@google/genai`) and Groq OpenAI-compatible HTTP adapter.
- **Deterministic Fallback Engine**: Rule-based scoring, CFN scam rules, benign suppressors, precomputed static vector embeddings (`gemini-embedding-001`), and Google Safe Browsing Lookup API v4.
- **Deadline Management**: Single global request `DeadlineTracker` (20,000ms ceiling) enforcing a 250ms minimum remaining-budget guard before candidate socket dispatches.
- **Circuit Breaker**: Redis-backed state machine (`CLOSED` → `OPEN` → `HALF_OPEN`), atomic Lua evaluation, single-probe exclusivity on cooldown expiry, and atomic `revertHalfOpen` if probes are skipped.
- **Quota & Rate Limiter**: Single-pass Lua quota reservation (`RESERVE_BOTH_LUA`) tracking RPM/RPD per model with full `QuotaExhaustedError` isolation (does NOT trip circuit breakers).
- **Redis Fail-Open**: Infrastructure timeouts (500ms), `retry: false`, and fail-open state returns (`"proceed"`, `"ALLOWED"`) preventing Redis outages from blocking scam detection.
- **Privacy & Security**: Server-only API keys (`SAFE_BROWSING_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`) with metadata-only telemetry (zero user text/phones/URLs logged).

### Production Fallback Execution Flow
1. **Primary AI Success**: Primary model (`gemini-3.5-flash-lite`) succeeds → `analysisMode = "ai"`, `isFallback = false`, `isDegraded = false`.
2. **Provider Failure**: Primary model fails (500/503/429/timeout) → router advances to next eligible candidate (`gemini-3.5-flash` / Groq) → `analysisMode = "ai"`, `isFallback = true`, `isDegraded = false`.
3. **Quota Exhausted**: Candidate throws `QuotaExhaustedError` → model skipped immediately without recording circuit failure → router continues to next model.
4. **All AI Unavailable**: All AI candidates fail or exhaust quota → router delegates to deterministic fallback engine → `analysisMode = "degraded-deterministic"`, `isFallback = true`, `isDegraded = true`, `providerId = "deterministic"`, `modelId = "deterministic-fallback"`, `complaintDraft = ""`, `financialLossLikely = false`.
5. **Redis Offline**: Redis outage or timeout → fail-open behavior allows scam analysis to complete via live AI or deterministic engine without throwing 500 errors.

---

## 🧪 Verification Results

| Suite / Check | Assertions / Status | Outcome |
|---|---|---|
| **TypeScript Compilation (`tsc --noEmit`)** | 0 errors | **PASS** |
| **Phase B5 (Normalization & Convergence)** | 20 / 20 passed | **PASS** |
| **Phase B6 (Deterministic Deepening)** | 58 / 58 passed | **PASS** |
| **Phase B7 (Production Route Integration)** | 47 / 47 passed | **PASS** |
| **Phase B8 (Resilience & Redis Hardening)** | 19 / 19 passed | **PASS** |
| **Phase B9 (Safe Browsing Production Wiring)** | 32 / 32 passed | **PASS** |
| **Phase B10 (Localhost Production-Path Resilience)** | 35 / 35 passed | **PASS** |
| **Unicode Word-Boundary Suite (`test-word-boundary.ts`)** | 17 / 17 passed | **PASS** |
| **Silence Guard Suite (`test-silence-guards.ts`)** | 5 / 5 passed | **PASS** |
| **Full 10-Test Multimodal Integration Matrix** | 10 / 10 passed | **PASS** |

### Manual Localhost Fallback Verification
- Gemini available → Primary Gemini selected (`gemini-3.5-flash-lite`).
- Gemini unavailable + Groq available → Groq selected (`openai/gpt-oss-120b`).
- Gemini + Groq unavailable → Deterministic fallback executed (`analysisMode: "degraded-deterministic"`).

---

## ⏳ Waiting / Blocked

- Phase 12 frontend (accessibility/verdict banner) — ready to start, independent

---

## ⚠️ Known issues / things to flag for others

- **Phase 11 note (Confirmations & Delete schema dependency)**: `CircleReport` schema has migrated from `circleId: string` to `groupIds: string[]` and `clusterIds: Record<string, string>` (clean break, `circleId` removed). Canonical report is stored under `report:${id}` with a 60-day Redis TTL (`{ ex: 5184000 }`). When deleting a report in Phase 11, it must be removed from EVERY `circle:${gid}` list listed in `groupIds` as well as the canonical `report:${id}` key.
- Phase 10 v1 limitation: Audio detection quality depends on Gemini transcription with no fallback on noisy/accented/compressed audio.
- Phase 10 prompt note: `NOT_A_CALL` guard is strictly topic-blind to avoid false-rejecting clean speech.
- Phase 10 model/quota handoff note: Model routing for audio now flows through the Phase B AI resilience router (`lib/ai/router.ts`), eliminating hardcoded model IDs in `route.ts`.
- Audio checks can silently fall back to text-only scoring (no acoustic/delivery flags) if all Gemini models are unavailable — this is accepted behavior, not a bug.
- Silence/near-silence audio: guarded against known Gemini hallucination patterns (timestamps, punctuation-only output). A genuine short-word hallucination from silence (e.g. a fabricated real word under Gemini's control, not junk characters) would still theoretically bypass this guard and be scored as normal text — no case of this has been observed in testing, but it is not structurally ruled out. Revisit with server-side audio energy detection (Option a) if this becomes a practical problem.
- B10 accepted limitation: Redis multi-node cluster fail-over probe recovery relies on clock synchronization across application workers.

---

## How to use this file

1. Before starting work, check "In Progress" — see what's active and by whom.
2. Update your own row when you start, pause, or finish.
3. Move your row to "Done & Merged" once your PR is approved and merged.
4. Keep entries short — one line per item, this file should take 15 seconds to read.

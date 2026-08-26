# Scam Shield — Live Status

_Update this when you start, pause, or finish a session — and always as part of your PR. This is a status board, not documentation (that's roadmap.md)._

---

## 🔨 In Progress

| Phase | Feature | Owner | Branch | Status |
|---|---|---|---|---|
| 10 | Audio-specific flags (cadence/phrasing) | Sneha | `feature/audio-specific-flags` | Ready to merge — Step 2 delivery reasoning & prompt guardrails complete |
| Fix | Regex word-boundary keyword matching | Sneha | `fix/regex-word-boundary` | Ready to merge — isolated keyword word-boundary fix |
| 10 | In-browser live recording | Sneha/Abhash | `feature/live-recording` | Ready to start — depends on merged audio branches |
| 11 | Named community confirmations | Abhimanyu | `feature/community-confirmations` | Ready to start — Phase 9 schema fully merged |

## ✅ Done & Merged

- Phases 1-8 (see `roadmap.md` Section 2 for full detail)
- Phase 9a: Supabase auth foundation (`feature/supabase-auth`, merged)
- Phase 9b: Groups & invite-only circles (`feature/circles-groups`, merged) — invite-code display, state-leak on auth transitions, auth-gated Radar view, permanent join/create entry points, state consolidated into `useGroups` hook
- Phase 10: Voice/audio input v1 (`feature/audio-input`, merged) — v1 audio transcription: file upload only (.mp3, .wav, .m4a, .ogg, .webm, .aac; in-browser recording deferred to buffer days), generic flags only (audio-specific cadence/phrasing flags deferred)

## ⏳ Waiting / Blocked

- Phase 12 backend (rate limiting) — not started, independent, can start anytime
- Phase 12 frontend (accessibility/verdict banner) — not started, independent, can start anytime

## ⚠️ Known issues / things to flag for others

_Add a line here if you hit something that affects shared code — `page.tsx` especially, since Phases 10, 11, and 12 all touch it. Remove the line once it's resolved._

- Phase 10 v1 limitation: Audio detection quality depends entirely on Gemini transcription with no fallback on noisy/accented/compressed audio (not yet stress-tested beyond dev clips)
- Phase 10 prompt note: `NOT_A_CALL` guard is strictly topic-blind to avoid false-rejecting clean non-scam speech; keep speech detection separated from scam judging in any future prompt edits
- Phase 10 model/quota handoff note: The audio feature currently runs on a fixed Gemini model identifier (`gemini-3.5-flash`) that is expected to change once the multi-provider key-switching architecture (in progress separately) lands. `route.ts`'s hardcoded model strings across all three Gemini calls (transcription, OCR, reasoning) will need to be revisited then. The `investigate/model-version` branch documents that the current preview model has a 20 RPD ceiling on free tier and outlines the GA vs. preview model distinction as input for that work.

## How to use this file

1. Before starting work, check "In Progress" — see what's active and by whom
2. Update your own row when you start, pause, or finish
3. Move your row to "Done & Merged" once your PR is approved and merged
4. If you hit something another branch might collide with, add it to "Known issues" immediately — don't wait until your PR
5. Keep entries short — one line per item, this file should take 15 seconds to read

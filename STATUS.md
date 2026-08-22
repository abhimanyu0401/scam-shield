# Scam Shield — Live Status

_Update this when you start, pause, or finish a session — and always as part of your PR. This is a status board, not documentation (that's roadmap.md)._

---

## 🔨 In Progress

| Phase | Feature | Owner | Branch | Status |
|---|---|---|---|---|
| 10 | Voice/audio input | Sneha | `feature/audio-input` | Starting |
| 11 | Named community confirmations | Abhimanyu | `feature/community-confirmations` | Ready to start — Phase 9 schema fully merged |

## ✅ Done & Merged

- Phases 1-8 (see `roadmap.md` Section 2 for full detail)
- Phase 9a: Supabase auth foundation (`feature/supabase-auth`, merged)
- Phase 9b: Groups & invite-only circles (`feature/circles-groups`, merged) — invite-code display, state-leak on auth transitions, auth-gated Radar view, permanent join/create entry points, state consolidated into `useGroups` hook

## ⏳ Waiting / Blocked

- Phase 12 backend (rate limiting) — not started, independent, can start anytime
- Phase 12 frontend (accessibility/verdict banner) — not started, independent, can start anytime

## ⚠️ Known issues / things to flag for others

_Add a line here if you hit something that affects shared code — `page.tsx` especially, since Phases 10, 11, and 12 all touch it. Remove the line once it's resolved._

- (none currently)

## How to use this file

1. Before starting work, check "In Progress" — see what's active and by whom
2. Update your own row when you start, pause, or finish
3. Move your row to "Done & Merged" once your PR is approved and merged
4. If you hit something another branch might collide with, add it to "Known issues" immediately — don't wait until your PR
5. Keep entries short — one line per item, this file should take 15 seconds to read

# Scam Shield — Project Roadmap (Finals Round)
**Problem Statement:** Bharat Pragati PS1 — AI Deepfake & Scam Detection
**Status:** Idea round passed — advancing to Finals. Phases 1-8 shipped and deployed. This document reactivates the previously-deferred Future Roadmap as an active 2-week build plan.
**Finals format:** In-person live demo, presentation, and Q&A. Timeline: 2 weeks.

---

## 1. Elevator Pitch

Scam Shield is an AI tool that instantly checks any suspicious message, screenshot, or voice note/call recording for scam red flags — combining rule-based checks, real-time threat-intelligence lookup (Google Safe Browsing), embedding-based pattern matching against 28 curated Indian scam scripts, and Gemini reasoning into one risk score, plain-language explanation, and an auto-generated Chakshu-style complaint draft. Real, invite-only trust circles let members warn and confirm scams together — with named accounts, not simulated demo groups.

---

## 2. What's Shipped (Phases 1-8, Deployed)

- Text-paste and screenshot scam analysis (rule-based checks + Gemini reasoning + Gemini vision OCR)
- Multilingual explanations (English/Hindi)
- Embedding-based pattern matching against 28 curated Indian scam scripts (cosine similarity, `gemini-embedding-001`)
- Google Safe Browsing integration — concurrent, fails safe
- Scam Radar: two demo circles, similarity clustering, Redis-backed (Upstash) storage
- Auto-generated Chakshu-style complaint draft with financial-loss routing to 1930/cybercrime.gov.in
- "Copy alert to share externally" formatted text
- Full UI redesign (dev_abhash branch, merged): 3D hero grid, custom color system, Bebas Neue display type — verified to preserve accessibility (readable body text, correct red/green risk signaling) and full feature functionality across text, screenshot, multilingual, and Scam Radar flows
- Live on Vercel, branch protection active on `main` (PR required to merge)

---

## 3. Finals Roadmap — Active Build (Weeks 1-2)

### Phase 9 — Real accounts & invite-only groups (Days 1-2, owner: Abhimanyu)
Supabase (Postgres + auth). Email/password/display-name signup, no email-confirmation wait. Tables: `profiles` (id, display_name), `groups` (id, name, created_by, invite_code), `group_members` (group_id, user_id, role: admin/member, joined_at). Invite-link based joining, admin-revocable/regenerable codes. Personal Check stays fully login-free. Existing Redis reports layer kept as-is — real group UUIDs replace the two hardcoded circle-name strings. Admin can remove members and revoke invite links; any member can leave. Own branch (`feature/supabase-auth` + `feature/circles-groups`) given the structural risk — this is the one phase allowed to touch routing/auth middleware.

**Schema note:** `group_members` uses `(group_id, user_id)` as its **primary key**, which enforces membership uniqueness at the storage layer. A separately-named unique constraint on the same two columns is redundant if present — harmless, just unnecessary. The client-side `23505` error handler in `handleJoinGroup` catches this primary key violation directly; no additional constraint is needed.

**Key format note:** this project uses Supabase's newer publishable/secret key system (`sb_publishable_...`), not the legacy anon/service_role JWT keys — the legacy format is being deprecated. Use the Publishable key client-side; the Secret key isn't needed for basic auth, only for later privileged server-side operations. Get exact env var names from the project's "Connect" dialog rather than assuming — this has tripped up naming before (Redis, Gemini SDK) and Supabase's key system changed recently enough that older documentation/training data may reference the old anon-key pattern.

### Phase 10 — Voice note / call recording analysis (Day 3, owner: Sneha)
Third input mode. Gemini's native audio understanding, reusing the Phase 2 pipeline. Content/pattern analysis only — not biometric voice-clone detection. `NOT_A_CALL` guard (mirrors `NOT_A_MESSAGE`). Should-Have: audio-specific content flags (scripted cadence, generic call-center phrasing).

### Phase 11 — Named community confirmations (Day 4, owner: Abhimanyu)
Circle members confirm/deny a report by name (Instagram-style, 2-3 names then "+N more"), visually distinct from the existing AI-similarity clustering badge. Reporter excluded from confirming their own report. Reporter can delete their own report; admin can delete any report in their group. Requires a stable `reportId` — confirmations stored as a Redis set keyed to that ID. Redis TTL auto-expiry on reports (60 days default).

### Phase 12 — Reliability & elderly-accessible UI (Day 5, split: Sneha backend / Abhash frontend)
- Backend: `@upstash/ratelimit` on `/api/check` (5/min, 25/day per IP), distinct friendly message for Gemini's own quota-exceeded response vs. our own rate limit.
- Frontend: large plain-language verdict banner above the score, explanation prompt tuned for simple language, footer AI-disclaimer, responsive testing at 3+ breakpoints (phone/tablet/desktop) — this now needs re-verification against the new redesigned UI, not just the old one.

### Phase 13 — Regression, merge, redeploy (Days 6-7, whole team tests, primary builder merges)
Full manual regression across every phase, 1-12. Merge all feature branches to `main` in sequence, redeploy, verify the live URL end-to-end. This is where most bugs from parallel work will surface — budget real time here, don't compress it.

### Buffer / optional stretch (Days 8-9)
Only if genuinely ahead of schedule: cross-circle pattern matching or structured entity cross-referencing (both previously scoped as "next sprint" talking points — see Section 4). Do not start these unless Phase 9-13 are fully done and tested.

### Phase 14 — Demo materials refresh (Days 10-11, owner: Abdesh + primary builder)
New demo video reflecting the redesigned UI and all new features. Updated presentation deck. Fresh screenshots of every major flow, including the new auth/groups/audio/confirm-deny features.

### Phase 15 — Presentation & Q&A rehearsal (Days 12-13, whole team)
Practice the live demo end-to-end, including recovery if something breaks live. Prepare for technical questions on every major decision made this build — why Redis and not a traditional database for reports, why embeddings instead of a vector DB, why concurrent Promise.all for Safe Browsing, why content-analysis-only for audio instead of biometric detection, the Chakshu/1930 routing logic, the data-minimization/TTL choices. Everyone on the team should be able to speak to at least the phases they built.

### Final buffer (Day 14)
Live-URL sanity check, rest before demo day.

---

## 4. Deliberately Deferred — Talking Points Only, Unless Ahead of Schedule
- **Business Email Compromise / organizational circles:** existing group architecture generalizes with minimal changes. Not built — dilutes citizen-protection pitch focus.
- **Cross-circle pattern matching:** privacy-preserving detection across unrelated circles. Real engineering, described as the natural next architectural step.
- **Structured entity cross-referencing:** indexing phone numbers/UPI IDs across reports for harder evidence than semantic similarity.
- **Reporter trust score:** confirm/deny accuracy over time weighting future reports.

---

## 5. Team Git Workflow (branch protection active, self-merge disabled)

**Enforcement:** `main` requires a pull request AND at least 1 approval from someone other than the PR author. GitHub does not allow approving your own PR, so this guarantees a second set of eyes on everything before it reaches `main`. Bypass list is empty — applies to everyone, no exceptions.

### ⚠️ Checklist — before starting any phase
- [ ] `git checkout main && git pull` — never branch from a stale local copy
- [ ] Check `STATUS.md` — see what's currently in progress and by whom before you start
- [ ] Confirm the correct branch name for your phase (table below)
- [ ] Give the Antigravity agent `roadmap.md` for context, use Planning Mode, read its plan before approving
- [ ] Test locally before committing — this habit has caught a real bug in nearly every phase of this build
- [ ] Push and open a PR — direct pushes to `main` are blocked
- [ ] Get it approved by someone else before merging
- [ ] Update `STATUS.md` as part of your PR (move your row to "Done & Merged," add anything future work should know) — then tell the team so everyone pulls `main` before continuing

**Claude repeats this checklist, including the STATUS.md step, at the top of every phase prompt from here on.**

### Branches — current status and dependencies

| Branch | Phase | Owner | Status |
|---|---|---|---|
| `feature/supabase-auth` | 9 (auth) | Abhimanyu | ✅ Merged |
| `feature/circles-groups` | 9 (groups/invites) | Abhimanyu | ✅ Merged |
| `feature/audio-input` | 10 | Sneha | **Start now** — independent of auth |
| `feature/rate-limiting` | 12 (backend) | Sneha/Abhimanyu | **Start now** — independent |
| `feature/accessibility-ui` | 12 (frontend) | Abhash | **Start now** — independent, pure frontend/copy work |
| `feature/community-confirmations` | 11 | Abhimanyu | **Ready to start** — Phase 9 (auth + groups) fully merged |

**`page.tsx` conflict warning:** audio input, the verdict banner, and accessibility work all touch this file. Even building in parallel, merge these branches one at a time and pull `main` between each — don't leave all four open and diverging for days at once.

---

## 6. Tech Stack Additions (Finals)

- `@supabase/supabase-js`, `@supabase/ssr`
- `@upstash/ratelimit`
- Supabase Postgres (profiles, groups, group_members)
- Existing stack unchanged otherwise (Next.js, React, TypeScript, Tailwind, Gemini API, Upstash Redis, Google Safe Browsing, Vercel)

---

## 7. Judging Criteria Mapping (Finals)

- **Novelty:** community propagation + real trust-verified circles + multi-modal detection + multi-signal analysis + direct bridge to a real government reporting channel
- **Technical Execution:** auth, relational data modeling, multimodal AI input, rate limiting, graceful degradation, real threat-intel integration — now with real accounts and audio, not just the idea-round MVP
- **Impact:** scam detection + the deepfake half of the PS title + elderly-user design consideration, fully realized rather than partially deferred
- **Presentation:** live demo judges can watch and test directly; confident, specific technical answers in Q&A — not just a working product, but a team that can defend every decision behind it
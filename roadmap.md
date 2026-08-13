# Scam Shield — Project Roadmap (v2 — Post-Deadline Extension, Finalized)
**Problem Statement:** Bharat Pragati PS1 — AI Deepfake & Scam Detection
**Status:** Phases 1-6 complete and deployed live. This document is the finalized spec for the v2 expansion.

---

## 1. Elevator Pitch

Scam Shield is an AI tool that instantly checks any suspicious message, screenshot, or voice note/call recording for scam red flags — giving a risk score, plain-language explanation, and safe next steps in the user's own language, including an auto-generated Chakshu-style complaint draft. Its "Scam Radar" layer lets real, invite-only trust circles (family, RWA, SHG) warn each other the moment one member reports a scam pattern — with real accounts and named confirmations, not simulated demo circles.

---

## 2. What's Already Built (Phases 1-6, Deployed)

- Text-paste and screenshot scam analysis (rule-based checks + Gemini reasoning + Gemini vision OCR)
- Multilingual explanations (English/Hindi)
- Lightweight embedding-based pattern matching against 8 curated Indian scam scripts (cosine similarity, `gemini-embedding-001`)
- Scam Radar: two hardcoded demo circles, clustering by similarity, Redis-backed (Upstash) storage
- Live on Vercel, tested end-to-end
- Currently on Gemini's free API tier (billing not yet enabled — using key rotation across accounts)

---

## 3. Full User Flows (Finalized)

### Stage A — Anonymous visitor
Lands on the site, uses Personal Check immediately — text, screenshot, or audio, no login wall. Gets a result with a large, plain-language verdict banner above the score, plus (new) a Chakshu-style complaint draft and a "copy to share" formatted alert. Can click "Report to Circle" without an account.

### Stage B — Prompted auth (seamless)
Clicking "Report to Circle" while logged out stashes the full analyzed result in browser session storage, then prompts sign in/up. On successful auth, the stashed result auto-submits to the circle they choose.

### Stage C — Sign up / login
Email + password + display name (required — needed for named confirmations). No email confirmation wait. Other members see your display name only, never your email.

### Stage D — Landing after auth
Came via an invite link → auto-joined, land in its feed. Came via the seamless Stage B flow → land after auto-submitting. Came in cold → land on Scam Radar's empty state.

### Stage E — Scam Radar as the groups home
Zero groups: empty state, "Create a Group" or "Have a link? Join here." One or more groups: circle selector (real groups) + feed, invite/member management, notification badge.

### Stage F — Creating a group
Name the group → shareable, reusable, admin-revocable invite link generated immediately → dropped into that group's empty feed.

### Stage G — Joining via invite link
Logged in: quick confirm, then into the feed. Not logged in: invite code survives the signup detour and auto-joins right after.

### Stage H — Reporting, verifying, moderating
"Report to Circle" shows real user groups. Report button copy is explicit ("Share this with [Circle Name]"). Each report card shows two visually distinct signals: AI-similarity clustering (existing) and named human confirmations (new, Instagram-style, 2-3 names then "+N more"). Reporter cannot confirm their own report. Reporter can delete their own report; admin can delete any report in their group.

### Stage I — Group management
Creator = admin automatically. Admin can remove members and revoke/regenerate the invite link. Any member can leave. Sole admin leaving = group continues, adminless.

---

## 4. Architecture Decisions

### Core Analysis Enhancements (Phase 7)
- **Google Safe Browsing (Lookup API, `threatMatches.find`):** fourth deterministic signal. Extracts URLs already caught by the existing regex, checks against Google's live threat lists, adds a distinct strong flag ("Known malicious link") separate from the existing soft "Contains link/URL" flag. Separate Google Cloud API key. Fails gracefully — never blocks the overall check.
- **Expanded pattern library (8 → 25-30):** quality-first, genuinely distinct new categories (additional phishing variants, insurance scams, romance scams, fake investment/crypto, exam/results scams, property/rental scams). Same architecture, no vector DB needed. Keep the original 8, append new ones, rerun the same batched precompute script.

### Actionability & Credibility Upgrades (Phase 8)
- **Auto-generated Chakshu-style complaint draft:** extend the *existing* `responseSchema` in the Phase 2 analysis call to add a `complaintDraft` field, generated in the same Gemini call — zero extra API cost or latency. Available immediately on any risky Personal Check result, not gated behind circle reporting/confirmation. Chakshu (a real, active Government of India facility under DoT's Sanchar Saathi) is specifically for reporting *suspected* fraud where no financial loss has occurred yet — matches this product's exact positioning ("catch it before you act on it"). If a result indicates financial loss may have already occurred, the draft/copy should note the correct channel is the cybercrime helpline (1930 / cybercrime.gov.in) instead.
- **"Copy alert to share externally" button:** formats the analyzed result (message, flags, risk verdict, explanation) into clean, ready-to-paste WhatsApp-style text. Pure client-side formatting + browser Clipboard API — no new backend call. Partially closes the real-WhatsApp-integration gap that was cut earlier due to Business API approval-delay risk.

### Auth & Groups — Supabase (Phase 9-10)
- Postgres + built-in auth in one integration.
- Tables: `profiles` (id, display_name), `groups` (id, name, created_by, invite_code), `group_members` (group_id, user_id, role: admin/member, joined_at).
- Invite-link based joining, admin-revocable/regenerable codes.
- Required email confirmation disabled for demo reliability.
- Personal Check stays fully login-free.
- Existing Redis (Upstash) reports layer kept as-is — Supabase group UUIDs replace the two hardcoded circle-name strings as the storage key.
- Reports need a stable `reportId` for named confirmations; confirmations stored as a Redis set keyed to that ID.

### Voice Note / Call Recording (Phase 11)
- Third input mode, file upload only (live mic recording deferred).
- Gemini's native audio understanding, reusing the Phase 2 pipeline (now also producing `complaintDraft`).
- Content/pattern analysis only — not biometric voice-clone/deepfake detection.
- `NOT_A_CALL` guard.
- Should-Have: audio-specific content flags (scripted cadence, generic call-center phrasing).

### Privacy & Data Handling
- Only extracted text is ever stored for a report — never the raw image or audio file.
- Gemini paid tier: not used for training, narrow exception for limited-time abuse-monitoring logs.
- Redis reports get a TTL (default: 60 days, adjustable).
- Explicit "Share this with [Circle Name]" language before posting.

### Rate Limiting (Phase 13)
- `@upstash/ratelimit` on `/api/check` only — 5 req/min, 25 req/day, per IP.
- Distinct friendly messages: our own rate limit vs. Gemini's own quota-exceeded response. Never the raw error or the old debug fallback.
- Safety-filter-blocked uploads: existing code already handles this — no changes.

### Elderly Accessibility & Responsive Design
- Large, plain-language verdict banner above the score.
- Explanation prompt tuned for genuinely simple language.
- Larger fonts and tap targets.
- Fully responsive, tested at 3+ breakpoints (phone/tablet/desktop).
- Footer AI-disclaimer line.

### Deliberately Deferred — Talking Points Only, Do Not Build
These were evaluated and consciously not built, for Q&A/pitch use only:
- **Business Email Compromise / organizational circles:** the existing group system (invite links, roles, confirm/deny, pattern matching) is generic enough to extend to workplace fraud with minimal changes. Not built — dilutes pitch focus from the citizen/family-protection narrative for low added demo value. One-line Q&A answer only.
- **Cross-circle pattern matching:** comparing reports across all circles (privacy-preserving) to show "this pattern was confirmed elsewhere in India." Real engineering (privacy design needed), not "basically free." Described as the natural next architectural step, not built now.
- **Structured entity cross-referencing:** extracting and indexing phone numbers/UPI IDs across reports for harder evidence than semantic similarity. Same treatment — next-step talking point, not built now.
- **Reporter trust score:** confirm/deny accuracy over time weighting future reports. Real complexity and fairness considerations. One line on the roadmap slide only.

---

## 5. v2 Feature List

### 🔴 Must-Have
- [ ] Google Safe Browsing link-safety check
- [ ] Expanded pattern library (25-30, quality-first)
- [ ] Chakshu-style complaint draft (schema extension, zero extra API cost)
- [ ] "Copy alert to share externally" formatted text
- [ ] Signup/login/logout (Supabase, display name required, email confirmation disabled)
- [ ] Create a group, revocable/regenerable invite link
- [ ] Join a group via invite link (incl. not-logged-in detour)
- [ ] "Report to Circle" shows real user groups
- [ ] Seamless auto-submit-after-login for anonymous users
- [ ] Voice note / call recording upload
- [ ] `NOT_A_CALL` guard
- [ ] Named community confirmations (self-vote excluded, visually distinct badge)
- [ ] Reporter can delete own report; admin can delete any report
- [ ] Admin can remove members; any member can leave
- [ ] Rate limiting on `/api/check`
- [ ] Distinct Gemini-quota-exceeded message
- [ ] Large plain-language verdict banner
- [ ] Responsive design, 3+ breakpoints
- [ ] Footer AI disclaimer

### 🟡 Should-Have
- [ ] Audio-specific content flags
- [ ] Redis TTL auto-expiry (60 days)
- [ ] In-app notification badge
- [ ] Explicit "Share this with [Circle Name]" button copy

### 🟢 Could-Have
- [ ] Personal history page
- [ ] Live in-browser mic recording
- [ ] Voice dictation for describing a call
- [ ] Admin-transfer flow if sole admin leaves
- [ ] Account deletion

### 📋 Talking Points Only (Do Not Build)
- [ ] BEC / organizational circles
- [ ] Cross-circle pattern matching
- [ ] Structured entity cross-referencing
- [ ] Reporter trust score

---

## 6. Day-by-Day Plan (solo build, teammates test)

| Day | Phase | Focus |
|---|---|---|
| 1 | 7 | Google Safe Browsing + expand pattern library to 25-30 |
| 1 (cont.) | 8 | Chakshu draft field (schema extension) + share-externally formatted alert |
| 2 | 9 | Supabase project setup; signup/login/logout — no groups yet |
| 3 | 10 | Group schema + roles, invite-link flow (incl. not-logged-in detour), member list, admin remove/leave, migrate "Report to Circle," seamless anonymous-report-then-login |
| 4 | 11 | Voice note/call recording upload, `NOT_A_CALL` guard |
| 5 | 12 | Named community confirmations, reporter/admin report deletion, Redis TTL |
| 6 | 13 | Rate limiting, Gemini-quota handling, verdict banner, disclaimer, notification badge |
| 7 | 14 | Full regression test on a branch, responsive testing, merge, redeploy, verify live URL |
| — | 15 | Refresh demo video/PPT, final buffer, teammates test |

**Ground rule unchanged:** work on a git branch, keep `main` as the safe deployed fallback throughout. Don't force Day 1's expanded scope into a literal single calendar day if it runs long — all four pieces are low-risk, worth finishing properly.

---

## 7. Tech Stack Additions

- Google Safe Browsing API (Lookup API, separate Google Cloud API key)
- Browser Clipboard API (native, no library — for the share-externally button)
- `@supabase/supabase-js`, `@supabase/ssr`
- `@upstash/ratelimit`
- Supabase Postgres (profiles, groups, group_members)
- Existing stack unchanged otherwise

---

## 8. Judging Criteria Mapping (Updated)

- **Novelty:** community propagation + real trust-verified circles + multi-modal detection + multi-signal analysis (rules, embeddings, LLM, real threat intelligence) + direct alignment with a real government reporting channel
- **Technical Execution:** auth, relational data modeling, multimodal AI input, rate limiting, graceful degradation, external threat-intel integration, zero-marginal-cost schema extension for the complaint draft
- **Impact:** scam detection + the deepfake half of the PS title + elderly-user design consideration + a direct, accurate bridge to Chakshu's actual stated purpose (pre-loss fraud reporting)
- **Presentation:** live URL judges can personally test; responsible-deployment signals (disclaimer, data minimization, rate limiting); confident, well-reasoned answers on the deliberately-deferred features if asked

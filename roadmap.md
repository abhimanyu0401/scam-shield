# Scam Shield — Project Roadmap (Submission Version)
**Problem Statement:** Bharat Pragati PS1 — AI Deepfake & Scam Detection
**Status:** Phases 1-8 complete and deployed live. Build frozen here for submission due to timing — Phases 9+ are documented below as Future Roadmap, not built.

---

## 1. Elevator Pitch

Scam Shield is an AI tool that instantly checks any suspicious message, screenshot, or (future) voice note/call recording for scam red flags — combining rule-based checks, real-time threat-intelligence lookup (Google Safe Browsing), embedding-based pattern matching against 28 curated Indian scam scripts, and Gemini reasoning into one risk score, plain-language explanation, and an auto-generated Chakshu-style complaint draft. Its "Scam Radar" layer lets a trust circle warn each other the moment one member reports a scam pattern.

---

## 2. What's Shipped (Phases 1-8, Deployed)

- Text-paste and screenshot scam analysis (rule-based checks + Gemini reasoning + Gemini vision OCR)
- Multilingual explanations (English/Hindi)
- Embedding-based pattern matching against **28** curated Indian scam scripts (cosine similarity, `gemini-embedding-001`)
- Google Safe Browsing integration — real-time malicious-link detection, run concurrently with the AI analysis so it adds no latency, fails silently and safely if unavailable
- Scam Radar: two demo circles, similarity clustering, Redis-backed (Upstash) storage
- Auto-generated Chakshu-style complaint draft (schema-extended, zero extra API cost) on any risky result
- "Copy alert to share externally" formatted WhatsApp-style text
- Live on Vercel, tested end-to-end

**Known current limitation, worth stating plainly if asked:** circles are still two fixed demo groups, not yet backed by real user accounts — this is the first item in Future Roadmap below, already fully architected and planned, deliberately not rushed under time pressure.

---

## 3. Future Roadmap (Planned, Fully Architected, Not Built — Time-Constrained)

This section is intentionally detailed — it's meant to demonstrate real depth of planning, not just a vague "more features later" line.

### Real accounts & invite-only groups
Supabase (Postgres + auth). Email/password/display-name signup, no email-confirmation wait. Real, admin-managed, invite-link-based trust circles replacing the two hardcoded demo groups — reusing the existing Redis reports layer as-is, with real group UUIDs as the storage key instead of fixed strings. Admin can remove members and revoke/regenerate invite links; any member can leave.

### Voice note / call recording analysis
Third input mode alongside text and screenshot. Gemini's native audio understanding, reusing the same analysis pipeline. Explicitly scoped as content/pattern analysis, not biometric voice-clone detection — directly extends the product's alignment with the "deepfake" half of the PS title.

### Named community confirmations
Circle members can confirm/deny a report by name (Instagram-style), visually distinct from the existing AI-similarity clustering signal. Reporter excluded from confirming their own report.

### Reliability & responsible deployment
Per-IP rate limiting (`@upstash/ratelimit`, reusing the existing Redis instance), distinct friendly messaging for Gemini's own quota limits, a large plain-language verdict banner for elderly users, full responsive testing across breakpoints, footer AI-disclaimer.

### Deliberately deferred, talking-points only
- **Organizational/workplace circles (Business Email Compromise):** the existing group architecture generalizes to workplace fraud (fake-CEO, fake-IT, fake-vendor scams) with minimal changes — a group "type" field and a small second pattern library. Not built: dilutes the citizen-protection pitch focus for low added demo value.
- **Cross-circle pattern matching:** privacy-preserving detection of a scam pattern confirmed in unrelated circles elsewhere. Real engineering (privacy-safe design needed), described as the natural next architectural step.
- **Structured entity cross-referencing:** indexing phone numbers/UPI IDs across reports for harder evidence than semantic similarity alone.
- **Reporter trust score:** confirm/deny accuracy over time weighting future reports.

---

## 4. Architecture Reference (for what's actually shipped)

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **AI:** Gemini API (`@google/genai`) — text/vision analysis, `gemini-embedding-001` for pattern matching, schema-extended for the Chakshu draft field
- **Threat intelligence:** Google Safe Browsing Lookup API, run concurrently with AI calls, fails safe
- **Storage:** Upstash Redis (Scam Radar reports)
- **Hosting:** Vercel

---

## 5. Judging Criteria Mapping

- **Novelty:** community propagation + multi-signal detection (rules, embeddings, LLM, real threat intelligence) + direct bridge to a real government reporting channel (Chakshu)
- **Technical Execution:** concurrent multi-signal pipeline with graceful degradation on any single signal's failure, zero-marginal-cost schema extension for the complaint draft, real threat-intel integration
- **Impact:** addresses scam detection directly; a clearly articulated, well-architected roadmap for the trust-circle and deepfake-audio dimensions shows depth of thinking beyond what time allowed to ship
- **Presentation:** live URL judges can test directly; confident, well-reasoned answers on what's next and why it wasn't rushed
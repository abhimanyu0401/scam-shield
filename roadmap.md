# Scam Shield — Project Roadmap (Final, Solo-Build Version)
**Problem Statement:** Bharat Pragati PS1 — AI Deepfake & Scam Detection
**Build mode:** Solo, using Google Antigravity

---

## 1. Elevator Pitch

Scam Shield is an AI tool that instantly checks any suspicious message, screenshot, or call description for scam red flags — and the moment one person in a family or community group flags something, it warns everyone else in that circle before they get the same call.

---

## 2. The Problem

- Scam calls (fake "digital arrest," fake UPI refunds, fake bill-disconnect threats) spread through social networks fast — by the time one person figures out it's a scam, the same script may already be hitting dozens of others nearby.
- Elderly people are the most common targets and the least likely to check an official app or website — they trust a warning from family far more than a notification from an unknown app.
- Bank/telecom fraud dashboards exist, but they work at "institutional speed" — slow, centralized, after the fact. Scams spread at "social speed" — a WhatsApp forward within the hour.

---

## 3. Our Core Idea (Two Layers)

1. **Personal Scam Checker** — paste text, upload a screenshot, or describe a call → get an instant risk score, explanation, and advice, in your own language.
2. **Scam Radar (Community Layer)** — reports inside a "trust circle" (family group, RWA, self-help group) get clustered together, and everyone in that circle is warned about the pattern before they encounter it themselves.

---

## 4. Who Uses It

| Persona | Role |
|---|---|
| Primary Reporter | The person who receives the suspicious call/message first and checks it |
| Circle Member | Family/group member who benefits from the early warning |
| Elderly Parent (context persona) | The person most at risk — often the reason a younger relative sets up or monitors a circle |

---

## 5. User Flows

### Flow A — Personal Check
1. User opens the app.
2. Pastes suspicious text, OR uploads a screenshot, OR types a description of a call.
3. System shows: **Risk Score (0–100)**, **Red Flags detected**, **plain-language explanation** (in chosen language), and a **suggested action** (e.g. "Do not share OTP," "Verify via the official app," link to report to cybercrime.gov.in).
4. User can tap "Share to my circle" → moves into Flow B.

### Flow B — Scam Radar / Circle Warning
1. User selects or creates a "circle" (e.g. Family Group, Green Valley RWA).
2. Submits a report (fresh, or carried over from Flow A).
3. System checks: has something similar already been reported in this circle (or globally)? If yes, it clusters into an existing "campaign" and bumps a counter ("X people have reported this").
4. All circle members instantly see the alert in their feed: *"New scam pattern reported in your circle: [summary]. If you get a similar call, do not [action]."*

---

## 6. How the System Works (Plain-Language Architecture)

1. **Input capture** — text, screenshot, or typed call description.
2. **Screenshot reading** — Gemini's vision capability reads the text directly out of the image (no separate OCR tool needed).
3. **Rule-based checks** — quick, deterministic flags: urgency/payment/OTP keywords, suspicious links.
4. **Pattern matching (lightweight embeddings)** — the report is compared against a small curated library of real, publicly documented Indian scam scripts. For the hackathon demo: precompute embeddings for ~10 example scam texts once, store as plain vectors in a JSON file, and compare the new message against them with cosine similarity — no vector database needed. *(Full vector-search infrastructure is a Could-Have — expand this only if you advance to the final round.)*
5. **AI reasoning** — Gemini combines the rule-based flags + pattern match + its own read of the message into one score and a plain-language explanation, generated in the requested language.
6. **Circle clustering** — if submitted to a circle, the system checks recent reports for similarity, clusters matches, and notifies circle members.

---

## 7. Feature List

### 🔴 Must-Have (the demo does not work without these)
- [ ] Text-paste input → risk score + explanation
- [ ] Screenshot upload → text extraction → risk score + explanation
- [ ] Multilingual explanation output (at least Hindi + English)
- [ ] Rule-based flag checks (keywords, suspicious links)
- [ ] "Report to circle" with 1–2 hardcoded demo circles
- [ ] Circle feed showing a propagated warning
- [ ] Clean, simple UI (score badge, flags list, explanation card)
- [ ] Live deployed URL (Vercel)

### 🟡 Should-Have (build these if the Must-Haves are done with time to spare)
- [ ] Lightweight pattern-matching via precomputed embeddings (see Section 6) — this is your answer to "where's the technical depth?"
- [ ] "X people reported this" counter across circles
- [ ] Call-transcript analysis (paste what was said → same analysis pipeline)
- [ ] In-app library of known scam patterns (e.g. "Digital Arrest Scam," "Fake UPI Refund") with real examples

### 🟢 Could-Have (stretch goals / roadmap talking points — don't build these now)
- [ ] Full vector database (only if advancing to finals)
- [ ] Real WhatsApp/SMS push integration
- [ ] Browser extension for real-time webpage scam checks
- [ ] Voice-based reporting
- [ ] Community-verified reports (others in the circle can confirm/deny)
- [ ] Direct integration with cybercrime.gov.in reporting

---

## 8. Tech Stack (Deliberately Simple)

- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes — no separate server needed
- **AI:** Gemini API, handling extraction (vision), reasoning, scoring, and translation
- **Pattern matching:** Gemini embeddings API + a plain JSON file of precomputed vectors, compared with cosine similarity in code
- **Storage:** a simple SQLite file, or a free-tier Supabase project, to persist circle reports across the demo
- **Hosting:** Vercel (free tier, one-click deploy)
- **Build tool:** Google Antigravity (agent-first IDE, Planning Mode)

---

## 9. Vibe-Coding Feasibility

| Component | Difficulty | Notes |
|---|---|---|
| Text scam analysis (Gemini call) | Very Easy | Core strength of AI coding tools |
| Screenshot → text | Easy | Gemini's vision handles this directly |
| Multilingual output | Very Easy | Native Gemini capability |
| Rule-based checks | Easy | Simple, well-defined logic |
| Lightweight embeddings + cosine similarity | Moderate | No vector DB — just an array comparison, genuinely low-risk |
| Circle feed / clustering logic | Moderate | Mostly standard app logic (lists, grouping) |
| Deployment to Vercel | Easy–Moderate | Usually smooth, but always test the live URL, not just localhost |

**Overall feasibility: HIGH.**

---

## 10. Solo Build Sequence

Since you're building alone, this is organized as sequential **phases**, not fixed days — move to the next phase only once the current one is tested and working. Commit to git after every phase.

| Phase | Goal | Definition of done |
|---|---|---|
| 1 | Project skeleton with fake data | Paste text → click button → see a hardcoded fake result end-to-end |
| 2 | Real AI analysis | Real Gemini call replaces the fake response; tested with 3 different messages |
| 3 | Screenshot upload | Upload a screenshot → same result pipeline works |
| 4 | Multilingual toggle | ✅ English/Hindi switch changes the explanation language — tested with both |
| 5 | Lightweight pattern matching | Known scam examples correctly get flagged as "matches known pattern" |
| 6 | Scam Radar | Submit to a circle → feed updates → similar reports cluster |
| 7 | UI polish | Clean layout, color-coded score, mobile-responsive |
| 8 | Deploy | Live Vercel URL, tested end-to-end (not just localhost) |
| 9 | Demo prep | Screenshots captured, backup video recorded, pitch rehearsed |

---

## 11. Demo Script (aim for under 3 minutes)

1. Open with the real-world hook (digital arrest scams, a real headline stat).
2. Paste a real, well-known scam message live → show instant score + explanation.
3. Show the multilingual toggle.
4. Switch to Circle view — show a pre-staged report propagating in the feed.
5. Close on the "X people already reported this" counter, then the roadmap (WhatsApp integration, full vector search, cybercrime.gov.in link).

---

## 12. Key Risks & How We Handle Them

| Risk | Mitigation |
|---|---|
| "This is just an LLM wrapper" | Lead the pitch with the pattern-matching/clustering architecture, not just the AI call |
| AI gives inconsistent scores | Test repeatedly with the same 10–15 examples; tune the prompt until stable |
| Live demo failure | Have a recorded backup video + cached example outputs ready |
| Solo builder fatigue/blind spots | Test each phase before moving on — do not stack untested features |

---

## 13. How This Maps to Judging Criteria

- **Novelty:** multi-signal detection + social-speed community propagation — not just another fraud dashboard
- **Technical Execution:** a real pipeline (rules + pattern-matching + AI reasoning + clustering), not a single prompt
- **Impact:** directly addresses a documented, urgent, India-specific problem
- **Presentation:** highly demo-able, visual, understandable in seconds

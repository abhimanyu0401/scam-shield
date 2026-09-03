# Scam Shield — Project Roadmap & Technical Specification

**Problem Statement:** Bharat Pragati PS1 — AI Deepfake & Scam Detection  
**Status:** Finals-Ready Build Completed & Verified  

---

## 1. Executive Summary & Vision

Scam Shield is an AI-powered citizen protection platform engineered to detect and disrupt scam operations across India. It addresses fraudulent messages, deceptive screenshots, and impersonation voice notes by synthesizing rule-based heuristics, real-time threat intelligence, semantic vector pattern matching, and multi-model LLM reasoning into an immediate risk assessment.

Beyond individual checks, Scam Shield introduces **Scam Radar** and **Trust Circles** — enabling families, societies, and peer groups to share warnings, aggregate semantically identical scam variants, and confirm community threats in real time.

---

## 2. Completed Functionality

### Core Multi-Modal Scam Analysis (Phases 1–8 & 10) — ✅ COMPLETED
- **Text Analysis:** Fast multi-signal heuristic evaluation covering urgency keywords, payment demands, and known scam patterns.
- **Screenshot / Vision OCR:** Gemini Vision OCR extraction converting images of fake bank alerts, WhatsApp messages, and receipts into normalized text.
- **Voice Note / Call Audio:** Audio file transcription and acoustic cadence analysis (.mp3, .wav, .m4a, .ogg, .webm, .aac) with scripted call-center phrasing, automated IVR cues, silence artifact suppression, and Unicode-hardened word-boundary detection.
- **28 Curated Indian Scam Scripts:** Static semantic vector library (`gemini-embedding-001`) covering lottery, electricity disconnection, digital arrest, job/task fraud, and KYC expiry schemes.
- **Live Threat Intelligence:** Google Safe Browsing Lookup API v4 integrated concurrently to catch zero-day phishing links without blocking response times.
- **Citizen Action Workflows:** Plain-language English and Hindi explanations, Department of Telecommunications (DoT) Chakshu complaint draft generator with entity extraction, automatic routing to 1930 / cybercrime.gov.in on detected financial loss, and one-tap WhatsApp alert formatting.

### Identity & Trust Circles (Phases 9a, 9b, 9c) — ✅ COMPLETED
- **Authentication & Profiles:** Supabase Auth (email/password) while keeping Personal Check 100% login-free.
- **Invite-Only Groups:** Create private circles, generate/regenerate shareable invite codes, and join circles via invite links.
- **Multi-Group Sharing (Phase 9c):** Single canonical report submission across multiple user circles simultaneously. Server-side Supabase `group_members` authorization guard (HTTP 403 prevention).
- **Per-Circle Isolated Clustering:** Each group maintains an independent cluster assignment (`clusterIds: Record<string, string>`) stored in the canonical report record (`report:{id}`, 60-day Redis TTL).

### Community Confirmations & Deletion (Phase 11) — ✅ COMPLETED
- **Named Confirmations:** Circle members can vote "Confirm" or "Deny" on alerts. UI displays social proof (e.g. "Confirmed by Sneha, Abhash and 2 others").
- **Authorization Rules:** Original reporters are excluded from voting on their own submissions.
- **Report Deletion:** Members can delete their own reports; group administrators can moderate any report within their circle.
- **Storage & Resolution:** Redis set serialization (`userId:type:displayName:timestamp`) with sub-millisecond multi-report feed vote resolution.

### Production AI Resilience Subsystem (Phases B1–B10) — ✅ COMPLETED
- **Multi-Model Orchestration:** Capability-filtered routing prioritizing primary low-latency models (`gemini-3.5-flash-lite`) with automatic failover to larger models (`gemini-3.5-flash`, Groq/Llama).
- **Global Deadline Enforcement:** Request-level `DeadlineTracker` enforcing a 20,000ms hard ceiling with a 250ms socket dispatch guard.
- **Circuit Breaker:** Distributed Redis state machine (`CLOSED` → `OPEN` → `HALF_OPEN`) with atomic Lua evaluation, single-probe exclusivity, and probe recovery.
- **Quota Management:** Atomic Redis Lua reservation (`RESERVE_BOTH_LUA`) isolating RPM/RPD exhaustion (`QuotaExhaustedError`) from tripping circuit breakers.
- **Deterministic Fallback Engine:** Offline rule scoring, Safe Browsing lookup, and static vector matching that guarantees a response even during total external AI provider or Redis outages.

### Scam Radar Clustering & UI Synchronization (Phase 13) — ✅ COMPLETED
- **Semantic Vector Clustering:**
  - `gemini-embedding-001` generates 3072-dimensional semantic embeddings.
  - Per-circle pairwise cosine similarity evaluation against active circle reports.
  - Reports with similarity **`> 0.75`** automatically join the best matching cluster; otherwise, a new cluster is established.
  - Image reports participate seamlessly: OCR-extracted text is embedded via a dedicated, bounded 5-second timeout independent of the AI orchestration deadline.
- **Scam Radar UI Indicators:**
  - Report cards and detail modals display a polished community intelligence badge showing the number of other similar reports (`clusterCount - 1`), such as **`1 similar report`** or **`2 similar reports`**. Singleton reports display no badge.
- **State Synchronization:**
  - Reactive automatic UI updates on report sharing, voting, and deletion without requiring a browser reload.
  - Open report modals dynamically synchronize with updated vote states.
  - Non-destructive background updates preserve rendered feed items without full-page spinner flashes.
  - Automatic clearing of transient analysis inputs and results upon navigating away or signing out.
  - Manual Refresh (`↻`) button retained as a user-controlled fallback mechanism.

---

## 3. Architecture & Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  Next.js 16 App Router · React 19 · Tailwind v4             │
│  - Personal Scam Check (Text / Screenshot / Voice)          │
│  - Scam Radar (Invite-Only Circles & Clustered Feed)        │
│  - Instant UI Synchronization on Mutations                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Route Orchestration                   │
│  [/api/check]            [/api/circles/[id]/report]         │
│  - AI Resilience Router  - Supabase Membership Auth Guard   │
│  - Vision OCR / Audio    - Cosine Similarity Matching (>0.75)│
│  - Server Embedding      - Per-Circle Cluster Assignment    │
│  [/api/circles/reports/[id]/vote]  [/api/circles/reports/[id]]│
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│        Upstash Redis         │ │      Supabase (Postgres)     │
│  - analysis:{id} (15m TTL)   │ │  - Auth (Email / Password)   │
│  - report:{id} (60d TTL)     │ │  - profiles                  │
│  - circle:{id} (Report IDs)  │ │  - groups                    │
│  - votes:{reportId} (Set)    │ │  - group_members (Composite  │
│  - Circuit Breaker & Quota   │ │    Primary Key: gid, uid)    │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 4. Future Architecture & Post-Hackathon Roadmap

The following initiatives represent genuine architectural extensions planned for production scaling beyond the hackathon MVP:

### 1. Advanced Cluster Management & Synthesis (Planned)
- **Centroid-Based Clustering:** Transition from pairwise report comparisons to dynamic cluster centroids (`running_mean(vectors)`), lowering comparison complexity from $O(N)$ to $O(K)$ per circle.
- **Cluster Merging & Splitting:** Background job to re-evaluate cluster proximities when bridge reports are filed, merging related clusters or splitting divergent sub-themes.
- **AI Cluster Summaries:** Automatically generate an aggregated executive summary for clusters with $\ge 3$ reports (e.g. *"Coordinated campaign spoofing SBI netbanking using SMS shortcodes"*).

### 2. Dedicated Vector Database Scaling (Planned)
- **Vector DB Migration:** For circles with $> 5,000$ active alerts, migrate from in-memory Redis linear cosine scans to dedicated vector indexes (PostgreSQL `pgvector` or Pinecone) with HNSW indexing.
- **Cross-Circle Federated Matching:** Privacy-preserving cryptographic hashing and similarity checks across disparate circles to detect city-wide or nationwide coordinated scam waves without leaking private circle contents.

### 3. Real-Time Push & Alert Subsystems (Planned)
- **WebSockets / Server-Sent Events (SSE):** Replace reactive client mutation synchronization with WebSocket connections for passive, instantaneous alert delivery when another circle member flags a scam.
- **Push Notifications (PWA / Web Push):** Urgent notifications sent to family members when a high-confidence digital arrest or financial fraud report is confirmed within their circle.

### 4. Advanced Deepfake & Acoustic Analysis (Planned)
- **Acoustic Spectral Synthesis Detection:** Integrate deepfake audio detection models analyzing frequency continuity and phase inconsistencies to flag AI voice clones (e.g., cloned family member ransom scams).
- **Direct Telecom / Police Reporting Integrations:** Direct API submission pipeline to the National Cyber Crime Reporting Portal and DoT Chakshu reporting endpoints via verified institutional credentials.

### 5. Community Reputation & Trust Metrics (Planned)
- **Reporter Trust Score:** Weight confirmation thresholds based on a member's historical reporting accuracy, mitigating spam and griefing in larger open circles.
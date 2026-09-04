# Kinkeeper 🛡️

An AI-powered citizen protection platform that instantly checks suspicious messages, screenshots, and audio recordings for scam red flags — combining deterministic rules, live threat intelligence, semantic vector clustering, and multi-model LLM reasoning into a single risk score, plain-language explanation, and ready-to-file complaint draft.

Built for **Bharat Pragati PS1 — AI Deepfake & Scam Detection**.

Full architecture reference: [`roadmap.md`](./roadmap.md) · Live status: [`STATUS.md`](./STATUS.md)

---

## What It Does

- **Multi-Modal Threat Analysis:**
  - **Text:** Paste any SMS, WhatsApp, Telegram, or email message.
  - **Screenshots:** Upload payment receipts, chat screenshots, or fake bank alerts. Gemini Vision OCR extracts text automatically.
  - **Voice Notes / Audio:** Upload voice call recordings or audio notes (.mp3, .wav, .m4a, etc.) for speech-to-text transcript analysis and acoustic delivery red flags (urgency, automated IVR phrasing, generic call-center scripts).
- **Multi-Signal Detection Engine:**
  - Rule-based red flags (urgency cues, payment demands, lottery/KYC triggers).
  - Google Safe Browsing Lookup API v4 for concurrent real-time malicious link verification.
  - 28-pattern vector embedding library matching curated Indian scam scripts (`gemini-embedding-001` cosine similarity).
  - LLM contextual reasoning (primary Gemini flash models with automatic fallback to Groq/Llama or deterministic offline engine).
- **Actionable Outputs:**
  - **Risk Score (0–100)** with clear risk tiering (Low / Medium / High) and plain-language explanations in English or Hindi.
  - **Chakshu Complaint Draft:** Auto-generated Department of Telecommunications (DoT) Chakshu complaint draft with structured entity extraction (phone numbers, malicious links, financial amounts).
  - **Financial Loss Routing:** Automatically detects if money has already been lost and routes the citizen directly to the National Cyber Crime Reporting Portal (1930 / [cybercrime.gov.in](https://cybercrime.gov.in)).
  - **Copy Alert to Share:** Generates clean, WhatsApp-ready advisory text for quick family forwarding with zero added backend calls.
- **Scam Radar & Trust Circles:**
  - Private, invite-only community threat circles (e.g., family, residential societies, college clubs).
  - Multi-group alert sharing with server-side membership authorization.
  - Semantic clustering that groups identical or mutating scam variants together in real time.
  - Named community confirmations and member-level report deletion.
- **Analytics & Engagement:**
  - **User Dashboard:** Aggregate personal report statistics, view top scam categories with color-coded analysis, and monitor activity across all joined circles.
  - **Activity Notifications:** Stay updated with a real-time notification system tracking unread alerts and circle events.

---

## Scam Radar & Semantic Clustering

Scam Radar groups incoming scam reports to show community members how widespread an attack is:

- **Per-Circle Semantic Clustering:** Clustering is calculated strictly within each circle's private feed. A report shared to multiple circles receives distinct cluster assignments per circle (`clusterIds: Record<string, string>`).
- **Embedding Generation:** 
  - Text reports are embedded using `gemini-embedding-001` (3072 dimensions, `RETRIEVAL_QUERY`).
  - Image reports participate fully: OCR-extracted text is embedded with a dedicated, bounded timeout.
- **Matching Algorithm:**
  - The report's vector is compared against all existing reports within that circle using cosine similarity.
  - The highest cosine similarity is identified (best match).
  - If similarity exceeds **`> 0.75`**, the report joins that best-matching cluster.
  - Otherwise, a new cluster ID is generated.
  - *Note on clustering architecture:* Clustering currently compares against individual report vectors rather than cluster centroids or hierarchical merges.
- **Community Intelligence UI:**
  - When `clusterCount > 1`, report cards display an indicator showing the number of *other* similar reports (`clusterCount - 1`), such as **`1 similar report`** or **`3 similar reports`**.
  - Singleton reports (`clusterCount = 1`) do not display any cluster badge.
  - The report detail modal surfaces cluster context alongside community confirmation status.

---

## Circle Synchronization & Real-Time Flow

Kinkeeper implements automatic, client-synchronized UI state:

- **Automatic Feed Updates:** When a report is submitted or shared, the Circle feed updates automatically without requiring a manual page refresh.
- **Community Confirmations:** Upvoting ("Confirm") or downvoting ("Deny") updates vote counts in both the active feed and open detail modals.
- **Instant Deletions:** Deleting a report immediately removes it from the Circle feed across the client interface.
- **Non-Destructive Background Refresh:** Background state synchronization updates feed data silently without flashing full-screen loading spinners over already-rendered cards.
- **Manual Refresh Fallback:** A manual refresh button (`↻`) is available in the Circle header as a user-controlled fallback.
- **Transient State Clearing:** Analysis session inputs and results are automatically cleared when navigating away from the Analyze screen after sharing, and when signing out.

---

## Architecture & Data Flow

```
[Citizen Input] (Text / Screenshot / Voice Note)
       │
       ▼
[/api/check] ──► [AI Router & Normalizer] (20s Global Deadline)
       │              ├── Text Normalization / OCR / Audio Transcription
       │              ├── Multi-Model Cascade: Gemini Flash ──► Groq/Llama ──► Deterministic Engine
       │              ├── Google Safe Browsing Lookup v4 (concurrent)
       │              └── Server-side Embedding (gemini-embedding-001, 5s dedicated budget)
       ▼
[Redis Cache] (analysis:{analysisId}, 15 min TTL)
       │
       ▼
[Share to Circle(s)] ──► [/api/circles/[circleId]/report]
       │                      ├── Supabase Membership Auth Guard
       │                      ├── Cosine Similarity (>0.75) against Circle Vectors
       │                      └── Redis Storage (circle:{id} + canonical report:{id}, 60d TTL)
       ▼
[Circle UI / Scam Radar] ──► Automatic Sync + "N similar reports" cluster indicators
       │
       ▼
[Analytics & Alerts] ────► [/api/dashboard] & [/api/notifications]
```

### Storage Layer
- **Upstash Redis (REST API):**
  - `analysis:{analysisId}`: Cached analysis payloads (15-minute TTL) for secure circle sharing.
  - `circle:{circleId}`: Circle report list with 60-day TTL (`5,184,000s`).
  - `report:{reportId}`: Canonical report records with 60-day TTL.
  - `votes:{reportId}`: Member votes set (`userId:voteType:displayName:timestamp`).
  - Distributed quota reservations (RPM/RPD) and circuit breaker state (`CLOSED` / `OPEN` / `HALF_OPEN`) with fail-open safeguards.
- **Supabase (Postgres & Auth):**
  - Secure email/password authentication (Personal Check remains 100% login-free).
  - Relational tables: `profiles`, `groups`, and `group_members` (`(group_id, user_id)` primary key).

---

## Tech Stack

- **Framework:** Next.js 16.3 (App Router, Turbopack) & React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4
- **AI & Vision:** Google Gen AI SDK (`@google/genai`) with `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-embedding-001`
- **Fallback AI Provider:** Groq SDK / OpenAI-compatible API
- **Threat Intelligence:** Google Safe Browsing Lookup API v4
- **Database & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **Cache, Rate Limiting & Radar Storage:** Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`)
- **Deployment:** Vercel

---

## Getting Started

### Prerequisites
- Node.js v20 or later
- Upstash Redis database (free tier works)
- Google Gemini API key (free tier from Google AI Studio)
- Supabase project (free tier works)

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/scam-shield.git
cd scam-shield
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# Required
GEMINI_API_KEY=your_gemini_key
REDIS_KV_REST_API_URL=https://your-database.upstash.io
REDIS_KV_REST_API_TOKEN=your_redis_token
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Optional (graceful fallback)
SAFE_BROWSING_API_KEY=your_safe_browsing_key
GROQ_API_KEY=your_groq_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build & Type Check
```bash
# Verify TypeScript
npx tsc --noEmit

# Production build
npm run build

# Run linter
npm run lint
```

---

## Current Limitations & Engineering Tradeoffs

- **Clustering Strategy:** Uses best-match pairwise cosine similarity against existing report vectors (>0.75) rather than centroid calculation or dynamic cluster splitting/merging. This is optimal for real-time single-write feeds up to hundreds of reports per circle.
- **Audio Processing:** Speech analysis relies on LLM audio transcription and semantic analysis. It does not perform biometric voiceprint or acoustic deepfake frequency synthesis detection.
- **Deletion Concurrency:** Report deletion performs exact-item `LREM` on circle lists with an ID-filter fallback. Under high-frequency concurrent circle writes, this favors availability and latency over strict multi-key distributed transactions.
- **Fail-Open Posture:** If Redis or external threat-intel APIs suffer transient outages, the system fails open to ensure citizen scam checks are never blocked.
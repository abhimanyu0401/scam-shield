# Scam Shield 🛡️

An AI-powered tool that instantly checks any suspicious message or screenshot for scam red flags — combining rule-based checks, real-time threat-intelligence lookup, embedding-based pattern matching, and Gemini reasoning into a single risk score, plain-language explanation, and a ready-to-file Chakshu complaint draft.

Built for **Bharat Pragati PS1 — AI Deepfake & Scam Detection**.

Full architecture reference and future roadmap: [`roadmap.md`](./roadmap.md)

---

## What it does

- **Paste a message or upload a screenshot** — Gemini Vision OCR extracts text from screenshots automatically
- **Multi-signal analysis:** rule-based red-flag checks + Google Safe Browsing link lookup (run concurrently, zero added latency) + cosine-similarity match against 28 curated Indian scam scripts + Gemini reasoning — all merged into one result
- **Risk score (0–100)** with a plain-language explanation in English or Hindi
- **Auto-generated Chakshu complaint draft** on any high-risk result — same Gemini call, no extra API cost. Includes scam type, description, and entities (numbers, links, amounts) extracted from the message
- **Channel routing:** if the message suggests money has already been lost, the UI routes you to the Cyber Crime Helpline (1930 / cybercrime.gov.in) instead of Chakshu
- **Copy Alert to Share** — formats the result as clean, ready-to-paste WhatsApp text, no backend call
- **Scam Radar** — report to a real, invite-only trust circle so others in your group are warned the moment you spot a scam
- **Real accounts** — sign up with email + password; Personal Check stays fully login-free
- **Invite-only groups** — create a named circle and get a shareable invite code, or join one with a code someone shares with you

---

## Features shipped

- ✅ Text-paste scam analysis
- ✅ Screenshot upload with Gemini Vision OCR
- ✅ Multilingual explanations (English / Hindi)
- ✅ 28-pattern embedding library (cosine similarity, `gemini-embedding-001`)
- ✅ Google Safe Browsing real-time malicious-link detection
- ✅ Auto-generated Chakshu complaint draft (schema-extended, zero extra API cost)
- ✅ Copy Alert to Share — WhatsApp-ready formatted text
- ✅ Real accounts — email/password sign up & sign in (Supabase Auth)
- ✅ Invite-only trust circles — create a group, share an invite code, join via code
- ✅ Scam Radar with real group-scoped feeds, similarity clustering, Redis-backed storage
- ✅ Live on Vercel

---

## Getting started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- A Gemini API key (free tier works)
- Optional: a Google Cloud API key with Safe Browsing enabled (the app degrades gracefully without it)

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/scam-shield.git
cd scam-shield
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env.local
# Windows: copy .env.example .env.local
```

Open `.env.local` and fill in:
```
GEMINI_API_KEY=your_gemini_key_here
SAFE_BROWSING_API_KEY=your_google_cloud_key_here   # optional
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Get a Gemini key at [aistudio.google.com](https://aistudio.google.com) → Get API key → Create API key.

Get your Supabase URL and Publishable key from your project's **Connect** dialog (use the Publishable key, not the legacy anon key).

### 4. Run locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

---

## Testing the main features

| What to test | How |
|---|---|
| Text analysis | Paste a suspicious message, click **Check for Scam** |
| Screenshot analysis | Switch to **Upload Screenshot**, drop a message screenshot |
| Hindi explanation | Select **हिं** before checking |
| Chakshu draft | Use a clear scam message — draft appears at risk ≥ 75 |
| Copy Draft / Copy Alert | Click the copy buttons, paste into any text editor |
| Safe Browsing | Include a known phishing URL in the pasted text |
| Sign up | Click **Sign In**, switch to Sign Up, use any email + password |
| Create a circle | Go to **Scam Radar**, click **Create Group**, name it, copy the invite code |
| Join a circle | Click **Join Group**, paste a valid invite code from someone else |
| Scam Radar | With a group joined, report a high-risk result, click **↻** to refresh the feed |

---

## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Gemini API (`@google/genai`) · Google Safe Browsing Lookup API · Supabase (Postgres + Auth) · Upstash Redis · Vercel
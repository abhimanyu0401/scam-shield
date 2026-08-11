# Scam Shield 🛡️

An AI-powered tool that instantly checks suspicious messages, screenshots, and (soon) calls for scam red flags — giving a risk score, plain-language explanation, and safe next steps.

Built for **Bharat Pragati PS1 — AI Deepfake & Scam Detection**.

Full project spec, architecture, and feature roadmap: see [`roadmap.md`](./roadmap.md).

## Current Status
- ✅ Text-paste scam analysis (rule-based checks + Gemini reasoning)
- ✅ Screenshot upload with OCR extraction
- 🚧 Multilingual toggle — in progress
- 🚧 Pattern matching, Scam Radar — coming next

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- A free Gemini API key (see below)

### 1. Clone the repo
```bash
git clone https://github.com/<your-username>/scam-shield.git
cd scam-shield
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up your API key
This project needs a Gemini API key to run. **Each person needs their own key** — it's never committed to git.

1. Copy the example env file:
```bash
   cp .env.example .env.local
```
   (Windows: `copy .env.example .env.local`)
2. Get a free key at [aistudio.google.com](https://aistudio.google.com) → "Get API key" → "Create API key."
3. Open `.env.local` and paste your key in:
```
   GEMINI_API_KEY=your_key_here
```

### 4. Run it
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Testing what's built so far
- Paste a suspicious message and click "Check for Scam"
- Try the "Upload Screenshot" tab with a message screenshot
- Try an obvious scam, a safe message, and an ambiguous one to compare scoring

## Tech Stack
Next.js (App Router), React, TypeScript, Tailwind CSS, Gemini API (`@google/genai`)

## Note on rate limits
We're currently on Gemini's free tier, which has a low daily request limit (about 20 requests/day per key). If you hit a rate-limit error while testing, that's expected — just wait a bit or ping the team before assuming something's broken.
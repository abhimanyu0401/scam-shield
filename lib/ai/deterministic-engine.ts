/**
 * lib/ai/deterministic-engine.ts
 *
 * Reusable Rule-Based Deterministic Fallback Engine for Scam Shield.
 *
 * Responsibilities:
 *   1. Evaluates fast heuristic signals directly from normalized text:
 *        - Urgency keyword detection
 *        - Payment/OTP keyword detection
 *        - URL extraction
 *   2. Evaluates external deterministic signals bounded by the request DeadlineTracker:
 *        - Google Safe Browsing API v4 (bounded by min(2000ms, remainingMs))
 *        - Semantic vector similarity against precomputed scam pattern embeddings
 *   3. Computes calibrated deterministic risk scoring when AI models are unavailable.
 *   4. Generates language-aware degraded explanations without hallucinating confidence.
 *
 * Invariants:
 *   - Consumes the SAME request-level DeadlineTracker; never opens connections if budget <= 250ms.
 *   - complaintDraft is ALWAYS "" in degraded mode.
 *   - financialLossLikely is ALWAYS false in degraded mode.
 *   - analysisMode is ALWAYS "degraded-deterministic".
 *   - Zero user content is ever logged to external telemetry.
 */

import type { AIAnalysisResponse, NormalizedInput, LanguageCode } from "./types";
import type { DeadlineTracker } from "./deadline";
import type { DeterministicFallbackEngine, RouterTelemetry } from "./router";
import scamPatterns from "../scam-pattern-embeddings.json";

// ---------------------------------------------------------------------------
// 1. Scam Taxonomy Types & Configurations
// ---------------------------------------------------------------------------

export type ScamCategory =
  | "OTP_CREDENTIAL_THEFT"
  | "BANK_KYC_PHISHING"
  | "UPI_PAYMENT_FRAUD"
  | "DIGITAL_ARREST_POLICE"
  | "UTILITY_DISCONNECTION"
  | "INVESTMENT_SCAM"
  | "JOB_RECRUITMENT"
  | "LOAN_FINANCIAL"
  | "DELIVERY_COURIER"
  | "ACCOUNT_SUSPENSION"
  | "EXTORTION_THREAT"
  | "REMOTE_ACCESS"
  | "SUSPICIOUS_LINK"
  | "BENIGN";

export type SignalTier = "STRONG" | "MODERATE" | "WEAK" | "BENIGN";

export interface DetectedSignal {
  category: ScamCategory;
  tier: SignalTier;
  label: string;
  evidence: string;
}

export interface CFNRuleMatch {
  ruleId: string;
  flagLabel: string;
  scoreFloor: number;
}

export interface ScamPatternEmbedding {
  id: string;
  name: string;
  text: string;
  embedding: number[];
}

export interface DeterministicResult {
  riskScore: number;
  flags: string[];
  explanation: string;
  foundUrls: string[];
  matchedPattern: string | null;
  isMaliciousLink: boolean | null;
  embedding: number[] | null;
  detectedCategories?: ScamCategory[];
  activeCFNRules?: string[];
}

export interface DeterministicOptions {
  patterns?: ScamPatternEmbedding[];
  safeBrowsingFn?: (urls: string[], signal: AbortSignal) => Promise<boolean | null>;
  embedFn?: (text: string, signal: AbortSignal) => Promise<number[] | null>;
}

// Keep the required export constants for backwards compatibility
export const URGENCY_KEYWORDS: readonly string[] = [
  "immediately",
  "arrest",
  "block",
  "suspend",
  "urgent",
  "action required",
];

export const PAYMENT_KEYWORDS: readonly string[] = [
  "otp",
  "payment",
  "pay",
  "bank",
  "account",
  "transfer",
  "cvv",
  "pin",
];

export const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

// Transliteration Map
export const TRANSLITERATION_MAP: Record<string, readonly string[]> = {
  otp:         ["otp", "otpi", "ओटीपी", "o t p"],
  urgent:      ["jaldi", "turant", "abhi", "argent", "जल्दी", "तुरंत", "अभी"],
  arrest:      ["giraftari", "girftari", "गिरफ्तार"],
  block:       ["band", "bandh", "बंद", "ब्लॉक", "bloked", "blokd"],
  pay:         ["bhejo", "bhej do", "daalo", "भेजो", "डालो"],
  police:      ["pulice", "pullis", "पुलिस"],
  disconnect:  ["band ho jayega", "kat jayega", "कट जाएगा"],
  verify:      ["verify karo", "verif", "vrify"],
  share:       ["batao", "bata", "बताओ", "दो"],
  electricity: ["bijli", "bijlee", "बिजली"],
  fee:         ["शुल्क"],
};

// Spelling Variant Regexes
export const SPELLING_VARIANTS: Record<string, RegExp> = {
  immediately:  /imm?ed[ia]+tel?y|immi?di?at?ly|immdiatly/i,
  urgent:       /urgnt|urgant/i,
  arrested:     /arrsted|arested/i,
  verification: /verif[iy]?c?at?i?on/i,
  blocked:      /bloked|blokd|blockd/i,
  account:      /accnt|acct/i,
};

// Category Patterns
const OTP_STRONG = [
  "share otp", "send otp", "otp share", "otp bhejo", "share code",
  "bata otp", "otp batao", "otp bata", "otp dedo", "share the code",
  "send me the code", "forward the otp", "verification code send",
  "batao otp", "otp send karo", "send verification code", "share verification",
  "batao code", "code batao", "enter code", "submit code", "enter otp"
];
const OTP_STRONG_DEV = ["ओटीपी बताओ", "ओटीपी भेज", "ओटीपी शेयर", "ओटीपी दो", "कोड बताओ", "ओटीपी बताएं", "ओटीपी बताए"];
const OTP_MODERATE = ["otp", "one time password", "verification code", "6-digit", "4-digit", "ओटीपी", "verification-code"];

const KYC_STRONG = [
  "kyc update pending", "kyc verify karo", "pan aadhaar link karo",
  "account will be blocked", "account suspend", "account band ho jayega",
  "account band", "kyc pending", "pan card update", "kyc verification pending",
  "verify your kyc", "link your pan", "avoid account suspension", "avoid block"
];
const KYC_STRONG_DEV = ["केवाईसी", "खाता बंद", "पैन आधार", "अकाउंट ब्लॉक"];
const KYC_MODERATE = ["kyc", "pan aadhaar", "aadhaar link", "bank", "sbi", "hdfc", "icici", "axis", "verify", "pan card", "baink", "बैंक", "खाता"];

const UPI_STRONG = [
  "approve collect request", "enter upi pin to receive", "scan qr to receive money",
  "collect request aaya", "upi pin daal ke approve", "pin enter karo refund ke liye",
  "pin enter to receive", "pin daal", "receive money enter pin", "scan qr code",
  "approve request to receive", "upi pin enter"
];
const UPI_STRONG_DEV = ["पिन डालें", "क्यूआर कोड", "कलेक्ट रिक्वेस्ट", "पिन दर्ज करें"];
const UPI_MODERATE = ["phonepe", "gpay", "paytm", "upi", "collect request", "refund", "pin", "पेटीएम", "यूपीआई", "पिन"];

const ARREST_STRONG = [
  "cbi", "customs department", "enforcement directorate", "narcotics", "digital arrest",
  "do not disconnect", "aadhaar linked to case", "money laundering case",
  "case registered against you", "cyber crime department", "cybercell", "cyber cell",
  "customs officer", "police station jail", "narcotics control bureau", "arrest warrant"
];
const ARREST_STRONG_DEV = ["डिजिटल अरेस्ट", "मनी लॉन्ड्रिंग", "पुलिस अधिकारी", "कस्टम्स"];
const ARREST_MODERATE = ["police officer", "fir", "arrested", "parcel with drugs", "passport", "seal", "giraftari", "girftari", "police", "jail", "arrest", "मामला", "केस"];

const UTILITY_WORDS = ["electricity", "bijli", "bijlee", "power", "gas", "lpg", "water", "बिजली"];
const DISCONNECT_WORDS = ["disconnect", "disconnected", "disconnection", "cut", "band", "kat", "discontinued", "कट जाएगा", "कट जाएगी", "काट दिया जाएगा", "बंद हो"];
const UTILITY_DEMAND = ["call", "pay", "link", "contact", "update", "number", "officer", "कॉल", "संपर्क"];

const INVEST_STRONG = [
  "guaranteed return", "guaranteed profit", "300% monthly", "upper circuit stocks",
  "deposit to activate wallet", "proprietary trading app", "300% return", "guaranteed 300%",
  "earn guaranteed", "vip stock"
];
const INVEST_STRONG_DEV = ["गारंटीड रिटर्न", "मुनाफा", "ट्रेडिंग ग्रुप"];
const INVEST_MODERATE = ["vip trading group", "crypto mining", "usdt", "binance", "nse tips", "telegram group invest", "investment", "trading"];

const JOB_STRONG_DEMANDS = ["pay registration fee", "refundable deposit", "liking youtube videos", "rating google maps", "pay security fee"];
const JOB_STRONG_DEMANDS_DEV = ["रजिस्ट्रेशन फीस", "यूट्यूब वीडियो लाइक"];
const JOB_MODERATE = ["work from home", "earn daily", "earn per day", "part time job", "task complete karo", "salary", "job offer", "telegram task"];

const LOAN_STRONG = [
  "pay processing fee upfront", "file charge refundable", "approved under pm scheme",
  "processing charge", "file charge upfront", "upfront payment for loan"
];
const LOAN_STRONG_DEV = ["प्रोसेसिंग फीस", "लोन मंजूर"];
const LOAN_MODERATE = ["personal loan approved", "0% interest", "pm yojana loan", "fully refundable fee", "loan approved", "लोन"];

const COURIER_STRONG = [
  "customs fee", "clearance fee", "redelivery fee", "shipment held", "unpaid clearance",
  "delivery failed update address"
];
const COURIER_STRONG_DEV = ["कस्टम्स ड्यूटी", "पार्सेल होल्ड"];
const COURIER_MODERATE = ["fedex", "bluedart", "india post", "package on hold", "shipment held at customs", "courier", "delivery address"];

const SUSPEND_STRONG = [
  "sim deactivation", "5g upgrade", "account suspended", "verify immediately",
  "sim block", "sim card block"
];
const SUSPEND_MODERATE = ["jio customer", "airtel", "vodafone", "cancel request", "press 1 to cancel", "reply cancel", "sim deactivation", "telecom"];

const EXTORTION_STRONG = [
  "upload video", "send to youtube", "send to friends list", "facebook friends",
  "pay within", "leak video", "expose video"
];
const EXTORTION_MODERATE = ["video call", "recorded", "family members", "expose", "jailed", "blackmail"];

const REMOTE_STRONG = [
  "anydesk", "teamviewer", "quicksupport", "any desk", "team viewer", "quick support"
];
const REMOTE_MODERATE = ["customer care executive", "technical support team", "fix network", "share screen", "download app", "install app", "9-digit code"];

// Base score matrix mapping
const BASE_MATRIX: Record<ScamCategory, { strong: number; urgency: number; link: number; both: number }> = {
  OTP_CREDENTIAL_THEFT: { strong: 50, urgency: 75, link: 70, both: 85 },
  BANK_KYC_PHISHING:    { strong: 45, urgency: 65, link: 75, both: 85 },
  UPI_PAYMENT_FRAUD:    { strong: 55, urgency: 75, link: 75, both: 85 },
  DIGITAL_ARREST_POLICE: { strong: 75, urgency: 85, link: 80, both: 95 },
  UTILITY_DISCONNECTION: { strong: 35, urgency: 55, link: 65, both: 75 },
  INVESTMENT_SCAM:      { strong: 50, urgency: 65, link: 65, both: 75 },
  JOB_RECRUITMENT:      { strong: 45, urgency: 60, link: 65, both: 75 },
  LOAN_FINANCIAL:       { strong: 50, urgency: 65, link: 70, both: 80 },
  DELIVERY_COURIER:     { strong: 40, urgency: 55, link: 65, both: 75 },
  ACCOUNT_SUSPENSION:   { strong: 40, urgency: 60, link: 65, both: 75 },
  EXTORTION_THREAT:     { strong: 75, urgency: 85, link: 85, both: 90 },
  REMOTE_ACCESS:        { strong: 70, urgency: 80, link: 80, both: 90 },
  SUSPICIOUS_LINK:      { strong: 40, urgency: 55, link: 40, both: 55 },
  BENIGN:               { strong: 0, urgency: 0, link: 0, both: 0 },
};

// Word-boundary Regex Helper with Unicode script support (\p{L}\p{M}\p{N})
export function buildWordBoundaryRegex(word: string): RegExp {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${esc}(?![\\p{L}\\p{M}\\p{N}])`, "iu");
}

// Pattern Matcher Helper
function matchPattern(text: string, lowerText: string, substrings: readonly string[], regexes?: readonly RegExp[]): boolean {
  for (const sub of substrings) {
    if (buildWordBoundaryRegex(sub).test(lowerText)) return true;
  }
  if (regexes) {
    for (const rx of regexes) {
      if (rx.test(text)) return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// 2. Precomputed Scam Patterns Loader (Unchanged)
// ---------------------------------------------------------------------------

export function loadScamPatterns(): ScamPatternEmbedding[] {
  return scamPatterns as ScamPatternEmbedding[];
}

// ---------------------------------------------------------------------------
// 3. Cosine Similarity Vector Math (Unchanged)
// ---------------------------------------------------------------------------

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ---------------------------------------------------------------------------
// 4. External Signal Fetchers (Bounded by Single Deadline) (Unchanged)
// ---------------------------------------------------------------------------

async function checkSafeBrowsing(
  urls: string[],
  tracker: DeadlineTracker,
  overrideFn?: (urls: string[], signal: AbortSignal) => Promise<boolean | null>,
): Promise<boolean | null> {
  if (urls.length === 0) return null;
  if (!tracker.canAttempt()) return null;

  if (overrideFn) {
    const handle = tracker.createAbortHandle(2000);
    try {
      const res = await overrideFn(urls, handle.signal);
      handle.cancel();
      return res;
    } catch {
      handle.cancel();
      return null;
    }
  }

  const apiKey = process.env.SAFE_BROWSING_API_KEY;
  if (!apiKey) return null;

  const handle = tracker.createAbortHandle(2000);

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "scam-shield", clientVersion: "1.0.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: urls.map((url) => ({ url })),
          },
        }),
        signal: handle.signal,
      },
    );

    handle.cancel();

    if (!response.ok) return null;
    const data = await response.json();
    return Boolean(data.matches && data.matches.length > 0);
  } catch {
    handle.cancel();
    return null;
  }
}

// ---------------------------------------------------------------------------
// 5. Internal Scanners and Rule Engines
// ---------------------------------------------------------------------------

function runCategoryDetection(text: string, lowerText: string): DetectedSignal[] {
  const signals: DetectedSignal[] = [];

  // Helper matching predicates for combinations:
  const matchWords = (words: string[]) => words.some(w => buildWordBoundaryRegex(w).test(text));

  // lowerTextNoUrls: lowerText with URL substrings removed.
  // Used only for MODERATE-tier keyword checks to prevent URL domain components
  // (e.g. "sbi" in "https://sbi.co.in") from falsely triggering bank/KYC signals.
  // Strong-tier regex detection, which requires co-occurring action verbs, uses full text.
  const lowerTextNoUrls = lowerText.replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/gi, " ");
  const matchWordsMod = (words: string[]) => words.some(w => buildWordBoundaryRegex(w).test(lowerTextNoUrls));
  
  // 1. OTP_CREDENTIAL_THEFT
  // Regex pattern matching: request verb + OTP word
  const otpRequestRegex = /(?<![\p{L}\p{M}\p{N}])(send|share|give|tell|forward|batao|bata|bhejo|bhej|dedo|daalo|dalo|snd|shar|bta|btao|bheje|enter|submit|daal|put|input|do|de)(?![\p{L}\p{M}\p{N}])[\s\S]{0,60}?(?<![\p{L}\p{M}\p{N}])(otp|one\s*time\s*password|verification|code|pin|password|passcode|otpp|ओटीपी|पासवर्ड)(?![\p{L}\p{M}\p{N}])/iu;
  // otpRequestRegex2: OTP word first, then outbound request verb — constrained gap (≤80 chars) to avoid
  // matching benign delivery messages like "Your OTP is 482910. Do not share with anyone."
  const otpRequestRegex2 = /(?<![\p{L}\p{M}\p{N}])(otp|one\s*time\s*password|verification|code|pin|password|passcode|otpp|ओटीपी|पासवर्ड)(?![\p{L}\p{M}\p{N}])[\s\S]{0,80}?(?<![\p{L}\p{M}\p{N}])(send|share|give|tell|forward|batao|bata|bhejo|bhej|dedo|daalo|dalo|bta|btao|bheje|submit|daal|dena|karo)(?![\p{L}\p{M}\p{N}])[\s\S]{0,30}?(?<![\p{L}\p{M}\p{N}])(me|mujhe|mujh|to me|mujhe|हमें|मुझे)(?![\p{L}\p{M}\p{N}])/iu;

  // Benign OTP delivery: message contains actual OTP digits + delivery phrasing — exclude from strong
  const looksLikeOtpDelivery = /\b\d{4,8}\b/.test(text) &&
    ["your otp is", "otp for", "otp:", "one time password is", "verification code is", "is your otp",
      "आपका ओटीपी", "का ओटीपी"].some(ctx => lowerText.includes(ctx));

  const hasOtpStrong = (!looksLikeOtpDelivery && (otpRequestRegex.test(text) || otpRequestRegex2.test(text))) ||
                       matchPattern(text, lowerText, OTP_STRONG.concat(OTP_STRONG_DEV));
  const hasOtpMod = matchPattern(text, lowerTextNoUrls, OTP_MODERATE) || SPELLING_VARIANTS.verification.test(lowerTextNoUrls);

  // Upgrade OTP_MODERATE to STRONG when paired with an urgency word + outbound share/tell verb.
  // Covers Hinglish patterns like "OTP aaya hai, jaldi batao. Account band ho jayega".
  const hasOtpUrgencyUpgrade = hasOtpMod && !looksLikeOtpDelivery &&
    matchWords(["jaldi", "turant", "immediately", "abhi", "urgently", "तुरंत", "जल्दी", "अभी"]) &&
    matchWords(["batao", "bata", "bhejo", "bhej", "dedo", "dalo", "send", "share", "tell", "forward"]);

  if (hasOtpStrong || hasOtpUrgencyUpgrade) {
    signals.push({ category: "OTP_CREDENTIAL_THEFT", tier: "STRONG", label: "Credential request detected", evidence: "OTP Strong" });
  } else if (hasOtpMod && !looksLikeOtpDelivery) {
    signals.push({ category: "OTP_CREDENTIAL_THEFT", tier: "MODERATE", label: "OTP keyword present", evidence: "OTP Moderate" });
  }

  // 2. BANK_KYC_PHISHING
  const kycReqRegex = /(?<![\p{L}\p{M}\p{N}])(kyc|pan|aadhaar|pan-aadhaar|account|card|sbi|hdfc|icici|axis|baink|bank|खाता|बैंक|paytm)(?![\p{L}\p{M}\p{N}])[\s\S]*?(?<![\p{L}\p{M}\p{N}])(update|verify|link|block|suspend|band|pending|deactivate|vrify|verif|blocked|suspension)(?![\p{L}\p{M}\p{N}])/iu;
  const hasKycStrong = kycReqRegex.test(text) || matchPattern(text, lowerText, KYC_STRONG.concat(KYC_STRONG_DEV));
  const hasKycMod = matchPattern(text, lowerTextNoUrls, KYC_MODERATE);
  
  if (hasKycStrong) {
    signals.push({ category: "BANK_KYC_PHISHING", tier: "STRONG", label: "Urgent bank KYC verification request", evidence: "KYC Strong" });
  } else if (hasKycMod) {
    signals.push({ category: "BANK_KYC_PHISHING", tier: "MODERATE", label: "Bank verification phrase", evidence: "KYC Moderate" });
  }

  // 3. UPI_PAYMENT_FRAUD
  const upiReqRegex = /(?<![\p{L}\p{M}\p{N}])(pin|upi|collect|refund|paytm|phonepe|gpay|qr|receive|money|approve)(?![\p{L}\p{M}\p{N}])[\s\S]*?(?<![\p{L}\p{M}\p{N}])(enter|approve|scan|receive|refund|collect|daal|put|approve collect|collect request|dalo)(?![\p{L}\p{M}\p{N}])/iu;
  const hasUpiStrong = upiReqRegex.test(text) || matchPattern(text, lowerText, UPI_STRONG.concat(UPI_STRONG_DEV));
  const hasUpiMod = matchPattern(text, lowerTextNoUrls, UPI_MODERATE);
  
  if (hasUpiStrong) {
    signals.push({ category: "UPI_PAYMENT_FRAUD", tier: "STRONG", label: "UPI collect request/PIN demand", evidence: "UPI Strong" });
  } else if (hasUpiMod) {
    signals.push({ category: "UPI_PAYMENT_FRAUD", tier: "MODERATE", label: "Payment system keywords", evidence: "UPI Moderate" });
  }

  // 4. DIGITAL_ARREST_POLICE
  const policeReqRegex = /(?<![\p{L}\p{M}\p{N}])(cbi|police|customs|narcotics|officer|arrest|giraftari|girftari|fir|laundering|jail|case|cyber|commissioner)(?![\p{L}\p{M}\p{N}])[\s\S]*?(?<![\p{L}\p{M}\p{N}])(arrest|fir|disconnect|jail|video|laundering|narcotics|drug|passport|customs|officer|arrested|giraftari|girftari)(?![\p{L}\p{M}\p{N}])/iu;
  const hasArrestStrong = policeReqRegex.test(text) || matchPattern(text, lowerText, ARREST_STRONG.concat(ARREST_STRONG_DEV));
  const hasArrestMod = matchPattern(text, lowerTextNoUrls, ARREST_MODERATE) || SPELLING_VARIANTS.arrested.test(lowerTextNoUrls);
  
  if (hasArrestStrong) {
    signals.push({ category: "DIGITAL_ARREST_POLICE", tier: "STRONG", label: "Law enforcement impersonation", evidence: "Arrest Strong" });
  } else if (hasArrestMod) {
    signals.push({ category: "DIGITAL_ARREST_POLICE", tier: "MODERATE", label: "Authority/police mention", evidence: "Arrest Moderate" });
  }

  // 5. UTILITY_DISCONNECTION
  const hasUtilityWord = matchPattern(text, lowerTextNoUrls, UTILITY_WORDS);
  const hasDisconnectWord = matchPattern(text, lowerTextNoUrls, DISCONNECT_WORDS);
  const hasUtilityDemand = matchPattern(text, lowerTextNoUrls, UTILITY_DEMAND) || lowerTextNoUrls.match(/\b\d{10}\b/);
  if (hasUtilityWord && hasDisconnectWord && hasUtilityDemand) {
    signals.push({ category: "UTILITY_DISCONNECTION", tier: "STRONG", label: "Utility disconnection threat", evidence: "Utility Strong" });
  } else if (hasUtilityWord || hasDisconnectWord) {
    signals.push({ category: "UTILITY_DISCONNECTION", tier: "MODERATE", label: "Utility account status mention", evidence: "Utility Moderate" });
  }

  // 6. INVESTMENT_SCAM
  const hasInvestStrong = matchPattern(text, lowerText, INVEST_STRONG.concat(INVEST_STRONG_DEV)) ||
                         (matchWords(["return", "profit", "earn", "returns"]) && matchWords(["guaranteed", "300%", "daily"]));
  const hasInvestMod = matchPattern(text, lowerTextNoUrls, INVEST_MODERATE);
  
  if (hasInvestStrong) {
    signals.push({ category: "INVESTMENT_SCAM", tier: "STRONG", label: "Guaranteed investment returns scheme", evidence: "Invest Strong" });
  } else if (hasInvestMod) {
    signals.push({ category: "INVESTMENT_SCAM", tier: "MODERATE", label: "Investment keywords", evidence: "Invest Moderate" });
  }

  // 7. JOB_RECRUITMENT
  const hasJobStrongDemand = matchPattern(text, lowerText, JOB_STRONG_DEMANDS.concat(JOB_STRONG_DEMANDS_DEV));
  const hasJobMod = matchPattern(text, lowerTextNoUrls, JOB_MODERATE);
  const hasSalaryWords = matchWords(["earn", "salary", "part time", "commission", "kamaye", "daily"]);
  if (hasJobStrongDemand || (hasJobMod && hasSalaryWords)) {
    signals.push({ category: "JOB_RECRUITMENT", tier: "STRONG", label: "Pay-to-work task job offer", evidence: "Job Strong" });
  } else if (hasJobMod || hasJobStrongDemand) {
    signals.push({ category: "JOB_RECRUITMENT", tier: "MODERATE", label: "Employment opportunity keywords", evidence: "Job Moderate" });
  }

  // 8. LOAN_FINANCIAL
  const hasLoanStrong = matchPattern(text, lowerText, LOAN_STRONG.concat(LOAN_STRONG_DEV)) ||
                        (matchWords(["loan"]) && matchWords(["processing", "file", "refundable"]) && matchWords(["fee", "charge", "upfront"]));
  const hasLoanMod = matchPattern(text, lowerTextNoUrls, LOAN_MODERATE);
  
  if (hasLoanStrong) {
    signals.push({ category: "LOAN_FINANCIAL", tier: "STRONG", label: "Upfront processing fee for loan approval", evidence: "Loan Strong" });
  } else if (hasLoanMod) {
    signals.push({ category: "LOAN_FINANCIAL", tier: "MODERATE", label: "Loan offer keywords", evidence: "Loan Moderate" });
  }

  // 9. DELIVERY_COURIER
  const hasCourierStrong = matchPattern(text, lowerText, COURIER_STRONG.concat(COURIER_STRONG_DEV)) ||
                           (matchWords(["customs", "delivery", "parcel", "redelivery"]) && matchWords(["fee", "charge", "unpaid"]));
  const hasCourierMod = matchPattern(text, lowerTextNoUrls, COURIER_MODERATE);
  
  if (hasCourierStrong) {
    signals.push({ category: "DELIVERY_COURIER", tier: "STRONG", label: "Clearance fee for parcel delivery", evidence: "Courier Strong" });
  } else if (hasCourierMod) {
    signals.push({ category: "DELIVERY_COURIER", tier: "MODERATE", label: "Delivery courier keywords", evidence: "Courier Moderate" });
  }

  // 10. ACCOUNT_SUSPENSION
  const hasSuspendStrong = matchPattern(text, lowerText, SUSPEND_STRONG) ||
                           (matchWords(["sim", "account", "5g"]) && matchWords(["suspended", "blocked", "deactivation", "upgrade"]) && matchWords(["verify", "immediately", "urgent"]));
  const hasSuspendMod = matchPattern(text, lowerTextNoUrls, SUSPEND_MODERATE);
  
  if (hasSuspendStrong) {
    signals.push({ category: "ACCOUNT_SUSPENSION", tier: "STRONG", label: "Urgent account/SIM suspension threat", evidence: "Suspend Strong" });
  } else if (hasSuspendMod) {
    signals.push({ category: "ACCOUNT_SUSPENSION", tier: "MODERATE", label: "Telecom service status keywords", evidence: "Suspend Moderate" });
  }

  // 11. EXTORTION_THREAT
  const hasExtortionStrong = matchPattern(text, lowerText, EXTORTION_STRONG) ||
                             (matchWords(["video", "photo", "record"]) && matchWords(["upload", "youtube", "facebook", "expose", "leak"]) && matchWords(["pay", "money", "transfer"]));
  const hasExtortionMod = matchPattern(text, lowerTextNoUrls, EXTORTION_MODERATE);
  
  if (hasExtortionStrong) {
    signals.push({ category: "EXTORTION_THREAT", tier: "STRONG", label: "Video leak / legal threat extortion", evidence: "Extortion Strong" });
  } else if (hasExtortionMod || hasExtortionStrong) {
    signals.push({ category: "EXTORTION_THREAT", tier: "MODERATE", label: "Coercive / threat warning", evidence: "Extortion Moderate" });
  }

  // 12. REMOTE_ACCESS
  const hasRemoteStrong = matchPattern(text, lowerText, REMOTE_STRONG) ||
                          (matchWords(["anydesk", "teamviewer", "quicksupport"]) && matchWords(["download", "install", "share", "code"]));
  const hasRemoteMod = matchPattern(text, lowerTextNoUrls, REMOTE_MODERATE);
  
  if (hasRemoteStrong) {
    signals.push({ category: "REMOTE_ACCESS", tier: "STRONG", label: "Remote screen share control request", evidence: "Remote Strong" });
  } else if (hasRemoteMod || hasRemoteStrong) {
    signals.push({ category: "REMOTE_ACCESS", tier: "MODERATE", label: "Technical remote assistance mention", evidence: "Remote Moderate" });
  }

  // No fallback "BENIGN" signal is manufactured when no scam signals are found.
  // The absence of signals naturally produces a base score of 0 without requiring suppression.

  return signals;
}

function isUrlShortened(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  const shortenedDomains = ["bit.ly", "tinyurl.com", "t.me", "rb.gy", "cutt.ly", "is.gd"];
  for (const dom of shortenedDomains) {
    if (lowerUrl.includes(dom)) return true;
  }
  return false;
}

function hasActionDemand(lowerText: string): boolean {
  const actionDemands = ["verify", "update", "pay", "click", "link", "call", "confirm", "check", "karo", "turant", "approve"];
  for (const action of actionDemands) {
    if (buildWordBoundaryRegex(action).test(lowerText)) return true;
  }
  return false;
}

function runCFNRules(
  signals: DetectedSignal[],
  hasUrl: boolean,
  isMaliciousLink: boolean | null,
  text: string,
  lowerText: string,
  foundUrls: string[]
): CFNRuleMatch[] {
  const matches: CFNRuleMatch[] = [];

  const hasStrongCategory = (cat: ScamCategory) => signals.some(s => s.category === cat && s.tier === "STRONG");
  const matchWords = (words: string[]) => words.some(w => buildWordBoundaryRegex(w).test(text));

  // CFN-01: Government/police impersonation + arrest threat
  const hasGovAgency = matchWords(["cbi", "customs", "narcotics", "enforcement directorate", "cyber crime", "cybercell", "cyber cell", "cyber police"]);
  const hasArrestThreat = matchWords(["arrest", "fir", "case registered", "jail", "digital arrest", "digitally arrested", "giraftari", "girftari", "police custody"]) ||
                           SPELLING_VARIANTS.arrested.test(text);
  if (hasGovAgency && hasArrestThreat) {
    matches.push({
      ruleId: "CFN-01",
      flagLabel: "Government/law enforcement impersonation",
      scoreFloor: 80
    });
  }

  // CFN-02: OTP/credential request + urgency + financial context
  const hasOtpStrong = hasStrongCategory("OTP_CREDENTIAL_THEFT");
  const hasUrgency = matchWords(["immediately", "turant", "jaldi", "expires", "within 2 minutes", "urgent", "urgently", "abhi", "तुरंत", "जल्दी", "अभी"]) ||
                     SPELLING_VARIANTS.immediately.test(text) ||
                     SPELLING_VARIANTS.urgent.test(text);
  const hasFinancial = matchWords(["bank", "account", "verify", "baink", "hdfc", "sbi", "icici", "axis", "card", "card details", "upi", "pin", "खाता", "बैंक"]) ||
                        SPELLING_VARIANTS.account.test(text);
  if (hasOtpStrong && hasUrgency && hasFinancial) {
    matches.push({
      ruleId: "CFN-02",
      flagLabel: "Urgent OTP/credential request",
      scoreFloor: 80
    });
  }

  // CFN-03: Bank/KYC verification + URL
  const hasKycContext = matchWords(["kyc", "pan aadhaar", "account block", "blocked", "suspend", "suspension", "verification"]) ||
                        SPELLING_VARIANTS.blocked.test(text) ||
                        SPELLING_VARIANTS.verification.test(text);
  if (hasKycContext && hasUrl) {
    matches.push({
      ruleId: "CFN-03",
      flagLabel: "Bank phishing link",
      scoreFloor: 75
    });
  }

  // CFN-04: Confirmed Safe Browsing malicious
  if (isMaliciousLink === true) {
    matches.push({
      ruleId: "CFN-04",
      flagLabel: "⚠️ Known malicious link",
      scoreFloor: 95
    });
  }

  // CFN-05: Utility disconnection + call/URL demand
  const hasUtility = matchWords(["electricity", "bijli", "bijlee", "power", "gas", "lpg", "water", "बिजली"]);
  const hasDisconnect = matchWords(["disconnect", "disconnected", "disconnection", "cut", "band", "kat", "discontinued", "कट जाएगा", "कट जाएगी", "काट दिया जाएगा", "बंद हो"]);
  const hasContactDemand = hasUrl ||
    matchWords(["call", "contact", "pay", "number", "officer", "helpline", "कॉल", "संपर्क"]) ||
    Boolean(text.match(/\b\d{10}\b/));
  if (hasUtility && hasDisconnect && hasContactDemand) {
    matches.push({
      ruleId: "CFN-05",
      flagLabel: "Fake utility disconnection threat",
      scoreFloor: 70
    });
  }

  // CFN-06: Remote access app + code share
  const hasRemoteApp = matchWords(["anydesk", "teamviewer", "quicksupport", "quick support", "any desk", "team viewer"]);
  const hasInstallDemand = matchWords(["download", "install", "share code", "9-digit", "code share", "share screen"]);
  if (hasRemoteApp && hasInstallDemand) {
    matches.push({
      ruleId: "CFN-06",
      flagLabel: "Remote access/screen sharing request",
      scoreFloor: 85
    });
  }

  // CFN-07: Account suspension + credential request
  const hasSuspensionContext = matchWords(["account suspended", "sim deactivation", "account blocked", "sim deact", "sim blocked"]) ||
                               SPELLING_VARIANTS.blocked.test(text);
  const hasCredRequest = matchWords(["enter otp", "verify", "confirm details", "otp share", "send otp", "otp batao", "verification code"]);
  if (hasSuspensionContext && hasCredRequest) {
    matches.push({
      ruleId: "CFN-07",
      flagLabel: "Account suspension phishing",
      scoreFloor: 75
    });
  }

  // CFN-08: UPI collect request + PIN entry
  const hasCollectRequest = matchWords(["collect request", "approve request", "approve collect"]);
  const hasPinEntryDemand = matchWords(["pin", "upi pin", "enter pin", "pin daal", "pin enter"]);
  if (hasCollectRequest && hasPinEntryDemand) {
    matches.push({
      ruleId: "CFN-08",
      flagLabel: "UPI collect request fraud",
      scoreFloor: 85
    });
  }

  return matches;
}

function computeBaseScore(signals: DetectedSignal[], hasUrl: boolean, lowerText: string): number {
  const categoryScores: Record<ScamCategory, number> = {
    OTP_CREDENTIAL_THEFT: 0,
    BANK_KYC_PHISHING: 0,
    UPI_PAYMENT_FRAUD: 0,
    DIGITAL_ARREST_POLICE: 0,
    UTILITY_DISCONNECTION: 0,
    INVESTMENT_SCAM: 0,
    JOB_RECRUITMENT: 0,
    LOAN_FINANCIAL: 0,
    DELIVERY_COURIER: 0,
    ACCOUNT_SUSPENSION: 0,
    EXTORTION_THREAT: 0,
    REMOTE_ACCESS: 0,
    SUSPICIOUS_LINK: 0,
    BENIGN: 0,
  };

  const hasUrgency = matchPattern("", lowerText, ["immediately", "turant", "jaldi", "expires", "within 2 minutes", "today", "tonight", "aaj raat", "last date", "last warning", "immediate", "urgently", "abhi", "digital arrest", "do not disconnect", "तुरंत", "जल्दी", "अभी"]) ||
    SPELLING_VARIANTS.immediately.test(lowerText) ||
    SPELLING_VARIANTS.urgent.test(lowerText);
  const hasLinkOrPayment = hasUrl || matchPattern("", lowerText, ["pay", "transfer", "money", "refund", "fee", "charge", "deposit", "upi", "pin", "collect request", "link", "click"]);

  // Group signals by category
  const signalsByCat: Record<ScamCategory, DetectedSignal[]> = {
    OTP_CREDENTIAL_THEFT: [],
    BANK_KYC_PHISHING: [],
    UPI_PAYMENT_FRAUD: [],
    DIGITAL_ARREST_POLICE: [],
    UTILITY_DISCONNECTION: [],
    INVESTMENT_SCAM: [],
    JOB_RECRUITMENT: [],
    LOAN_FINANCIAL: [],
    DELIVERY_COURIER: [],
    ACCOUNT_SUSPENSION: [],
    EXTORTION_THREAT: [],
    REMOTE_ACCESS: [],
    SUSPICIOUS_LINK: [],
    BENIGN: [],
  };

  for (const sig of signals) {
    signalsByCat[sig.category].push(sig);
  }

  for (const catKey of Object.keys(BASE_MATRIX) as ScamCategory[]) {
    const catSignals = signalsByCat[catKey];
    if (catSignals.length === 0) continue;

    const hasStrong = catSignals.some(s => s.tier === "STRONG");
    const hasModerate = catSignals.some(s => s.tier === "MODERATE");
    const hasWeak = catSignals.some(s => s.tier === "WEAK");

    if (hasStrong) {
      const matrix = BASE_MATRIX[catKey];
      if (hasUrgency && hasLinkOrPayment) {
        categoryScores[catKey] = matrix.both;
      } else if (hasUrgency) {
        categoryScores[catKey] = matrix.urgency;
      } else if (hasLinkOrPayment) {
        categoryScores[catKey] = matrix.link;
      } else {
        categoryScores[catKey] = matrix.strong;
      }
    } else if (hasModerate) {
      categoryScores[catKey] = 30;
    } else if (hasWeak) {
      categoryScores[catKey] = 15;
    }
  }

  const scores = Object.values(categoryScores);
  return Math.max(...scores, 0);
}

function applyBenignSuppressors(
  text: string,
  lowerText: string,
  signals: DetectedSignal[],
  baseScore: number
): number {
  // Precedence Ladder: Suppressors cannot override strong scam demands (Priority 3)
  const hasStrongScam = signals.some(
    s => s.tier === "STRONG" && s.category !== "BENIGN" && s.category !== "SUSPICIOUS_LINK"
  );
  if (hasStrongScam) {
    return baseScore;
  }

  // 1. Contextual benign OTP suppression
  const hasOtpCode = /\b\d{4,8}\b/.test(text);
  const lowerOtpDeliveryContext = [
    "your otp is", "otp for", "hdfc bank: otp", "sbi: otp", "otp code",
    "one time password for", "verification code is", "is your verification code",
    "आपका ओटीपी", "का ओटीपी"
  ];
  const hasOtpDeliveryContext = lowerOtpDeliveryContext.some(ctx => lowerText.includes(ctx));
  const hasAdvisory = ["do not share", "never share", "don't share", "किसी को न बताएं", "किसी के साथ साझा न करें"].some(adv => lowerText.includes(adv));
  const hasOutboundRequest = [
    "send me", "share otp", "otp batao", "batao", "otp send", "forward",
    "bata", "dedo", "bhejo", "bhej do", "share with me", "tell me"
  ].some(verb => lowerText.includes(verb));

  if (hasOtpCode && hasOtpDeliveryContext && hasAdvisory && !hasOutboundRequest) {
    return 0; // force OTP delivery to ≤ 5 (0 is safest)
  }

  // 2. Payment confirmation suppressor
  const hasPaymentConfirmation = [
    "sent successfully", "debited successfully", "payment successful",
    "transaction of", "debited from", "credited to", "sent to"
  ].some(pat => lowerText.includes(pat));
  const hasPaymentDemand = [
    "pay", "transfer", "send money", "deposit", "collect request", "approve collect"
  ].some(pat => lowerText.includes(pat));

  if (hasPaymentConfirmation && !hasPaymentDemand) {
    baseScore = Math.max(0, baseScore - 30);
  }

  // 3. Bill generated suppressor
  const hasBillGenerated = [
    "bill generated", "due date", "bill of", "electricity bill for"
  ].some(pat => lowerText.includes(pat));
  const hasDisconnectThreat = [
    "disconnect", "power cut", "kat", "band", "discontinue"
  ].some(pat => lowerText.includes(pat));

  if (hasBillGenerated && !hasDisconnectThreat) {
    baseScore = Math.max(0, baseScore - 20);
  }

  // 4. Logistics confirmation suppressor
  const hasLogistics = [
    "delivered", "shipped", "out for delivery", "parcel delivered"
  ].some(pat => lowerText.includes(pat));
  const hasOtpStrong = signals.some(s => s.category === "OTP_CREDENTIAL_THEFT" && s.tier === "STRONG");

  if (hasLogistics && !hasOtpStrong && !hasPaymentDemand) {
    baseScore = Math.max(0, baseScore - 15);
  }

  // 5. Purely informational / no imperative demand.
  // Note: "pay" and "link" intentionally omitted — too common in benign social contexts.
  // Reduction is -20 (not -15) to push URL-only informational messages (e.g. "Visit https://sbi.co.in")
  // from a moderate-keyword score of 30 down to <= 10, satisfying B6-L01.
  const hasImperativeDemand = [
    "click", "verify", "call", "send", "approve", "download", "enter",
    "install", "update", "batao", "bhejo", "collect request", "approve collect"
  ].some(pat => lowerText.includes(pat));

  if (!hasImperativeDemand) {
    baseScore = Math.max(0, baseScore - 20);
  }

  // 6. Social payment suppressor — casual mention of GPay/PhonePe with no collect/PIN demand
  const hasCasualPaymentApp = ["gpay", "phonepe", "paytm"].some(app => lowerText.includes(app));
  const hasCollectOrPin = ["collect request", "approve collect", "upi pin", "enter pin",
    "pin daal", "pin enter", "scan qr", "collect karo"].some(pat => lowerText.includes(pat));
  if (hasCasualPaymentApp && !hasCollectOrPin && !hasStrongScam) {
    baseScore = Math.max(0, baseScore - 20);
  }

  return baseScore;
}

function buildExplanation(
  signals: DetectedSignal[],
  cfnMatches: CFNRuleMatch[],
  language: LanguageCode,
  score: number,
  primaryCategory: ScamCategory
): string {
  const isHindi = language === "hi";

  let bandLabelEn = "Safe";
  let bandLabelHi = "सुरक्षित";
  if (score >= 90) {
    bandLabelEn = "Definite Scam";
    bandLabelHi = "निश्चित धोखाधड़ी";
  } else if (score >= 75) {
    bandLabelEn = "Likely Scam";
    bandLabelHi = "धोखाधड़ी की संभावना";
  } else if (score >= 56) {
    bandLabelEn = "High Risk";
    bandLabelHi = "उच्च जोखिम";
  } else if (score >= 36) {
    bandLabelEn = "Suspicious";
    bandLabelHi = "संदिग्ध";
  } else if (score >= 16) {
    bandLabelEn = "Informational";
    bandLabelHi = "जानकारीपूर्ण";
  }

  const categoryLabelsEn: Record<ScamCategory, string> = {
    OTP_CREDENTIAL_THEFT: "OTP or credential theft attempts",
    BANK_KYC_PHISHING: "Bank KYC update or PAN link phishing",
    UPI_PAYMENT_FRAUD: "UPI payment or collect request fraud",
    DIGITAL_ARREST_POLICE: "law enforcement impersonation and digital arrest threats",
    UTILITY_DISCONNECTION: "electricity or utility disconnection threats",
    INVESTMENT_SCAM: "guaranteed returns or stock trading group scams",
    JOB_RECRUITMENT: "pay-to-work or task-based job scams",
    LOAN_FINANCIAL: "upfront fee loan approval schemes",
    DELIVERY_COURIER: "customs fee or courier redelivery scams",
    ACCOUNT_SUSPENSION: "SIM swap or account suspension threats",
    EXTORTION_THREAT: "extortion or blackmail threats",
    REMOTE_ACCESS: "unauthorized remote control app installation requests",
    SUSPICIOUS_LINK: "suspicious shortened link phishing",
    BENIGN: "legitimate communications",
  };

  const categoryLabelsHi: Record<ScamCategory, string> = {
    OTP_CREDENTIAL_THEFT: "ओटीपी या क्रेडेंशियल चोरी के प्रयास",
    BANK_KYC_PHISHING: "बैंक केवाईसी अपडेट या पैन लिंक फ़िशिंग",
    UPI_PAYMENT_FRAUD: "यूपीआई भुगतान या कलेक्ट रिक्वेस्ट धोखाधड़ी",
    DIGITAL_ARREST_POLICE: "कानून प्रवर्तन प्रतिरूपण और डिजिटल अरेस्ट की धमकी",
    UTILITY_DISCONNECTION: "बिजली या उपयोगिता सेवा काटने की धमकी",
    INVESTMENT_SCAM: "गारंटीड रिटर्न या स्टॉक ट्रेडिंग ग्रुप धोखाधड़ी",
    JOB_RECRUITMENT: "काम के बदले भुगतान या टास्क-आधारित नौकरी घोटाला",
    LOAN_FINANCIAL: "लोन के लिए अग्रिम शुल्क की मांग",
    DELIVERY_COURIER: "कस्टम्स शुल्क या कूरियर डिलीवरी घोटाला",
    ACCOUNT_SUSPENSION: "सिम स्वैप या खाता निलंबित करने की धमकी",
    EXTORTION_THREAT: "जबरन वसूली या ब्लैकमेल की धमकी",
    REMOTE_ACCESS: "रिमोट कंट्रोल ऐप डाउनलोड करने का अनुरोध",
    SUSPICIOUS_LINK: "संदिग्ध शॉर्ट लिंक फ़िशिंग",
    BENIGN: "वैध संचार",
  };

  const disclaimerEn = "This is a rule-based assessment, not AI analysis. It may miss subtle scams or incorrectly flag legitimate messages.";
  const disclaimerHi = "यह नियम-आधारित मूल्यांकन है, एआई विश्लेषण नहीं। यह सूक्ष्म धोखे चूक सकता है या वैध संदेशों को गलत तरीके से चिन्हित कर सकता है।";

  const noticeEn = "AI analysis is temporarily unavailable. The following is based on automated rule analysis only.";
  const noticeHi = "एआई विश्लेषण अस्थायी रूप से अनुपलब्ध है। यह केवल स्वचालित नियम-आधारित जांच का परिणाम है।";

  const uniqueFlags = Array.from(new Set([
    ...signals.map(s => s.label),
    ...cfnMatches.map(c => c.flagLabel)
  ])).filter(Boolean);

  if (uniqueFlags.length === 0) {
    if (isHindi) {
      return `${noticeHi}\n\nस्वचालित जांच में कोई स्पष्ट धोखाधड़ी संकेत नहीं मिला। फिर भी, स्रोत की स्वयं जांच करें।\n\n${disclaimerHi}`;
    }
    return `${noticeEn}\n\nNo obvious scam indicators were found in the automated rule check. However, please verify the source manually if in doubt.\n\n${disclaimerEn}`;
  }

  const catLabel = isHindi ? categoryLabelsHi[primaryCategory] : categoryLabelsEn[primaryCategory];
  const bandLabel = isHindi ? bandLabelHi : bandLabelEn;
  const flagsStr = uniqueFlags.join("; ");

  if (isHindi) {
    return `${noticeHi}\n\nयह संदेश ${catLabel} से जुड़े पैटर्न से मेल खाता है। नियम विश्लेषण ${bandLabel} जोखिम दर्शाता है।\nसंकेत: ${flagsStr}।\n\n${disclaimerHi}`;
  }
  return `${noticeEn}\n\nThis message matches patterns associated with ${catLabel}. Rule-based analysis indicates ${bandLabel} risk.\nDetected indicators: ${flagsStr}.\n\n${disclaimerEn}`;
}

// ---------------------------------------------------------------------------
// 6. Primary Deterministic Analysis
// ---------------------------------------------------------------------------

export async function runDeterministicAnalysis(
  input: NormalizedInput,
  tracker: DeadlineTracker,
  options: DeterministicOptions = {},
): Promise<DeterministicResult> {
  const text = input.text.trim();
  const lowerText = text.toLowerCase();

  // URL extraction
  const foundUrls = text.match(URL_REGEX) || [];

  // Local synchronous steps
  const signals = runCategoryDetection(text, lowerText);

  // Safe Browsing Check (bounded by remaining deadline)
  let isMaliciousLink: boolean | null = null;
  if (foundUrls.length > 0 && tracker.canAttempt()) {
    isMaliciousLink = await checkSafeBrowsing(foundUrls, tracker, options.safeBrowsingFn);
  }

  // CFN Rules
  const cfnMatches = runCFNRules(signals, foundUrls.length > 0, isMaliciousLink, text, lowerText, foundUrls);

  // Base score calculation
  let baseScore = computeBaseScore(signals, foundUrls.length > 0, lowerText);

  // Apply suppressors
  baseScore = applyBenignSuppressors(text, lowerText, signals, baseScore);

  // Apply CFN floors
  const cfnFloor = cfnMatches.length > 0 ? Math.max(...cfnMatches.map(c => c.scoreFloor)) : 0;
  let finalScore = Math.max(baseScore, cfnFloor);

  // Apply adjustments
  // Safe Browsing adjustment
  if (isMaliciousLink === true) {
    finalScore = 95; // CFN-04 override
  } else if (isMaliciousLink === false) {
    finalScore = Math.max(0, finalScore - 10);
  }

  // Shortened URL heuristic
  let hasShortened = false;
  if (foundUrls.length > 0) {
    for (const url of foundUrls) {
      if (isUrlShortened(url)) {
        hasShortened = true;
        break;
      }
    }
  }

  if (hasShortened && hasActionDemand(lowerText) && isMaliciousLink === null) {
    // Cap bonus: when no other strong scam signals exist, limit shortened URL boost to
    // avoid over-scoring messages that only have a URL + one keyword (e.g. "Verify KYC: bit.ly/...").
    // If a CFN floor was already applied (cfnFloor > 0), do not add the bonus on top.
    if (cfnFloor === 0) {
      finalScore = Math.min(75, finalScore + 20);
    }
    signals.push({ category: "SUSPICIOUS_LINK", tier: "STRONG", label: "Suspicious shortened link demand", evidence: "Shortened link + Action" });
  }

  // Pattern Matching / Embeddings
  let matchedPattern: string | null = null;
  let embedding: number[] | null = null;
  const patterns = options.patterns ?? loadScamPatterns();
  let embeddingAdjustment = 0;

  if (options.embedFn && tracker.canAttempt() && text.length > 10 && patterns.length > 0) {
    const handle = tracker.createAbortHandle(3000);
    try {
      embedding = await options.embedFn(text, handle.signal);
      handle.cancel();

      if (embedding) {
        let bestMatch: ScamPatternEmbedding | null = null;
        let highestSim = -1;

        for (const pattern of patterns) {
          const sim = cosineSimilarity(embedding, pattern.embedding);
          if (sim > highestSim) {
            highestSim = sim;
            bestMatch = pattern;
          }
        }

        if (bestMatch) {
          if (highestSim > 0.7) {
            matchedPattern = bestMatch.name;
          }

          // Apply adjustment only if baseScore >= 25 (B6 Correction 5 — conditioned embedding).
          // The ScamPatternEmbedding schema does not expose a ScamCategory field, so we MUST NOT
          // add a fake BENIGN DetectedSignal. embeddingAdjustment and matchedPattern are tracked
          // separately and never inserted into the signals array.
          if (baseScore >= 25) {
            if (highestSim > 0.85) {
              embeddingAdjustment = 10;
            } else if (highestSim > 0.70) {
              embeddingAdjustment = 5;
            }
          }
        }
      }
    } catch {
      handle.cancel();
    }
  }

  finalScore = finalScore + embeddingAdjustment;
  finalScore = Math.min(100, Math.max(0, finalScore));

  // Determine flags list
  let flagsList = Array.from(new Set([
    ...signals.map(s => s.label),
    ...cfnMatches.map(c => c.flagLabel)
  ])).filter(f => f && f !== "Informational keywords present");

  if (finalScore <= 5) {
    flagsList = []; // Clear flags for benign
  }

  // Primary category selector for explanation:
  let primaryCategory: ScamCategory = "BENIGN";
  for (const sig of signals) {
    if (sig.category !== "BENIGN") {
      primaryCategory = sig.category;
      break;
    }
  }

  const explanationText = buildExplanation(signals, cfnMatches, input.language, finalScore, primaryCategory);

  return {
    riskScore: finalScore,
    flags: flagsList,
    explanation: explanationText,
    foundUrls,
    matchedPattern,
    isMaliciousLink,
    embedding,
    detectedCategories: Array.from(new Set(signals.map(s => s.category))),
    activeCFNRules: cfnMatches.map(c => c.ruleId),
  };
}

// ---------------------------------------------------------------------------
// 7. Fallback Adapter for Router Integration (Unchanged)
// ---------------------------------------------------------------------------

export function createDeterministicFallbackEngine(
  options: DeterministicOptions = {},
): DeterministicFallbackEngine {
  return async (
    input: NormalizedInput,
    tracker: DeadlineTracker,
    _telemetry: RouterTelemetry,
  ): Promise<AIAnalysisResponse> => {
    const start = Date.now();
    const result = await runDeterministicAnalysis(input, tracker, options);
    const elapsed = Date.now() - start;

    return {
      riskScore: result.riskScore,
      flags: result.flags,
      explanation: result.explanation,
      financialLossLikely: false, // Always false in degraded mode
      complaintDraft: "",         // Always empty string in degraded mode
      modelId: "deterministic-fallback",
      providerId: "deterministic",
      latencyMs: elapsed,
      isFallback: true,
      isDegraded: true,
      analysisMode: "degraded-deterministic",
      embedding: result.embedding,
    };
  };
}

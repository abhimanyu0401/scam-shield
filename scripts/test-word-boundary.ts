/**
 * scripts/test-word-boundary.ts
 *
 * Permanent regression test suite for Unicode-aware regex word-boundary keyword matching
 * in lib/ai/deterministic-engine.ts.
 */

import { runDeterministicAnalysis, buildWordBoundaryRegex } from "../lib/ai/deterministic-engine";
import { createDeadlineTracker } from "../lib/ai/deadline";
import type { NormalizedInput } from "../lib/ai/types";

async function testWordBoundary(): Promise<void> {
  const englishFpCases = [
    { text: "I am going shopping today at the mall.", pattern: "pin", reason: "Contains 'pin' inside 'shopping'" },
    { text: "In my opinion, this napkin is clean.", pattern: "pin", reason: "Contains 'pin' inside 'opinion' and 'napkin'" },
    { text: "Walking on the embankment near the river.", pattern: "bank", reason: "Contains 'bank' inside 'embankment'" },
    { text: "Hotpot dinner with footpath walk.", pattern: "otp", reason: "Contains 'otp' inside 'hotpot' and 'footpath'" },
    { text: "First confirm the firefly flight.", pattern: "fir", reason: "Contains 'fir' inside 'first', 'confirm', 'firefly'" },
    { text: "Spine surgery appointment scheduled.", pattern: "pin", reason: "Contains 'pin' inside 'spine'" },
  ];

  const hindiFpCases = [
    {
      text: "मैं अगले महीने बैंकॉक की यात्रा पर जा रहा हूँ।",
      pattern: "बैंक",
      reason: "Contains 'बैंक' inside 'बैंकॉक' (Bangkok) with matra combining mark"
    },
    {
      text: "क्रिकेट मैच में स्पिन गेंदबाजी बहुत शानदार थी।",
      pattern: "पिन",
      reason: "Contains 'पिन' inside 'स्पिन' (spin)"
    },
    {
      text: "वह हर मैच में अपना बेहतरीन प्रदर्शन दिखाता है।",
      pattern: "खाता",
      reason: "Contains 'खाता' inside 'दिखाता' (shows)"
    },
    {
      text: "यह एक सुरक्षित और गैर-ओटीपीआई प्रक्रिया है।",
      pattern: "ओटीपी",
      reason: "Contains 'ओटीपी' inside 'ओटीपीआई'"
    },
  ];

  const genuineEnglishCases = [
    { text: "Urgent: please share your PIN immediately.", expectedFlags: ["UPI collect request/PIN demand", "Credential request detected"] },
    { text: "Dear customer, enter OTP to complete verification.", expectedFlags: ["Credential request detected"] },
    { text: "Your bank account has been suspended. Verify immediately.", expectedFlags: ["Urgent bank KYC verification request"] },
    { text: "CBI officer speaking. FIR registered. Do not disconnect. Digital arrest.", expectedFlags: ["Government/law enforcement impersonation"] },
  ];

  const genuineHindiCases = [
    {
      text: "तुरंत अपना बैंक खाता वेरीफाई करें अन्यथा अकाउंट ब्लॉक हो जाएगा।",
      expectedCategory: "BANK_KYC_PHISHING",
      reason: "Genuine Hindi Bank KYC threat (triggers 'खाता' and 'बैंक')"
    },
    {
      text: "रिफंड पाने के लिए अपना यूपीआई पिन दर्ज करें।",
      expectedCategory: "UPI_PAYMENT_FRAUD",
      reason: "Genuine Hindi UPI PIN collect scam (triggers 'पिन' and 'यूपीआई')"
    },
    {
      text: "आपका बिजली बिल अपडेट नहीं है, आज रात कनेक्शन काट दिया जाएगा। तुरंत कॉल करें 9876543210।",
      expectedCategory: "UTILITY_DISCONNECTION",
      reason: "Genuine Hindi utility disconnect threat (triggers 'काट दिया जाएगा' and 'बिजली')"
    },
  ];

  console.log("\n=======================================================");
  console.log("   Testing Regex Word-Boundary Keyword Matching        ");
  console.log("=======================================================\n");

  let totalFpPassed = 0;
  let totalGenuinePassed = 0;

  console.log("--- 1. English Substring False Positives (Should NOT trigger scam flags) ---");
  for (const tc of englishFpCases) {
    const tracker = createDeadlineTracker(5000);
    const input: NormalizedInput = {
      text: tc.text,
      sourceType: "text",
      language: "en",
      languageLabel: "English",
    };
    const result = await runDeterministicAnalysis(input, tracker);
    const hasFlags = result.flags.length > 0;
    const isSafe = result.riskScore < 30 && !hasFlags;

    const regexMatched = buildWordBoundaryRegex(tc.pattern).test(tc.text);

    if (isSafe && !regexMatched) {
      totalFpPassed++;
      console.log(`  ✅ PASS: "${tc.text}"`);
      console.log(`     Pattern: "${tc.pattern}", Matched: ${regexMatched}, Risk Score: ${result.riskScore}, Flags: [] (${tc.reason})`);
    } else {
      console.error(`  ❌ FAIL: "${tc.text}" regexMatched=${regexMatched}, riskScore=${result.riskScore}, flags=${JSON.stringify(result.flags)}`);
    }
  }

  console.log("\n--- 2. Hindi Substring False Positives (Should NOT trigger scam flags) ---");
  for (const tc of hindiFpCases) {
    const tracker = createDeadlineTracker(5000);
    const input: NormalizedInput = {
      text: tc.text,
      sourceType: "text",
      language: "hi",
      languageLabel: "Hindi",
    };
    const result = await runDeterministicAnalysis(input, tracker);
    const hasFlags = result.flags.length > 0;
    const isSafe = result.riskScore < 30 && !hasFlags;

    const regexMatched = buildWordBoundaryRegex(tc.pattern).test(tc.text);

    if (isSafe && !regexMatched) {
      totalFpPassed++;
      console.log(`  ✅ PASS: "${tc.text}"`);
      console.log(`     Pattern: "${tc.pattern}", Matched: ${regexMatched}, Risk Score: ${result.riskScore}, Flags: [] (${tc.reason})`);
    } else {
      console.error(`  ❌ FAIL: "${tc.text}" regexMatched=${regexMatched}, riskScore=${result.riskScore}, flags=${JSON.stringify(result.flags)}`);
    }
  }

  console.log("\n--- 3. Genuine English Keywords (Should correctly trigger scam flags) ---");
  for (const tc of genuineEnglishCases) {
    const tracker = createDeadlineTracker(5000);
    const input: NormalizedInput = {
      text: tc.text,
      sourceType: "text",
      language: "en",
      languageLabel: "English",
    };
    const result = await runDeterministicAnalysis(input, tracker);
    const matchedExpected = tc.expectedFlags.some(expected =>
      result.flags.some(f => f.toLowerCase().includes(expected.toLowerCase()) || expected.toLowerCase().includes(f.toLowerCase()))
    ) || result.riskScore >= 50;

    if (matchedExpected && result.riskScore >= 45) {
      totalGenuinePassed++;
      console.log(`  ✅ PASS: "${tc.text}"`);
      console.log(`     Risk Score: ${result.riskScore}, Flags: ${JSON.stringify(result.flags)}`);
    } else {
      console.error(`  ❌ FAIL: "${tc.text}" failed to trigger expected flags. Got riskScore=${result.riskScore}, flags=${JSON.stringify(result.flags)}`);
    }
  }

  console.log("\n--- 4. Genuine Hindi Keywords (Should correctly trigger scam flags) ---");
  for (const tc of genuineHindiCases) {
    const tracker = createDeadlineTracker(5000);
    const input: NormalizedInput = {
      text: tc.text,
      sourceType: "text",
      language: "hi",
      languageLabel: "Hindi",
    };
    const result = await runDeterministicAnalysis(input, tracker);
    const matchedCategory = result.detectedCategories?.includes(tc.expectedCategory as any);

    if (matchedCategory && result.riskScore >= 55) {
      totalGenuinePassed++;
      console.log(`  ✅ PASS: "${tc.text}"`);
      console.log(`     Risk Score: ${result.riskScore}, Category: ${JSON.stringify(result.detectedCategories)}, Flags: ${JSON.stringify(result.flags)}`);
    } else {
      console.error(`  ❌ FAIL: "${tc.text}" failed to trigger ${tc.expectedCategory}. Got riskScore=${result.riskScore}, categories=${JSON.stringify(result.detectedCategories)}`);
    }
  }

  const totalFpCases = englishFpCases.length + hindiFpCases.length;
  const totalGenuineCases = genuineEnglishCases.length + genuineHindiCases.length;

  console.log("\n=======================================================");
  console.log(`False Positive Substring Tests: ${totalFpPassed}/${totalFpCases} PASSED`);
  console.log(`Genuine Keyword Trigger Tests:   ${totalGenuinePassed}/${totalGenuineCases} PASSED`);
  console.log("=======================================================\n");

  if (totalFpPassed !== totalFpCases || totalGenuinePassed !== totalGenuineCases) {
    process.exit(1);
  }
}

testWordBoundary().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

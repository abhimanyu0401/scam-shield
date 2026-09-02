import type { BenchmarkSample } from "../../../evaluation/types";

export const englishScams: BenchmarkSample[] = [
  // 1. Bank account/KYC
  {
    sampleId: "ENG-SCAM-001",
    label: "scam",
    language: "english",
    domain: "Bank account/KYC",
    message: "Dear HDFC customer, your net banking access will be suspended today due to pending re-KYC. Verify identity immediately at https://hdfc-kyc-portal.net/login",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Urgency", "Suspicious link", "Requests sensitive info"],
    difficulty: "easy",
    notes: "Classic banking KYC phishing with suspension threat and phishing domain."
  },
  {
    sampleId: "ENG-SCAM-002",
    label: "scam",
    language: "english",
    domain: "Bank account/KYC",
    message: "State Bank of India Security Alert: We detected an unrecognised sign-in attempt from IP 185.220.101.4. If this was not you, submit your customer ID and DOB to cancel unauthorized token: sms HELP to +919830219482",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Impersonation", "Requests credentials"],
    difficulty: "medium",
    notes: "Security alert lure directing victim to SMS customer details to a mobile number."
  },
  {
    sampleId: "ENG-SCAM-003",
    label: "scam",
    language: "english",
    domain: "Bank account/KYC",
    message: "ICICI Bank: Important update regarding mandatory RBI mandate compliance. Please update your nominee details and debit card PIN before 24-03-2026 to prevent account freeze.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests PIN", "Threats of account suspension"],
    difficulty: "easy",
    notes: "Asking for debit card PIN under the guise of nominee update."
  },
  {
    sampleId: "ENG-SCAM-004",
    label: "scam",
    language: "english",
    domain: "Bank account/KYC",
    message: "Axis Bank notification: Your saving account requires annual biometric profile synchronization. Download our assisted sync utility APK from http://axis-secure-sync.in to avoid branch visit.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Malware/download lure", "Suspicious link"],
    difficulty: "medium",
    notes: "APK malware lure disguised as biometric sync."
  },

  // 2. UPI/payment fraud
  {
    sampleId: "ENG-SCAM-005",
    label: "scam",
    language: "english",
    domain: "UPI/payment fraud",
    message: "You received Rs. 25,000 from OLX Buyer Rohan. To deposit this amount into your Google Pay, scan the attached QR code and enter your UPI PIN to approve receipt.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests UPI PIN to receive money", "Reverse charge scam"],
    difficulty: "easy",
    notes: "Fundamental UPI reverse charge scam telling user PIN is needed to receive money."
  },
  {
    sampleId: "ENG-SCAM-006",
    label: "scam",
    language: "english",
    domain: "UPI/payment fraud",
    message: "PhonePe Refund Desk: Your failed recharge of Rs 666 has been approved for instant credit. Open UPI app, tap Accept on the pending collect request of Rs 666 from 'PhonePe_Support@upi'.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake refund", "Collect request fraud"],
    difficulty: "medium",
    notes: "Collect request deception pretending to be a refund."
  },

  // 3. Card/payment reversal
  {
    sampleId: "ENG-SCAM-007",
    label: "scam",
    language: "english",
    domain: "Card/payment reversal",
    message: "Alert: Rs 84,999 debited on your Credit Card ending 9012 for Apple Store purchase. If you did not authorize this, call our 24x7 fraud desk at +918239019283 to reverse charges within 15 minutes.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["False transaction alarm", "Fake fraud desk number", "Urgency"],
    difficulty: "medium",
    notes: "Phantom charge panic triggering inbound call to scammer."
  },
  {
    sampleId: "ENG-SCAM-008",
    label: "scam",
    language: "english",
    domain: "Card/payment reversal",
    message: "Credit card annual fee waiver approved for your premium card. To confirm zero-fee lifetime status and reverse Rs 4,999 joining fee, share the 6-digit verification code received on SMS.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests OTP", "Social engineering"],
    difficulty: "medium",
    notes: "OTP phishing under the lure of annual fee waiver reversal."
  },

  // 4. Fake refund
  {
    sampleId: "ENG-SCAM-009",
    label: "scam",
    language: "english",
    domain: "Fake refund",
    message: "IRCTC Customer Support: Your ticket PNR 2849102848 cancellation refund of Rs 1,840 is pending due to IFSC mismatch. Complete bank verification at https://irctc-refund-desk.cc to receive funds.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Phishing link", "Fake refund"],
    difficulty: "easy",
    notes: "Fake IRCTC refund portal."
  },

  // 5. Fake cashback/reward
  {
    sampleId: "ENG-SCAM-010",
    label: "scam",
    language: "english",
    domain: "Fake cashback/reward",
    message: "Congratulations! You have won a festive scratch card worth up to Rs 4,999 on Paytm. Tap to claim directly to bank: https://paytm-scratch-reward.site/claim",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Reward lure", "Suspicious link"],
    difficulty: "easy",
    notes: "Cashback scratch card lure."
  },
  {
    sampleId: "ENG-SCAM-011",
    label: "scam",
    language: "english",
    domain: "Fake cashback/reward",
    message: "Dear customer, your 8,500 reward points worth Rs 4,250 on your credit card are expiring at midnight. Redeem points for cash transfer: https://card-points-redemption.com",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Expiring points lure", "Suspicious domain"],
    difficulty: "medium",
    notes: "Reward points expiration phishing."
  },

  // 6. Lottery/prize
  {
    sampleId: "ENG-SCAM-012",
    label: "scam",
    language: "english",
    domain: "Lottery/prize",
    message: "KBC Sim Card Lucky Draw 2026: Your mobile number has won Rs 25 Lakhs in Kaun Banega Crorepati mega draw! Contact Lottery Manager Rana Pratap on WhatsApp +917849201948 to claim.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Lottery scam", "Advance fee fraud"],
    difficulty: "easy",
    notes: "Famous KBC lottery scam template."
  },

  // 7. Job/task scam
  {
    sampleId: "ENG-SCAM-013",
    label: "scam",
    language: "english",
    domain: "Job/task scam",
    message: "Part-time job offer: Work 1-2 hours daily reviewing YouTube videos and hotels. Earn Rs 2,500 to Rs 8,000 per day. No investment needed. Contact HR manager on Telegram: @hr_priya_recruitment",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Job task scam", "Unrealistic earnings", "Telegram recruiter"],
    difficulty: "easy",
    notes: "Prepaid task scam leading to Telegram investment trap."
  },
  {
    sampleId: "ENG-SCAM-014",
    label: "scam",
    language: "english",
    domain: "Job/task scam",
    message: "Amazon Global Seller rating project: Earn daily commission by boosting product ratings. Initial trial tasks pay Rs 500 immediately. Join official telegram channel https://t.me/amazon_merchant_tasks",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Task scam", "E-commerce impersonation"],
    difficulty: "medium",
    notes: "Merchant review task scam."
  },

  // 8. Investment/crypto scam
  {
    sampleId: "ENG-SCAM-015",
    label: "scam",
    language: "english",
    domain: "Investment/crypto scam",
    message: "Institutional VIP Trading Group: Guaranteed 15% daily returns through AI arbitrage trading. Registered with SEBI & FCA. Join our exclusive WhatsApp wealth circle: https://chat.whatsapp.com/inv/fakeInvestGroup",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Guaranteed returns", "Fake regulator claim", "Investment fraud"],
    difficulty: "medium",
    notes: "High-yield investment fraud claiming impossible guaranteed returns."
  },
  {
    sampleId: "ENG-SCAM-016",
    label: "scam",
    language: "english",
    domain: "Investment/crypto scam",
    message: "Binance Airdrop Alert: 5,000 USDT bonus allocated to your wallet address. Connect decentralized wallet to claim smart contract distribution: https://binance-claim-airdrop.xyz",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Crypto drainer", "Suspicious link"],
    difficulty: "medium",
    notes: "Crypto wallet drainer website."
  },

  // 9. Loan scam
  {
    sampleId: "ENG-SCAM-017",
    label: "scam",
    language: "english",
    domain: "Loan scam",
    message: "Instant Personal Loan of Rs 5,00,000 approved at 1.5% annual interest. Zero CIBIL check required. Pay processing fee of Rs 1,499 to release disbursement within 10 minutes: UPI to fastloan@upi",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Advance fee loan", "Unrealistic terms"],
    difficulty: "easy",
    notes: "Advance processing fee loan scam."
  },

  // 10. Tax/refund scam
  {
    sampleId: "ENG-SCAM-018",
    label: "scam",
    language: "english",
    domain: "Tax/refund scam",
    message: "Income Tax Department: Refund of Rs 24,890 has been approved for assessment year 2025-26. To verify your bank account details for direct credit, click https://incometax-efiling-refund.gov.in.fakedomain.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Tax refund lure", "Subdomain spoofing"],
    difficulty: "hard",
    notes: "Subdomain spoofing mimicking incometax.gov.in."
  },

  // 11. Government impersonation
  {
    sampleId: "ENG-SCAM-019",
    label: "scam",
    language: "english",
    domain: "Government impersonation",
    message: "PM Kisan Yojana Notice: Installment of Rs 6,000 is on hold due to unlinked Aadhaar e-KYC. Complete verification now to receive subsidy: https://pmkisan-ekyc-portal.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Govt subsidy lure", "Fake govt portal"],
    difficulty: "medium",
    notes: "Govt subsidy phishing."
  },

  // 12. Police/legal threat
  {
    sampleId: "ENG-SCAM-020",
    label: "scam",
    language: "english",
    domain: "Police/legal threat",
    message: "Delhi Cyber Crime Cell: A formal criminal complaint (FIR #CY-8902) has been filed against your registered mobile number for distribution of illegal content. Join video interrogation immediately or face warrant: https://delhipolice-cybercell-hearing.com/room",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Legal threat", "Arrest intimidation", "Digital arrest lure"],
    difficulty: "hard",
    notes: "Police cybercell impersonation."
  },

  // 13. Digital arrest scam
  {
    sampleId: "ENG-SCAM-021",
    label: "scam",
    language: "english",
    domain: "Digital arrest scam",
    message: "CBI & Enforcement Directorate Notice: A narcotics package shipped to Malaysia containing 5 passports and contraband is registered under your Aadhaar. You are under 24-hour Digital Arrest. Do not disconnect this call or leave your room.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "Extortion", "Law enforcement impersonation"],
    difficulty: "easy",
    notes: "Classic digital arrest scam script."
  },

  // 14. Aadhaar/PAN/document update
  {
    sampleId: "ENG-SCAM-022",
    label: "scam",
    language: "english",
    domain: "Aadhaar/PAN/document update",
    message: "UIDAI Alert: Your Aadhaar card validity will expire on 31st March 2026. Update document proof online to avoid deactivation fee of Rs 1,000: https://myaadhaar-update-portal.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["False expiration deadline", "Fake UIDAI link"],
    difficulty: "medium",
    notes: "Aadhaar document phishing."
  },
  {
    sampleId: "ENG-SCAM-023",
    label: "scam",
    language: "english",
    domain: "Aadhaar/PAN/document update",
    message: "NSDL Notification: Your PAN card is not linked with your primary bank account. Submit your 10-digit PAN and OTP to prevent IT penalty: http://nsdl-panlink-online.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["PAN linking threat", "Phishing link"],
    difficulty: "easy",
    notes: "PAN card linking phishing."
  },

  // 15. SIM deactivation
  {
    sampleId: "ENG-SCAM-024",
    label: "scam",
    language: "english",
    domain: "SIM deactivation",
    message: "Jio Alert: Dear user your SIM card verification is incomplete. Your outgoing and incoming calls will be stopped within 24 hours. Call telecom executive at +919102938472 to verify.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM deactivation threat", "Urgency"],
    difficulty: "easy",
    notes: "Telecom SIM KYC scam with phone number callout."
  },

  // 16. Mobile recharge fraud
  {
    sampleId: "ENG-SCAM-025",
    label: "scam",
    language: "english",
    domain: "Mobile recharge fraud",
    message: "TRAI 5G Upgrade Offer: Get 1 Year Unlimited 5G Data + Calling recharge free for all networks on occasion of 5G launch anniversary. Activate before midnight: https://free-5g-recharge.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Free recharge lure", "Suspicious link"],
    difficulty: "easy",
    notes: "Free recharge viral bait."
  },

  // 17. Courier/parcel scam
  {
    sampleId: "ENG-SCAM-026",
    label: "scam",
    language: "english",
    domain: "Courier/parcel scam",
    message: "FedEx Express: Package tracking #FDX891048 could not be delivered due to incomplete street address. Pay re-delivery fee of Rs 35 to schedule delivery: https://fedex-redelivery-india.top/pay",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Courier fee lure", "Phishing link"],
    difficulty: "medium",
    notes: "Address update and small card payment capture lure."
  },
  {
    sampleId: "ENG-SCAM-027",
    label: "scam",
    language: "english",
    domain: "Courier/parcel scam",
    message: "India Post Alert: Your article #IN89201948IN has been detained at regional distribution center. Update postal code and confirm identity within 48 hours: https://indiapost-parcel-verify.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["India Post phishing", "Suspicious TLD"],
    difficulty: "medium",
    notes: "India Post parcel detention phishing."
  },

  // 18. Delivery rescheduling scam
  {
    sampleId: "ENG-SCAM-028",
    label: "scam",
    language: "english",
    domain: "Delivery rescheduling scam",
    message: "BlueDart Notice: Delivery driver was unable to reach your phone for parcel #BD892018. Reschedule preferred time slot: http://bluedart-reschedule.info",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Delivery rescheduling", "Phishing link"],
    difficulty: "medium",
    notes: "Delivery rescheduling phishing."
  },

  // 19. E-commerce order scam
  {
    sampleId: "ENG-SCAM-029",
    label: "scam",
    language: "english",
    domain: "E-commerce order scam",
    message: "Flipkart Big Billion Days Winner: Your mobile number has been selected for iPhone 16 Pro at 90% discount (Rs 9,999). Only 2 units remaining in stock. Order now: https://flipkart-festive-deals.store",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic discount", "Fake store", "Urgency"],
    difficulty: "easy",
    notes: "Fake e-commerce deal."
  },

  // 20. Fake customer support
  {
    sampleId: "ENG-SCAM-030",
    label: "scam",
    language: "english",
    domain: "Fake customer support",
    message: "Swiggy Support: We noticed you had an issue with your recent food order. To credit full compensation of Rs 850 directly to your GPay, install AnyDesk app and share 9 digit code with executive.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Remote access tool", "Fake customer support"],
    difficulty: "medium",
    notes: "Remote screen sharing application scam (AnyDesk)."
  },

  // 21. Social media account suspension
  {
    sampleId: "ENG-SCAM-031",
    label: "scam",
    language: "english",
    domain: "Social media account suspension",
    message: "Instagram Copyright Infringement: A post on your profile violates Meta copyright policies. If you believe this is a mistake, appeal within 24 hours or your profile will be permanently deleted: https://meta-appeal-case892.com",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account suspension threat", "Fake appeal portal"],
    difficulty: "medium",
    notes: "Instagram copyright appeal phishing."
  },

  // 22. WhatsApp/Telegram account takeover
  {
    sampleId: "ENG-SCAM-032",
    label: "scam",
    language: "english",
    domain: "WhatsApp/Telegram account takeover",
    message: "WhatsApp Security Team: We detected unusual login attempts on your number. To verify ownership and prevent deletion, reply with the 6-digit registration code you receive via SMS right now.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account takeover", "Requests registration code"],
    difficulty: "hard",
    notes: "WhatsApp registration code theft."
  },

  // 23. Email/security alert phishing
  {
    sampleId: "ENG-SCAM-033",
    label: "scam",
    language: "english",
    domain: "Email/security alert phishing",
    message: "Microsoft 365 Administrator: Your mailbox storage has reached 99.8% capacity. 14 incoming messages have been quarantined. Validate mailbox credentials to restore delivery: https://outlook-owa-validate.net/auth",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Mailbox quota lure", "Phishing link"],
    difficulty: "hard",
    notes: "Office 365 credential harvester."
  },

  // 24. Password reset phishing
  {
    sampleId: "ENG-SCAM-034",
    label: "scam",
    language: "english",
    domain: "Password reset phishing",
    message: "Google Account Alert: A password reset request was initiated from Moscow, Russia. If you did not make this request, secure your account immediately: https://myaccount-google-security.cc/reset",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Panic inducing security alert", "Fake Google domain"],
    difficulty: "hard",
    notes: "Google account password reset phishing."
  },

  // 25. Fake subscription renewal
  {
    sampleId: "ENG-SCAM-035",
    label: "scam",
    language: "english",
    domain: "Fake subscription renewal",
    message: "Geek Squad Invoice #GS-89104: Thank you for renewing your Total Tech Support 3-year plan for $499.00. Payment auto-debited. If you wish to cancel and request refund, call toll free +1-888-921-9482",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake invoice", "Refund scam call lure"],
    difficulty: "medium",
    notes: "Classic Geek Squad invoice refund scam."
  },
  {
    sampleId: "ENG-SCAM-036",
    label: "scam",
    language: "english",
    domain: "Fake subscription renewal",
    message: "Netflix Billing Issue: We were unable to process your monthly subscription payment. Your membership is suspended. Update payment method: https://netflix-update-billing.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Subscription suspension", "Phishing link"],
    difficulty: "medium",
    notes: "Netflix payment detail phishing."
  },

  // 26. Electricity/gas bill scam
  {
    sampleId: "ENG-SCAM-037",
    label: "scam",
    language: "english",
    domain: "Electricity/gas bill scam",
    message: "Dear Consumer, your electricity power connection will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer at 9830291847.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Utility disconnection threat", "Direct officer phone number", "Urgency"],
    difficulty: "easy",
    notes: "Standard electricity disconnection threat."
  },
  {
    sampleId: "ENG-SCAM-038",
    label: "scam",
    language: "english",
    domain: "Electricity/gas bill scam",
    message: "Mahanagar Gas Ltd: Urgent reminder regarding mandatory smart gas meter inspection. Pay pending inspection fee of Rs 150 to avoid gas pipeline cutoff: contact billing officer +919748291039",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Gas cutoff threat", "Officer contact number"],
    difficulty: "medium",
    notes: "Gas utility disconnection threat."
  },

  // 27. Insurance scam
  {
    sampleId: "ENG-SCAM-039",
    label: "scam",
    language: "english",
    domain: "Insurance scam",
    message: "IRDAI Maturity Settlement: Your lapsed insurance policy #POL892019 has an unclaimed bonus of Rs 3,45,000. To release settlement funds to your bank account, deposit mandatory GST processing fee of Rs 12,500.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Advance fee fraud", "Insurance bonus lure", "Regulator impersonation"],
    difficulty: "medium",
    notes: "Insurance policy bonus release fraud."
  },

  // 28. Fake employment offer
  {
    sampleId: "ENG-SCAM-040",
    label: "scam",
    language: "english",
    domain: "Fake employment offer",
    message: "TCS Off-Campus Recruitment 2026: You have been selected for System Engineer role (CTC 9.5 LPA). Download your appointment letter and pay mandatory laptop security deposit Rs 3,500: https://tcs-careers-onboarding.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Job onboarding fee", "Fake corporate portal"],
    difficulty: "medium",
    notes: "IT company onboarding deposit scam."
  },

  // 29. Scholarship/education scam
  {
    sampleId: "ENG-SCAM-041",
    label: "scam",
    language: "english",
    domain: "Scholarship/education scam",
    message: "National Higher Education Council: You are awarded Rs 75,000 national merit scholarship for academic excellence. Claim funds by submitting student ID and paying verification fee Rs 499: https://scholarship-gov-claim.net",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Scholarship advance fee", "Fake education portal"],
    difficulty: "medium",
    notes: "Scholarship claim advance fee fraud."
  },

  // 30. Charity/donation scam
  {
    sampleId: "ENG-SCAM-042",
    label: "scam",
    language: "english",
    domain: "Charity/donation scam",
    message: "Emergency Appeal: 4-year-old Aarav is fighting acute leukemia and needs urgent bone marrow transplant within 48 hours. Please donate whatever you can to personal UPI: helpchild89@okaxis to save his life.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Emotional appeal", "Personal UPI donation", "Urgency"],
    difficulty: "hard",
    notes: "Fake medical charity appeal using personal UPI handle."
  },

  // 31. Romance/social-engineering scam
  {
    sampleId: "ENG-SCAM-043",
    label: "scam",
    language: "english",
    domain: "Romance/social-engineering scam",
    message: "My dear, I have landed at Delhi International Airport with your gold jewelry and $50,000 cash gift parcel, but customs officer Mr. Sharma has detained me. Please transfer Rs 45,000 customs clearance fee immediately so I can be released.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Airport customs gift scam", "Advance fee extortion"],
    difficulty: "medium",
    notes: "Classic overseas lover airport customs detention fraud."
  },

  // 32. QR-code/payment-request scam
  {
    sampleId: "ENG-SCAM-044",
    label: "scam",
    language: "english",
    domain: "QR-code/payment-request scam",
    message: "To receive the security refund of Rs 15,000 for your flat deposit, scan this dynamic payment QR code on PhonePe and enter your secret 4-digit code.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["QR code scam", "Requests PIN to receive money"],
    difficulty: "easy",
    notes: "QR code refund fraud asking for PIN."
  },

  // 33. Remote-access/support scam
  {
    sampleId: "ENG-SCAM-045",
    label: "scam",
    language: "english",
    domain: "Remote-access/support scam",
    message: "Windows Defender Critical Alert: Trojan Spyware detected on your computer accessing your banking passwords. Call Microsoft Certified Senior Engineer immediately at 1800-891-2094 to clean infected files.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Tech support scam", "Fake virus alert"],
    difficulty: "easy",
    notes: "Tech support pop-up telephone lure."
  },

  // 34. Malware/download lure
  {
    sampleId: "ENG-SCAM-046",
    label: "scam",
    language: "english",
    domain: "Malware/download lure",
    message: "SBI YONO App Update Required: Your current mobile banking app will stop working tomorrow due to critical security upgrades. Download the official YONO_Security_Patch.apk here: https://yono-sbi-update.cc/app",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Malware APK lure", "Banking app update phishing"],
    difficulty: "medium",
    notes: "Banking Trojan APK download lure."
  },

  // 35. SIM/KYC re-verification
  {
    sampleId: "ENG-SCAM-047",
    label: "scam",
    language: "english",
    domain: "SIM/KYC re-verification",
    message: "Airtel Telecommunications: Department of Telecom has mandated re-verification of all prepaid numbers. Send SMS 'SIMREQ <20-digit-sim-number>' to 121 within 2 hours or your connection will be disconnected.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM swap attack", "Urgency"],
    difficulty: "hard",
    notes: "SIM swap attack instruction."
  },

  // 36. Fake bank representative
  {
    sampleId: "ENG-SCAM-048",
    label: "scam",
    language: "english",
    domain: "Fake bank representative",
    message: "Hello sir, this is Senior Manager Ankit Verma from Kotak Mahindra Bank Credit Department. We are upgrading your credit limit to Rs 5,00,000 with zero charges. Kindly confirm your card CVV and expiry date on this call to process approval.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests CVV", "Limit upgrade lure", "Bank impersonation"],
    difficulty: "easy",
    notes: "Credit card CVV harvesting via phone conversation."
  },

  // 37. Fake government benefit/subsidy
  {
    sampleId: "ENG-SCAM-049",
    label: "scam",
    language: "english",
    domain: "Fake government benefit/subsidy",
    message: "Ministry of Petroleum & Natural Gas: PM Ujjwala 2.0 beneficiary cash subsidy of Rs 2,200 is credited to your DBT account. Verify bank seeding status: http://pm-ujjwala-subsidy.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake subsidy", "Phishing link"],
    difficulty: "medium",
    notes: "Government energy subsidy phishing."
  },

  // 38. Fake traffic challan/fine
  {
    sampleId: "ENG-SCAM-050",
    label: "scam",
    language: "english",
    domain: "Fake traffic challan/fine",
    message: "e-Challan Notice: Vehicle MH02AB1234 has a pending speed violation fine of Rs 1,000 recorded on Western Express Highway. Pay fine within 24 hours to avoid court summons: https://echallan-parivahan-gov.in.onlinepay.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Traffic challan threat", "Subdomain spoofing"],
    difficulty: "hard",
    notes: "Traffic fine scam with legal escalation threat."
  },

  // 39. Fake immigration/visa message
  {
    sampleId: "ENG-SCAM-051",
    label: "scam",
    language: "english",
    domain: "Fake immigration/visa message",
    message: "Canada Immigration & Visa Bureau: Your Express Entry Work Permit Application #CAN-89201 has been selected. Transfer embassy biometric stamping fee of $280 to our authorized visa agent to receive passport dispatch.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Visa fee fraud", "Immigration impersonation"],
    difficulty: "medium",
    notes: "Immigration work permit advance fee scam."
  },

  // 40. Generic credential phishing
  {
    sampleId: "ENG-SCAM-052",
    label: "scam",
    language: "english",
    domain: "Generic credential phishing",
    message: "Security Notice: Your session on this device has expired. Re-authenticate your username and master password to maintain continuous cloud sync: http://auth-cloud-session.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Credential harvester", "Suspicious link"],
    difficulty: "medium",
    notes: "Generic single sign-on credential phishing."
  },

  // Additional varied English scams (sophisticated, subtle, no-URL, poor grammar, etc.)
  {
    sampleId: "ENG-SCAM-053",
    label: "scam",
    language: "english",
    domain: "Job/task scam",
    message: "Dear Sir/Madam, Greetings from HR Global. We have flexible remote openings for data annotation. Daily payout Rs 3500 via IMPS. Please connect on WhatsApp 9819203819 for immediate onboarding.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["High daily payout", "WhatsApp recruitment"],
    difficulty: "medium",
    notes: "Recruitment lead without links, phone number based."
  },
  {
    sampleId: "ENG-SCAM-054",
    label: "scam",
    language: "english",
    domain: "Bank account/KYC",
    message: "Dear Valued Customer, this is an automated communication from Union Bank. Unusual international debit of 450.00 USD was attempted at 03:14 AM. If unauthorized, forward this message along with your registered debit card number to our escalation desk at 9182390192.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests card number", "Panic trigger"],
    difficulty: "medium",
    notes: "SMS forwarding credential harvesting."
  },
  {
    sampleId: "ENG-SCAM-055",
    label: "scam",
    language: "english",
    domain: "Police/legal threat",
    message: "High Court of Bombay e-Committee: Legal notice has been served against you regarding cheque bounce case #CB-48902. Failure to settle dispute by 5:00 PM today will lead to non-bailable warrant. Contact plaintiff counsel Adv. K. Singhal at 9840192837.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Legal warrant threat", "Urgency"],
    difficulty: "hard",
    notes: "Fake legal notice with attorney contact number."
  },
  {
    sampleId: "ENG-SCAM-056",
    label: "scam",
    language: "english",
    domain: "Fake refund",
    message: "LPG Gas Subsidy: Dear customer your bank account linking failed for LPG rebate of Rs 450. Send Rs 1 to UPI id lpgrebate@okaxis to re-verify your bank account and receive pending subsidy.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["UPI micro-transaction lure", "Subsidy phishing"],
    difficulty: "medium",
    notes: "1 rupee penny-drop trick used to capture UPI account details."
  },
  {
    sampleId: "ENG-SCAM-057",
    label: "scam",
    language: "english",
    domain: "E-commerce order scam",
    message: "Order Cancelled: Your Amazon order #402-9820194 for Sony Bravia 55' TV has been cancelled due to payment failure. To restore order at discounted price, pay balance using direct UPI link: https://amzn-pay-checkout.link",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake cancellation", "Suspicious link"],
    difficulty: "medium",
    notes: "High value order cancellation scam."
  },
  {
    sampleId: "ENG-SCAM-058",
    label: "scam",
    language: "english",
    domain: "Loan scam",
    message: "Pre-approved business overdraft of Rs 25,00,000 ready for immediate withdrawal under MSME Emergency Credit Scheme. No collateral or financial statements needed. Call credit officer at +919876543210 to activate limit today.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic loan approval", "Unverified phone number"],
    difficulty: "medium",
    notes: "Collateral-free massive loan lure."
  },
  {
    sampleId: "ENG-SCAM-059",
    label: "scam",
    language: "english",
    domain: "WhatsApp/Telegram account takeover",
    message: "Hi mom, I lost my phone and broke my SIM card. This is my temporary WhatsApp number. I have an urgent bill to pay for college fees today. Can you please transfer Rs 18,000 to my friend's UPI: rahulcollege89@paytm?",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Impersonation of family member", "Urgent money request"],
    difficulty: "hard",
    notes: "'Hi Mom' family emergency impersonation."
  },
  {
    sampleId: "ENG-SCAM-060",
    label: "scam",
    language: "english",
    domain: "Investment/crypto scam",
    message: "Exclusive Pre-IPO allocation: Zerodha & Groww joint syndicate offers retail investors early access to Tata Motors EV IPO at 40% discount before public listing. Register allocation slot: https://preipo-allocation-syndicate.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake IPO allocation", "Broker impersonation"],
    difficulty: "hard",
    notes: "Pre-IPO share allocation fraud."
  },
  {
    sampleId: "ENG-SCAM-061",
    label: "scam",
    language: "english",
    domain: "Aadhaar/PAN/document update",
    message: "Dear customer, your bank KYC is pending due to expired PAN card verification. Kindly click here http://bit.ly/3kYcUpdateNow to update.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Shortened URL", "Generic KYC threat"],
    difficulty: "easy",
    notes: "Shortened URL KYC scam."
  },
  {
    sampleId: "ENG-SCAM-062",
    label: "scam",
    language: "english",
    domain: "Courier/parcel scam",
    message: "DHL Express: Your international parcel from UK has arrived with customs duty due of Rs 2,450. Transfer duty via Google Pay to DHL clearance agent at 9840291840 to prevent return to sender.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Customs duty payment to personal number", "Urgency"],
    difficulty: "medium",
    notes: "Courier customs duty scam to personal phone."
  },
  {
    sampleId: "ENG-SCAM-063",
    label: "scam",
    language: "english",
    domain: "Electricity/gas bill scam",
    message: "Electricity bill alert: Bill unpaid Rs 1250. Power cutoff in 1 hour. Call 9823019283 immediately.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Extreme urgency", "Power cutoff threat"],
    difficulty: "easy",
    notes: "Short urgency-based electricity threat."
  },
  {
    sampleId: "ENG-SCAM-064",
    label: "scam",
    language: "english",
    domain: "Card/payment reversal",
    message: "Dear SBI user, your reward point balance of 9,840 (Value: Rs 4,920) will lapse tonight. Convert points to cash in savings account: https://sbi-rewards-redemption.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Reward points", "Phishing URL"],
    difficulty: "easy",
    notes: "SBI reward points cash redemption."
  },
  {
    sampleId: "ENG-SCAM-065",
    label: "scam",
    language: "english",
    domain: "Fake customer support",
    message: "Meta Verified Support: Your Facebook page has been flagged for violating community standards. Request a review from our compliance specialist on WhatsApp: https://wa.me/919830219482?text=ReviewMyPage",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["WhatsApp direct redirect", "Page suspension threat"],
    difficulty: "medium",
    notes: "Meta support social media phishing via WhatsApp link."
  },
  {
    sampleId: "ENG-SCAM-066",
    label: "scam",
    language: "english",
    domain: "Digital arrest scam",
    message: "Telecom Regulatory Authority of India (TRAI): 17 illegal credit cards and money laundering activities have been registered under your national ID. Mumbai Police Crime Branch has issued arrest orders. Join video room to record statement: https://mumbaipolice-virtual-investigation.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "Money laundering accusation", "Fake video portal"],
    difficulty: "hard",
    notes: "Sophisticated digital arrest video lure."
  },
  {
    sampleId: "ENG-SCAM-067",
    label: "scam",
    language: "english",
    domain: "Job/task scam",
    message: "Hotel booking evaluation team: Earn 500 Rs per review on Google Maps. We provide daily compensation via UPI. Message our project leader on Telegram: @google_review_lead",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Google review task", "Telegram handle"],
    difficulty: "easy",
    notes: "Google maps review task fraud."
  },
  {
    sampleId: "ENG-SCAM-068",
    label: "scam",
    language: "english",
    domain: "Lottery/prize",
    message: "Congratulations! You have been selected as the 2nd prize winner of a brand new Hyundai Creta in Naaptol 15th Anniversary Mega Draw. Call 08920192834 to book delivery.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Car prize", "Fake shopping draw"],
    difficulty: "easy",
    notes: "Naaptol car lottery scam."
  },
  {
    sampleId: "ENG-SCAM-069",
    label: "scam",
    language: "english",
    domain: "Generic credential phishing",
    message: "IT Security Alert: Several unauthorized sign-ins from unknown devices detected on your company portal. Reset your enterprise SSO password right away: http://sso-portal-security-check.com",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Enterprise SSO phishing", "Suspicious link"],
    difficulty: "hard",
    notes: "Corporate SSO password theft."
  },
  {
    sampleId: "ENG-SCAM-070",
    label: "scam",
    language: "english",
    domain: "Bank account/KYC",
    message: "Kotak 811 Account: Your digital savings account has exceeded debit limit threshold. Submit Aadhaar number and OTP to authenticate account continuation: https://kotak811-kyc-verify.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital bank phishing", "Requests Aadhaar and OTP"],
    difficulty: "medium",
    notes: "Kotak 811 phishing."
  },
  {
    sampleId: "ENG-SCAM-071",
    label: "scam",
    language: "english",
    domain: "Fake traffic challan/fine",
    message: "Traffic Police Department: Pending speeding challan of Rs 2,000 on car registered to this mobile. Pay immediately to avoid driving license suspension: https://m-parivahan-challan-pay.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Challan threat", "License suspension"],
    difficulty: "medium",
    notes: "Speeding challan scam with top-level domain spoof."
  },
  {
    sampleId: "ENG-SCAM-072",
    label: "scam",
    language: "english",
    domain: "UPI/payment fraud",
    message: "Dear merchant, your QR payment settlement of Rs 14,200 is on hold. To release pending merchant payout, open PhonePe, scan QR from customer support and enter PIN.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Merchant settlement fraud", "Requests UPI PIN"],
    difficulty: "medium",
    notes: "Merchant settlement fraud asking for PIN."
  },
  {
    sampleId: "ENG-SCAM-073",
    label: "scam",
    language: "english",
    domain: "Fake subscription renewal",
    message: "Amazon Prime: Your annual membership auto-renewed for Rs 1,499. If you did not authorize this, call our customer assistance desk at +918920194820 immediately for full refund.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Subscription refund lure", "Direct phone number"],
    difficulty: "medium",
    notes: "Amazon Prime refund inbound call scam."
  },
  {
    sampleId: "ENG-SCAM-074",
    label: "scam",
    language: "english",
    domain: "Loan scam",
    message: "Dhani Finance: Pre-approved business loan of Rs 10 Lakh disbursed to your digital wallet. To withdraw funds to bank account, deposit insurance coverage fee of Rs 4,999 to UPI dhani-disburse@upi",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Loan insurance fee", "Advance payment"],
    difficulty: "easy",
    notes: "Loan insurance advance fee scam."
  },
  {
    sampleId: "ENG-SCAM-075",
    label: "scam",
    language: "english",
    domain: "SIM deactivation",
    message: "BSNL Notice: Your BSNL 4G SIM will be deactivated today at 6 PM due to 3G sunset and missing KYC documentation. Call nodal officer Mr. Rajesh at 9439201928 for immediate re-activation.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM deactivation", "Officer mobile number"],
    difficulty: "easy",
    notes: "BSNL SIM deactivation scam."
  },
  {
    sampleId: "ENG-SCAM-076",
    label: "scam",
    language: "english",
    domain: "Remote-access/support scam",
    message: "SBI Quick Support: To resolve your pending UPI transaction dispute, our technical representative will assist you via screen share. Download TeamViewer QuickSupport and provide connection ID.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Screen share app", "Bank dispute support impersonation"],
    difficulty: "medium",
    notes: "TeamViewer screen share banking fraud."
  },
  {
    sampleId: "ENG-SCAM-077",
    label: "scam",
    language: "english",
    domain: "Investment/crypto scam",
    message: "Crypto Mining Pool: Earn passive income of 0.05 BTC weekly by renting cloud hash power. Zero technical knowledge required. Sign up and claim 50 TH/s bonus: https://cloud-mining-btc-pool.xyz",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic crypto returns", "Cloud mining scam"],
    difficulty: "medium",
    notes: "Cloud mining Ponzi scheme."
  },
  {
    sampleId: "ENG-SCAM-078",
    label: "scam",
    language: "english",
    domain: "Social media account suspension",
    message: "X (Twitter) Support: Your verified badge is pending revocation due to spam reports. Verify your identity and ownership within 12 hours: https://twitter-verify-badge.co",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Verification badge revocation", "Phishing link"],
    difficulty: "medium",
    notes: "X/Twitter verification badge phishing."
  },
  {
    sampleId: "ENG-SCAM-079",
    label: "scam",
    language: "english",
    domain: "Fake government benefit/subsidy",
    message: "Free Laptop Scheme 2026: Government is distributing free laptops to all 10th and 12th pass students. Apply online before application portal closes on Sunday: http://freelaptop-gov-scheme.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Free laptop lure", "Fake government scheme"],
    difficulty: "easy",
    notes: "Free laptop viral phishing."
  },
  {
    sampleId: "ENG-SCAM-080",
    label: "scam",
    language: "english",
    domain: "Courier/parcel scam",
    message: "Customs Clearance Notice: A parcel addressed to your name containing restricted electronic equipment is held at Mumbai Air Cargo. Pay import duty penalty of Rs 8,500 to clearing agent via UPI to avoid legal action.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Customs penalty", "Threat of legal action", "UPI payment"],
    difficulty: "hard",
    notes: "Customs detention and legal penalty extortion."
  }
];

export const englishLegitimate: BenchmarkSample[] = [
  // 1. Bank transaction confirmations
  {
    sampleId: "ENG-LEGIT-001",
    label: "legitimate",
    language: "english",
    domain: "Bank transaction confirmations",
    message: "Dear Customer, INR 2,450.00 debited from A/C XX4821 on 24-FEB-26 at RELIANCE RETAIL MUMBAI. Avail Bal: INR 34,920.10. Call 18002586161 if not done by you.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Standard bank transaction SMS with masked account and official toll-free number."
  },
  {
    sampleId: "ENG-LEGIT-002",
    label: "legitimate",
    language: "english",
    domain: "Bank transaction confirmations",
    message: "Your HDFC Bank Credit Card ending in 1049 was used for INR 899.00 at SWIGGY on 24-02-2026 20:14:02. Available Limit: INR 1,45,000.00. SMS BLOCK 1049 to 5676712 if not you.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Legitimate credit card transaction alert."
  },

  // 2. UPI payment confirmations
  {
    sampleId: "ENG-LEGIT-003",
    label: "legitimate",
    language: "english",
    domain: "UPI payment confirmations",
    message: "Paid INR 350.00 successfully to STARBUCKS COFFEE from your State Bank of India account XX8901 via Google Pay. UPI Ref No 604928194021.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Genuine Google Pay payment confirmation."
  },
  {
    sampleId: "ENG-LEGIT-004",
    label: "legitimate",
    language: "english",
    domain: "UPI payment confirmations",
    message: "PhonePe Alert: Money received! Rs 5,000.00 credited to your ICICI Bank account XX9201 from PRIYA VERMA. UPI Ref: 605920194820.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "PhonePe credit notification."
  },

  // 3. Card transaction notifications
  {
    sampleId: "ENG-LEGIT-005",
    label: "legitimate",
    language: "english",
    domain: "Card transaction notifications",
    message: "Alert: International transaction of USD 14.99 at SPOTIFY USA authorized on your Axis Bank Debit Card XX3902 on 24-Feb-2026. If unauthorized, block card in Axis Mobile App.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "International transaction notice with in-app blocking guidance."
  },

  // 4. Salary/credit notifications
  {
    sampleId: "ENG-LEGIT-006",
    label: "legitimate",
    language: "english",
    domain: "Salary/credit notifications",
    message: "Dear Customer, your salary for February 2026 of INR 84,500.00 has been credited to your HDFC Bank A/C XX4920 by INFOSYS LIMITED via NACH. Net balance: INR 1,12,400.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Corporate salary NACH credit."
  },

  // 5. Legitimate refunds
  {
    sampleId: "ENG-LEGIT-007",
    label: "legitimate",
    language: "english",
    domain: "Legitimate refunds",
    message: "Refund of Rs 1,499.00 for returned item on order #402-8920194-291048 has been processed to your original payment method (HDFC Credit Card XX1029). It will reflect in 2-4 business days.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Authentic Amazon return refund notification."
  },

  // 6. Genuine order confirmations
  {
    sampleId: "ENG-LEGIT-008",
    label: "legitimate",
    language: "english",
    domain: "Genuine order confirmations",
    message: "Thank you for shopping at Flipkart! Your order #OD8920194820 for 'Boat Rockerz 450 Headphone' has been placed. Expected delivery: Friday, 27th February. Track order in Flipkart app.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Standard e-commerce order confirmation."
  },

  // 7. Delivery updates
  {
    sampleId: "ENG-LEGIT-009",
    label: "legitimate",
    language: "english",
    domain: "Delivery updates",
    message: "Your Amazon package with tracking #AMZN9820194 is out for delivery today by agent Ramesh. Share delivery code 4829 with the agent only at the time of receiving the package.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Amazon OTP delivery notice explaining when to share OTP safely."
  },
  {
    sampleId: "ENG-LEGIT-010",
    label: "legitimate",
    language: "english",
    domain: "Delivery updates",
    message: "BlueDart Waybill #492019482 is delivered and received by SECURITY at 14:32 hrs on 24-Feb-2026. Thank you for choosing BlueDart.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Delivery completion notice."
  },

  // 8. Train/flight confirmations
  {
    sampleId: "ENG-LEGIT-011",
    label: "legitimate",
    language: "english",
    domain: "Train/flight confirmations",
    message: "IRCTC PNR: 2849102848, Train: 12952 / MUMBAI RAJDHANI, Date: 28-Feb-2026, Class: 3A, Coach: B4, Berth: 42 (Side Lower). Departure NDLS: 16:55. Wish you a happy journey.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official IRCTC reservation ticket confirmation."
  },
  {
    sampleId: "ENG-LEGIT-012",
    label: "legitimate",
    language: "english",
    domain: "Train/flight confirmations",
    message: "IndiGo Booking Confirmed! PNR: 6E-KL892. Flight 6E 534 from Mumbai (BOM) to Bengaluru (BLR) on 01 Mar 2026. Dep: 08:30 AM, Arr: 10:15 AM. Web check-in opens 48 hrs prior at goindigo.in.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "IndiGo flight booking confirmation."
  },

  // 9. Hotel reservations
  {
    sampleId: "ENG-LEGIT-013",
    label: "legitimate",
    language: "english",
    domain: "Hotel reservations",
    message: "MakeMyTrip: Your booking at Taj Lands End Mumbai is confirmed. Check-in: 05 Mar 2026 (2:00 PM), Check-out: 07 Mar 2026 (12:00 PM). Booking ID: MMT8920194. Present photo ID at reception.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Legitimate hotel reservation details."
  },

  // 10. Restaurant orders
  {
    sampleId: "ENG-LEGIT-014",
    label: "legitimate",
    language: "english",
    domain: "Restaurant orders",
    message: "Zomato: Your order from 'Bawarchi Biryani' has been picked up by delivery partner Amit. Arriving in approximately 18 mins. View live route in Zomato app.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Zomato order delivery tracker."
  },

  // 11. Electricity bills
  {
    sampleId: "ENG-LEGIT-015",
    label: "legitimate",
    language: "english",
    domain: "Electricity bills",
    message: "Tata Power-DDL: Bill for CA 60019284729 for month FEB-2026 is Rs 2,840.00. Due date is 08-Mar-2026. Pay via official mobile app or visit tatapower-ddl.com.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official utility bill notice with official domain."
  },

  // 12. Mobile recharge confirmations
  {
    sampleId: "ENG-LEGIT-016",
    label: "legitimate",
    language: "english",
    domain: "Mobile recharge confirmations",
    message: "Jio Recharge Successful! Plan Rs 749 activated on 9820194820. Benefits: 2GB/day + Unlimited 5G Data + Unlimited Calls for 84 days. Validity till 18-May-2026.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Jio recharge success confirmation."
  },

  // 13. Insurance reminders
  {
    sampleId: "ENG-LEGIT-017",
    label: "legitimate",
    language: "english",
    domain: "Insurance reminders",
    message: "HDFC Life: Premium of INR 24,000.00 for Click 2 Protect Life Policy #19820194 is due on 15-Mar-2026. Download premium receipt or pay via Customer Portal at hdfclife.com.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Standard insurance premium due reminder."
  },

  // 14. Subscription renewal notices
  {
    sampleId: "ENG-LEGIT-018",
    label: "legitimate",
    language: "english",
    domain: "Subscription renewal notices",
    message: "Google One: Your 100 GB storage plan (INR 130/month) will renew automatically on 02 Mar 2026 using your Mastercard ending in 8920. Manage subscriptions at one.google.com.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Genuine Google One renewal alert."
  },

  // 15. Appointment confirmations
  {
    sampleId: "ENG-LEGIT-019",
    label: "legitimate",
    language: "english",
    domain: "Appointment confirmations",
    message: "Apollo Hospitals: Your consultation with Dr. Sanjay Gupta (Cardiology) is confirmed for 26-Feb-2026 at 11:30 AM, Apollo Clinic Indiranagar. Please arrive 15 mins early.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Hospital doctor appointment booking."
  },

  // 16. University/college notifications
  {
    sampleId: "ENG-LEGIT-020",
    label: "legitimate",
    language: "english",
    domain: "University/college notifications",
    message: "IIT Bombay Academic Office: End-semester examination schedule for Spring 2026 has been published on the student portal. Hall tickets can be downloaded starting 10th March from asc.iitb.ac.in.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official university academic notice."
  },

  // 17. Workplace notifications
  {
    sampleId: "ENG-LEGIT-021",
    label: "legitimate",
    language: "english",
    domain: "Workplace notifications",
    message: "Workday Alert: Your annual performance appraisal form has been initiated by your manager. Please complete your self-evaluation before the deadline of Friday, 6th March 2026.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Corporate HR Workday appraisal task notification."
  },

  // 18. Government informational messages
  {
    sampleId: "ENG-LEGIT-022",
    label: "legitimate",
    language: "english",
    domain: "Government informational messages",
    message: "Election Commission of India: Check your polling station and voter details for upcoming municipal elections at voters.eci.gov.in or call toll-free Voter Helpline 1950.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official election commission information with official gov.in domain."
  },

  // 19. Tax acknowledgements
  {
    sampleId: "ENG-LEGIT-023",
    label: "legitimate",
    language: "english",
    domain: "Tax acknowledgements",
    message: "Income Tax Department: ITR-1 filed for PAN XXXXX1029F for Assessment Year 2025-26 has been successfully e-verified via Aadhaar OTP on 24-Feb-2026. Acknowledgement #28491028482.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Legitimate e-filing acknowledgement containing keywords like PAN and OTP."
  },

  // 20. Account security notifications
  {
    sampleId: "ENG-LEGIT-024",
    label: "legitimate",
    language: "english",
    domain: "Account security notifications",
    message: "Google Security Alert: A new sign-in was detected on Chrome on Windows (IP: 14.139.128.5, Delhi, India). If this was you, you don't need to do anything. If not, check your account activity at myaccount.google.com/notifications.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Authentic Google sign-in notification with official domain."
  },

  // 21. Password-change confirmations
  {
    sampleId: "ENG-LEGIT-025",
    label: "legitimate",
    language: "english",
    domain: "Password-change confirmations",
    message: "Apple Account Notice: Your Apple ID password was changed on 24 February 2026 at 18:32 IST. If you made this change, disregard this message. If not, visit iforgot.apple.com to protect your account.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Genuine Apple ID password change alert with official iforgot.apple.com."
  },

  // 22. Login notifications (2FA / OTP)
  {
    sampleId: "ENG-LEGIT-026",
    label: "legitimate",
    language: "english",
    domain: "Login notifications",
    message: "892014 is your verification code for Netflix login. This code is valid for 10 minutes. For security reasons, do not share this OTP with anyone, including Netflix staff.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Standard 2FA login OTP with explicit anti-phishing warning."
  },
  {
    sampleId: "ENG-LEGIT-027",
    label: "legitimate",
    language: "english",
    domain: "Login notifications",
    message: "492018 is OTP for transaction of INR 3,200.00 at AMAZON INDIA on SBI Card ending 4029. Valid for 5 mins. NEVER share OTP with anyone to keep your account safe.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Banking transaction OTP with strict anti-sharing warning."
  },

  // 23. Google/Microsoft/Apple-style security notifications
  {
    sampleId: "ENG-LEGIT-028",
    label: "legitimate",
    language: "english",
    domain: "Google/Microsoft/Apple-style security notifications",
    message: "Microsoft Account: Security info replacement was requested for user@company.com. If you requested this, your alternative phone will be active on 26-Mar-2026. If not you, cancel request at account.live.com/proofs/Manage.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Legitimate Microsoft 30-day security info replacement notification."
  },

  // 24. WhatsApp notifications
  {
    sampleId: "ENG-LEGIT-029",
    label: "legitimate",
    language: "english",
    domain: "WhatsApp notifications",
    message: "WhatsApp code: 492-108. You can also tap this link to verify your phone: v.whatsapp.com/492108. Do not share this code with anyone.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Official WhatsApp phone number registration message with official domain."
  },

  // 25. Telegram notifications
  {
    sampleId: "ENG-LEGIT-030",
    label: "legitimate",
    language: "english",
    domain: "Telegram notifications",
    message: "Telegram login code: 89201. You are logging in from a new device in Mumbai, India. If this wasn't you, terminate all active sessions in Settings > Privacy & Security > Devices.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Telegram official login verification message."
  },

  // 26. Normal customer-service messages
  {
    sampleId: "ENG-LEGIT-031",
    label: "legitimate",
    language: "english",
    domain: "Normal customer-service messages",
    message: "Urban Company: Your AC service technician Rajesh Kumar is scheduled to visit tomorrow between 10:00 AM - 12:00 PM. You can reschedule or view technician details in the Urban Company app.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Home service technician dispatch notification."
  },

  // 27. Bank maintenance notices
  {
    sampleId: "ENG-LEGIT-032",
    label: "legitimate",
    language: "english",
    domain: "Bank maintenance notices",
    message: "Dear Customer, ICICI Bank Net Banking and Mobile Banking services will be briefly unavailable due to scheduled system maintenance on Sunday, 01-Mar-2026 from 01:00 AM to 04:00 AM IST. Inconvenience is regretted.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official banking system maintenance announcement."
  },

  // 28. Payment failure notifications
  {
    sampleId: "ENG-LEGIT-033",
    label: "legitimate",
    language: "english",
    domain: "Payment failure notifications",
    message: "Transaction of INR 1,299.00 on your Kotak Card XX4920 at MYNTRA failed due to incorrect CVV entered. No money was deducted from your account. Please retry with correct details in your Myntra cart.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Payment failure alert confirming no funds deducted and advising retry in official app."
  },

  // 29. Challenging edge cases: Legitimate messages containing suspicious-looking words ("urgent", "verify", "KYC", "warning", "blocked")
  {
    sampleId: "ENG-LEGIT-034",
    label: "legitimate",
    language: "english",
    domain: "Bank account/KYC",
    message: "SBI Alert: As per RBI guidelines, please ensure your periodic KYC details are updated at your home branch once every 10 years if there is no change in address. No online document upload is required if details are unchanged.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Informational banking KYC message advising branch visit without panic links."
  },
  {
    sampleId: "ENG-LEGIT-035",
    label: "legitimate",
    language: "english",
    domain: "Account security notifications",
    message: "Important Security Notice: Your debit card was temporarily blocked for online transactions because incorrect PIN was entered 3 consecutive times at ATM. Unblock anytime securely in HDFC NetBanking under Card Controls.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Contains 'blocked' and 'PIN' but is legitimate in-app self-service guidance."
  },
  {
    sampleId: "ENG-LEGIT-036",
    label: "legitimate",
    language: "english",
    domain: "Bank transaction confirmations",
    message: "Dear Customer, an urgent security warning: Axis Bank never asks for your OTP, NetBanking Password, or Debit Card PIN over call or SMS. Always keep your credentials confidential.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Contains 'urgent', 'security warning', 'OTP', 'PIN' but is an official educational advisory."
  },
  {
    sampleId: "ENG-LEGIT-037",
    label: "legitimate",
    language: "english",
    domain: "Workplace notifications",
    message: "Urgent action required: Mandatory workplace cybersecurity training module must be completed before the deadline of 28-Feb-2026 to comply with ISO 27001 audit. Access module on internal intranet.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Contains 'Urgent action required' and 'deadline' in corporate internal training context."
  },
  {
    sampleId: "ENG-LEGIT-038",
    label: "legitimate",
    language: "english",
    domain: "Government informational messages",
    message: "National Health Authority: Ayushman Bharat Health Account (ABHA) creation is free and voluntary. Create your ABHA ID at health facility or visit abha.abdm.gov.in. Do not pay any fee to agents.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Official government healthcare advisory warning against unauthorized fees."
  },
  {
    sampleId: "ENG-LEGIT-039",
    label: "legitimate",
    language: "english",
    domain: "Card transaction notifications",
    message: "ICICI Bank: Auto-debit mandate of INR 999.00 for NETFLIX ENTERTAINMENT will be presented on 28-Feb-2026 against your card XX8910. To view or cancel mandate, visit icicibank.com/mandates.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "RBI e-mandate pre-debit 24-hour notification."
  },
  {
    sampleId: "ENG-LEGIT-040",
    label: "legitimate",
    language: "english",
    domain: "Bank transaction confirmations",
    message: "NEFT transaction of INR 15,000.00 credited to account of RAJESH SHARMA on 24-Feb-2026 with UTR PUNBN26055891024 from your SBI A/C XX3901. Charges: NIL.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "NEFT outward remittance confirmation."
  },

  // Continue filling remaining 40 English legitimate samples across banking, telecom, e-commerce, transit, workplace, etc.
  {
    sampleId: "ENG-LEGIT-041",
    label: "legitimate",
    language: "english",
    domain: "Delivery updates",
    message: "Blinkit: Your order of 8 items has been delivered at your doorstep by delivery partner Sunil. Rate your experience in Blinkit app.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Quick commerce delivery completion."
  },
  {
    sampleId: "ENG-LEGIT-042",
    label: "legitimate",
    language: "english",
    domain: "Transit/toll payments",
    message: "FASTag Alert: INR 85.00 deducted at Khed-Shivapur Toll Plaza on NH48 from your FASTag account linked to vehicle MH12DE3920. Remaining Balance: INR 415.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "NHAI FASTag toll debit notification."
  },
  {
    sampleId: "ENG-LEGIT-043",
    label: "legitimate",
    language: "english",
    domain: "Mutual funds/investments",
    message: "CAMS Alert: Monthly SIP installment of INR 5,000.00 successfully processed for Mirae Asset Large Cap Fund (Folio: 49201948). Units allotted: 48.291 at NAV INR 103.54.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Mutual fund SIP allotment statement."
  },
  {
    sampleId: "ENG-LEGIT-044",
    label: "legitimate",
    language: "english",
    domain: "Stock broking/demat",
    message: "Zerodha: Order executed! BOUGHT 10 shares of INFY @ INR 1,840.50 on NSE. Trade ID: 29481920. View holding in Kite.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Stock broker trade confirmation."
  },
  {
    sampleId: "ENG-LEGIT-045",
    label: "legitimate",
    language: "english",
    domain: "Government informational messages",
    message: "EPFO Notification: Monthly contribution of INR 3,600.00 credited to your EPF Member ID MHBAN0019284 for the wage month of Jan-2026. Total balance: INR 2,45,900.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "EPFO provident fund monthly deposit."
  },
  {
    sampleId: "ENG-LEGIT-046",
    label: "legitimate",
    language: "english",
    domain: "Ride hailing",
    message: "Uber: Thanks for riding with driver Ramesh today. Your trip total was INR 245.00 charged to Uber Cash. View invoice in Uber app.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Uber receipt notification."
  },
  {
    sampleId: "ENG-LEGIT-047",
    label: "legitimate",
    language: "english",
    domain: "Utility payments",
    message: "Indane Gas: Booking confirmation for 14.2 kg LPG cylinder against Consumer #29481920. Delivery expected within 48 hours. Cash on Delivery Amount: INR 853.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "LPG refill booking notification."
  },
  {
    sampleId: "ENG-LEGIT-048",
    label: "legitimate",
    language: "english",
    domain: "Streaming/entertainment",
    message: "BookMyShow: Booking confirmed for 'Interstellar (IMAX)' at PVR Phoenix Mills Mumbai for Sunday 01 Mar 2026, 07:15 PM. Seats: E12, E13. Booking ID: W8920194.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Movie ticket booking confirmation."
  },
  {
    sampleId: "ENG-LEGIT-049",
    label: "legitimate",
    language: "english",
    domain: "Pharmacy/healthcare",
    message: "Apollo Pharmacy: Your medicine order #MED892019 has been packed and handed over to courier. Expected delivery tomorrow by 2:00 PM. Bill amount: Rs 640.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Pharmacy order status alert."
  },
  {
    sampleId: "ENG-LEGIT-050",
    label: "legitimate",
    language: "english",
    domain: "Telecom service notice",
    message: "Airtel: You have consumed 50% of your daily high-speed data quota of 1.5GB for today. Recharge with add-on data pack in Airtel Thanks app if needed.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Daily data threshold usage alert."
  },
  {
    sampleId: "ENG-LEGIT-051",
    label: "legitimate",
    language: "english",
    domain: "Library/education",
    message: "Delhi Public Library: Reminder that borrowed book 'Clean Architecture' (Accession #89201) is due for return on 28-Feb-2026. Renew online at dpl.gov.in.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Library book return reminder."
  },
  {
    sampleId: "ENG-LEGIT-052",
    label: "legitimate",
    language: "english",
    domain: "Airline check-in",
    message: "Air India: Web check-in is now open for flight AI 805 from Delhi to Hyderabad on 26 Feb. Complete check-in and download boarding pass at airindia.com.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Airline web check-in reminder."
  },
  {
    sampleId: "ENG-LEGIT-053",
    label: "legitimate",
    language: "english",
    domain: "Bank account/KYC",
    message: "HDFC Bank: Interest of INR 412.00 has been credited to your Savings Account XX4821 for the quarter ending Dec 2025. Total Balance: INR 52,190.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Savings account quarterly interest credit."
  },
  {
    sampleId: "ENG-LEGIT-054",
    label: "legitimate",
    language: "english",
    domain: "Credit bureau report",
    message: "CIBIL Alert: Your monthly credit score report for February 2026 is ready. Your current CIBIL Score is 782. Log in securely to cibil.com to view full report.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official credit score monthly update."
  },
  {
    sampleId: "ENG-LEGIT-055",
    label: "legitimate",
    language: "english",
    domain: "Municipal service",
    message: "BMC Property Tax: Acknowledgement receipt for payment of Rs 14,250.00 towards Property Tax for Assessment Year 2025-26 under SAC #89201948. Download receipt on portal.mcgm.gov.in.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Property tax payment receipt with official municipal domain."
  },
  {
    sampleId: "ENG-LEGIT-056",
    label: "legitimate",
    language: "english",
    domain: "Broadband service",
    message: "JioFiber: Your monthly broadband invoice of Rs 824.82 for connection #022-39019284 has been generated. Due date: 05-Mar-2026. Auto-pay is scheduled on your registered card.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Broadband monthly billing alert."
  },
  {
    sampleId: "ENG-LEGIT-057",
    label: "legitimate",
    language: "english",
    domain: "Vehicle service",
    message: "Maruti Suzuki Service: Periodic maintenance service for your Swift Dzire (MH02EF1029) is completed. Vehicle is ready for pickup at Shivam Motors Andheri. Invoice amount: Rs 5,420.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Car servicing completion notice."
  },
  {
    sampleId: "ENG-LEGIT-058",
    label: "legitimate",
    language: "english",
    domain: "Courier/parcel delivery",
    message: "DTDC Courier: Consignment #D89201948 has reached Destination Hub Bangalore. Out for delivery in tomorrow's morning slot.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Standard courier transit status."
  },
  {
    sampleId: "ENG-LEGIT-059",
    label: "legitimate",
    language: "english",
    domain: "Insurance claim",
    message: "Star Health Insurance: Cashless pre-authorization request of INR 45,000.00 for Claim #SH892019 at Fortis Hospital has been approved. Policy #P1920194.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Health insurance pre-authorization approval."
  },
  {
    sampleId: "ENG-LEGIT-060",
    label: "legitimate",
    language: "english",
    domain: "Donation receipt",
    message: "Thank you for your donation of INR 1,000.00 to CRY (Child Rights and You). 80G tax exemption certificate has been sent to your registered email. Receipt #CRY892019.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Legitimate charity 80G receipt confirmation."
  },
  {
    sampleId: "ENG-LEGIT-061",
    label: "legitimate",
    language: "english",
    domain: "Banking security advisory",
    message: "Security Notice: Bank of Baroda will never send SMS asking you to download third-party applications like AnyDesk or QuickSupport. Stay alert and report suspicious SMS to 1800 258 44 55.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Legitimate anti-fraud education from bank."
  },
  {
    sampleId: "ENG-LEGIT-062",
    label: "legitimate",
    language: "english",
    domain: "Password-change confirmations",
    message: "GitHub Security: Two-factor authentication (2FA) recovery codes were viewed for your account user89 on 24 Feb 2026. If this was not expected, please review your active security keys in account settings.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "GitHub developer 2FA security event alert."
  },
  {
    sampleId: "ENG-LEGIT-063",
    label: "legitimate",
    language: "english",
    domain: "Bank transaction confirmations",
    message: "Auto-debit of INR 450.00 for Spotify Premium successfully debited from ICICI Bank A/C XX9012 on 24-02-2026 under e-mandate URN 284910284820.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Recurring e-mandate subscription debit."
  },
  {
    sampleId: "ENG-LEGIT-064",
    label: "legitimate",
    language: "english",
    domain: "Gym/fitness subscription",
    message: "Cult.fit: Your Cultpass Elite membership has been renewed for 3 months starting 01-Mar-2026. We look forward to seeing you at the center!",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Fitness center membership renewal."
  },
  {
    sampleId: "ENG-LEGIT-065",
    label: "legitimate",
    language: "english",
    domain: "E-commerce order scam",
    message: "Myntra: Your exchange request for order #MY892019 has been approved. Pickup of item (Size M) is scheduled for Wednesday 26 Feb. Handover with original brand tags attached.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "E-commerce exchange pickup confirmation."
  },
  {
    sampleId: "ENG-LEGIT-066",
    label: "legitimate",
    language: "english",
    domain: "Water utility bill",
    message: "Delhi Jal Board: Water bill for K No 89201948 for billing cycle Jan-Feb 2026 is Rs 340.00. Due date is 10-Mar-2026. Pay online at djb.gov.in.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official municipal water bill."
  },
  {
    sampleId: "ENG-LEGIT-067",
    label: "legitimate",
    language: "english",
    domain: "Workplace notifications",
    message: "Slack notification: You have been mentioned by Product Lead in #project-alpha: 'Please review the updated sprint user stories before standup.'",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Slack notification email excerpt."
  },
  {
    sampleId: "ENG-LEGIT-068",
    label: "legitimate",
    language: "english",
    domain: "Government informational messages",
    message: "DoT Advisory: Sanchar Saathi portal (sancharsaathi.gov.in) helps citizens block and trace lost or stolen mobile handsets using CEIR. Stay safe from counterfeit devices.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "DoT Chakshu/Sanchar Saathi portal public service announcement."
  },
  {
    sampleId: "ENG-LEGIT-069",
    label: "legitimate",
    language: "english",
    domain: "Bank account/KYC",
    message: "State Bank of India: Your request for cheque book of 25 leaves for account XX8901 has been dispatched via Speed Post tracking #ED89201948IN. Delivery in 3-5 working days.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Cheque book dispatch notification."
  },
  {
    sampleId: "ENG-LEGIT-070",
    label: "legitimate",
    language: "english",
    domain: "Tax acknowledgements",
    message: "GSTN Portal: GSTR-3B for tax period January 2026 has been successfully filed under GSTIN 27ABCDE1234F1Z5 with ARN AA270126089201P on 20-Feb-2026.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Official GST return filing acknowledgement."
  },
  {
    sampleId: "ENG-LEGIT-071",
    label: "legitimate",
    language: "english",
    domain: "Bank transaction confirmations",
    message: "ATM Cash Withdrawal of INR 5,000.00 on your Axis Bank Debit Card XX9201 at HDFC ATM BANDRA WEST on 24-Feb-2026 17:42:10. Avail Bal: INR 18,240.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "ATM cash withdrawal alert."
  },
  {
    sampleId: "ENG-LEGIT-072",
    label: "legitimate",
    language: "english",
    domain: "Telecom service notice",
    message: "Vodafone Idea: International Roaming pack of Rs 2,499 activated on your number 9820194820 for UAE trip. Valid for 10 days starting 25-Feb-2026.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Telecom roaming activation confirmation."
  },
  {
    sampleId: "ENG-LEGIT-073",
    label: "legitimate",
    language: "english",
    domain: "Workplace notifications",
    message: "IT Helpdesk: Your request #TKT-892019 for dual monitor display adapter has been approved by department manager. Asset team will deliver to your workstation today.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Internal workplace IT ticketing update."
  },
  {
    sampleId: "ENG-LEGIT-074",
    label: "legitimate",
    language: "english",
    domain: "Bank account/KYC",
    message: "Kotak Mahindra Bank: Positive Pay confirmation received for Cheque #000142 for INR 45,000.00 in favor of SHARMA BUILDERS. Cheque will clear as scheduled.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "RBI Positive Pay high-value cheque clearance acknowledgement."
  },
  {
    sampleId: "ENG-LEGIT-075",
    label: "legitimate",
    language: "english",
    domain: "University/college notifications",
    message: "University of Delhi: Grade cards for B.Com (Hons) Semester V examinations held in Nov-Dec 2025 are now available on student portal du.ac.in.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "University examination result announcement."
  },
  {
    sampleId: "ENG-LEGIT-076",
    label: "legitimate",
    language: "english",
    domain: "Appointment confirmations",
    message: "Urban Company: Salon at home appointment confirmed for Saturday 28 Feb at 03:00 PM. Beautician Priya will bring sanitized equipment.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Salon home appointment confirmation."
  },
  {
    sampleId: "ENG-LEGIT-077",
    label: "legitimate",
    language: "english",
    domain: "Airline check-in",
    message: "Vistara: Gate change announcement for flight UK 945 (DEL to BOM). New boarding gate is Gate 32B at Terminal 3. Boarding commences at 18:20.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Airline operational flight gate change alert."
  },
  {
    sampleId: "ENG-LEGIT-078",
    label: "legitimate",
    language: "english",
    domain: "Transit/toll payments",
    message: "Namma Metro Bangalore: Smart Card recharge of INR 500.00 successful via UPI. Tap your card at any AFC gate card reader within 7 days to update card balance.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Metro card recharge confirmation."
  },
  {
    sampleId: "ENG-LEGIT-079",
    label: "legitimate",
    language: "english",
    domain: "Bank account/KYC",
    message: "Dear Customer, TDS Certificate (Form 16A) for Q3 FY 2025-26 on Fixed Deposit interest is generated. Download from NetBanking under Tax Documents.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Fixed deposit TDS Form 16A download alert."
  },
  {
    sampleId: "ENG-LEGIT-080",
    label: "legitimate",
    language: "english",
    domain: "Login notifications",
    message: "Your OTP for Aadhaar authentication for DigiLocker registration is 492019. Valid for 10 mins. (UIDAI generated)",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Official DigiLocker Aadhaar OTP verification."
  }
];

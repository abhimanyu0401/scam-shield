import type { BenchmarkSample } from "../../../evaluation/types";

export const hinglishScams: BenchmarkSample[] = [
  // 1. Bank account/KYC
  {
    sampleId: "HIN-SCAM-001",
    label: "scam",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "Dear customer aapka SBI account suspend ho gaya hai kyunki aapka PAN card update nahi hai. Turant link pe click karke KYC complete kare: https://sbi-kyc-update.online",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Urgency", "Account suspension threat", "Phishing link"],
    difficulty: "easy",
    notes: "Hinglish SBI KYC account suspension."
  },
  {
    sampleId: "HIN-SCAM-002",
    label: "scam",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "HDFC Alert: Aapke saving account me suspicious login detect hua hai. Agar ye aapne nahi kiya to apna debit card number aur PIN is number 9840291849 par SMS kare unblock karne ke liye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests ATM PIN", "Panic alert"],
    difficulty: "easy",
    notes: "Hinglish SMS asking for card PIN."
  },
  {
    sampleId: "HIN-SCAM-003",
    label: "scam",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "ICICI Bank: RBI rule ke mutabik sabhi customers ko netbanking re-verify karna mandatory hai. Branch jane ki zaroorat nahi, hamara banking APK install kare: http://icici-easy-auth.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Malware APK lure", "Suspicious link"],
    difficulty: "medium",
    notes: "Hinglish APK malware lure."
  },

  // 2. UPI/payment fraud
  {
    sampleId: "HIN-SCAM-004",
    label: "scam",
    language: "hinglish",
    domain: "UPI/payment fraud",
    message: "Congratulations! Aapko Google Pay pe Rs 4,999 ka scratch card mila hai. Amount apne bank me lene ke liye niche link kholo aur apna UPI PIN dalo: https://gpay-reward-claim.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests UPI PIN to receive money", "Cashback lure"],
    difficulty: "easy",
    notes: "Google Pay reward claim asking for UPI PIN."
  },
  {
    sampleId: "HIN-SCAM-005",
    label: "scam",
    language: "hinglish",
    domain: "UPI/payment fraud",
    message: "Bhai maine OLX wale sofa ke liye 15,000 bhej diye hain PhonePe par. Receive karne ke liye accept button dabake 4 digit secret pin daal do.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Reverse charge scam", "Requests PIN"],
    difficulty: "easy",
    notes: "OLX buyer asking seller to enter PIN to receive money."
  },

  // 3. Electricity/gas bill scam
  {
    sampleId: "HIN-SCAM-006",
    label: "scam",
    language: "hinglish",
    domain: "Electricity/gas bill scam",
    message: "Dear user aapki bijli ka connection aaj raat 9:30 baje cut kar diya jayega kyunki pichle mahine ka bill update nahi hua. Jaldi se power officer 9830219482 pe call kare bill update karwane ke liye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Utility disconnection threat", "Direct officer phone number", "Urgency"],
    difficulty: "easy",
    notes: "Classic electricity disconnection message in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-007",
    label: "scam",
    language: "hinglish",
    domain: "Electricity/gas bill scam",
    message: "Mahanagar Gas Notice: Aapka gas pipeline connection band ho jayega agar aaj inspection charge Rs 100 pay nahi kiya. Payment kare UPI gasbill@okhdfcbank par.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Gas cutoff threat", "Personal UPI payment"],
    difficulty: "medium",
    notes: "Gas pipeline disconnection extortion in Hinglish."
  },

  // 4. Digital arrest scam / Police threat
  {
    sampleId: "HIN-SCAM-008",
    label: "scam",
    language: "hinglish",
    domain: "Digital arrest scam",
    message: "CBI & Mumbai Crime Branch Notice: Aapke Aadhaar card se Taiwan bheja gaya illegal parcel pakda gaya hai jisme 5 fake passports aur drugs mile hain. Aap 24 ghante ke liye Digital Arrest me hain. Room se bahar nikle to police shoot karegi.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "Extortion", "Law enforcement impersonation"],
    difficulty: "easy",
    notes: "Hinglish digital arrest script."
  },
  {
    sampleId: "HIN-SCAM-009",
    label: "scam",
    language: "hinglish",
    domain: "Police/legal threat",
    message: "Delhi Cyber Cell: Aapke mobile number ke khilaf FIR register hui hai. Arrest warrant se bachne ke liye 30 minutes me IO Sharma ko call kare 9810293847 par.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Arrest warrant threat", "Urgency"],
    difficulty: "medium",
    notes: "Hinglish police FIR threat."
  },

  // 5. Lottery/prize
  {
    sampleId: "HIN-SCAM-010",
    label: "scam",
    language: "hinglish",
    domain: "Lottery/prize",
    message: "KBC Jio Lucky Draw: Aapke number ne KBC me 25 Lakh ka lottery jeeta hai. Apna prize claim karne ke liye WhatsApp manager Rana Pratap ko message kare 9748291039 par.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Lottery scam", "KBC impersonation"],
    difficulty: "easy",
    notes: "KBC Jio lucky draw in Hinglish."
  },

  // 6. Job/task scam
  {
    sampleId: "HIN-SCAM-011",
    label: "scam",
    language: "hinglish",
    domain: "Job/task scam",
    message: "Part time online job: Ghar baithe YouTube videos like aur subscribe karo aur daily Rs 2,000 se Rs 6,000 kamao. Koi investment nahi chahiye. Telegram pe contact karo: @parttime_daily_earning",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Prepaid task scam", "Unrealistic earnings", "Telegram handle"],
    difficulty: "easy",
    notes: "YouTube like task scam in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-012",
    label: "scam",
    language: "hinglish",
    domain: "Job/task scam",
    message: "Amazon product rating job: Simple work, har rating ke badle 150 Rs instant payment. Trial task ke liye hamara telegram channel join kare https://t.me/amazon_rating_jobs",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Task scam", "E-commerce impersonation"],
    difficulty: "medium",
    notes: "Amazon rating task fraud."
  },

  // 7. Loan scam
  {
    sampleId: "HIN-SCAM-013",
    label: "scam",
    language: "hinglish",
    domain: "Loan scam",
    message: "Instant Personal Loan approved! 5 Lakh ka loan 1% monthly interest pe. Zero CIBIL check. Bas 1,499 Rs processing fee transfer karo aur 10 minute me account me paisa pao.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Advance fee loan", "Unrealistic approval"],
    difficulty: "easy",
    notes: "Advance processing fee loan scam in Hinglish."
  },

  // 8. SIM deactivation
  {
    sampleId: "HIN-SCAM-014",
    label: "scam",
    language: "hinglish",
    domain: "SIM deactivation",
    message: "Jio Alert: Aapka SIM card 2 ghante me block ho jayega kyunki Aadhaar eKYC incomplete hai. Outgoing calls band hone se bachane ke liye turant call kare 9102938472 par.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM block threat", "Urgency"],
    difficulty: "easy",
    notes: "Jio SIM block threat in Hinglish."
  },

  // 9. Courier/parcel scam
  {
    sampleId: "HIN-SCAM-015",
    label: "scam",
    language: "hinglish",
    domain: "Courier/parcel scam",
    message: "FedEx Delivery Notice: Aapka parcel house number na milne ki wajah se hold pe hai. Redelivery schedule karne ke liye Rs 25 ka charges pay kare: https://fedex-redelivery-pay.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Courier redelivery lure", "Phishing link"],
    difficulty: "medium",
    notes: "FedEx address and small fee phishing in Hinglish."
  },

  // 10. Fake refund
  {
    sampleId: "HIN-SCAM-016",
    label: "scam",
    language: "hinglish",
    domain: "Fake refund",
    message: "IRCTC Refund: Aapka train ticket cancellation refund of Rs 1,840 pending hai IFSC code galat hone ki wajah se. Apna correct bank details submit kare: https://irctc-refund-portal.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake refund", "Phishing link"],
    difficulty: "medium",
    notes: "IRCTC refund portal phishing in Hinglish."
  },

  // 11. Card/payment reversal
  {
    sampleId: "HIN-SCAM-017",
    label: "scam",
    language: "hinglish",
    domain: "Card/payment reversal",
    message: "Urgent: Aapke SBI credit card se Croma par 64,999 Rs ka transaction hua hai. Agar aapne nahi kiya to turant 15 minute ke andar 9849201948 pe call karke cancel karwaye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["False transaction panic", "Direct phone number", "Urgency"],
    difficulty: "medium",
    notes: "Credit card transaction panic in Hinglish."
  },

  // 12. Investment/crypto scam
  {
    sampleId: "HIN-SCAM-018",
    label: "scam",
    language: "hinglish",
    domain: "Investment/crypto scam",
    message: "Stock Market Daily Profit: Hamare VIP WhatsApp group me daily guaranteed 15% return milta hai. SEBI registered call service. Join kare: https://chat.whatsapp.com/inv/hinglishTradingCircle",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Guaranteed returns", "WhatsApp trading scam"],
    difficulty: "medium",
    notes: "Hinglish stock trading WhatsApp group fraud."
  },

  // 13. Fake customer support
  {
    sampleId: "HIN-SCAM-019",
    label: "scam",
    language: "hinglish",
    domain: "Fake customer support",
    message: "Swiggy Support: Aapke refund ka 450 Rs pending hai. Hamare officer se baat kare aur AnyDesk app download karke 9 digit code share kare direct GPay me lene ke liye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Remote access tool", "Fake customer support"],
    difficulty: "easy",
    notes: "Swiggy AnyDesk refund fraud in Hinglish."
  },

  // 14. Fake traffic challan/fine
  {
    sampleId: "HIN-SCAM-020",
    label: "scam",
    language: "hinglish",
    domain: "Fake traffic challan/fine",
    message: "Traffic Police Challan: Aapki gaadi DL01AB1234 pe 1,500 Rs ka pending challan hai. Court case se bachne ke liye 24 ghante me pay kare: https://echallan-pay-traffic.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Traffic fine threat", "Court summons threat"],
    difficulty: "medium",
    notes: "Traffic challan phishing in Hinglish."
  },

  // Continue with Hinglish scams 21 to 60
  {
    sampleId: "HIN-SCAM-021",
    label: "scam",
    language: "hinglish",
    domain: "Aadhaar/PAN/document update",
    message: "Govt mandate: Agar PAN card ko bank account se link nahi kiya to 10,000 penalty lagega aur account freeze ho jayega. Abhi link kare: http://nsdl-pan-update.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Penalty threat", "Phishing link"],
    difficulty: "medium",
    notes: "PAN card penalty threat in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-022",
    label: "scam",
    language: "hinglish",
    domain: "Mobile recharge fraud",
    message: "Free 5G Recharge: Ambani ki beti ki shaadi ke khushi me sabhi Jio aur Airtel users ko 3 mahine ka free recharge mil raha hai. Claim kare: https://free-recharge-offer.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Viral bait", "Free recharge"],
    difficulty: "easy",
    notes: "Celebrity event viral recharge bait in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-023",
    label: "scam",
    language: "hinglish",
    domain: "WhatsApp/Telegram account takeover",
    message: "Bhai mera phone kharab ho gaya hai aur naya number liya hai. Urgent hospital bill pay karna hai 12,000 Rs. Mere dost ke UPI pe transfer kar de jaldi: amit89@okicici",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Impersonation of friend", "Urgent money request"],
    difficulty: "hard",
    notes: "Friend emergency impersonation in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-024",
    label: "scam",
    language: "hinglish",
    domain: "Fake government benefit/subsidy",
    message: "PM Berojgari Bhatta 2026: Sabhi 10th aur 12th pass yuvaon ko har mahine 3,500 Rs milenge. Apna naam register kare: http://pm-bhatta-yojana.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake subsidy", "Phishing link"],
    difficulty: "easy",
    notes: "Unemployment allowance fake scheme in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-025",
    label: "scam",
    language: "hinglish",
    domain: "E-commerce order scam",
    message: "Flipkart Big Billion Winner: Aapko iPhone 15 Pro sirf 12,999 Rs me mil raha hai. Sirf 3 phone bache hain. Jaldi order kare: https://flipkart-deal-store.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic discount", "Urgency"],
    difficulty: "easy",
    notes: "Fake e-commerce deal in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-026",
    label: "scam",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "Aapka Kotak 811 account band hone wala hai. Chalu rakhne ke liye turant apna debit card details aur OTP verify kare: https://kotak-rekyc.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account block threat", "Phishing link"],
    difficulty: "medium",
    notes: "Kotak 811 KYC phishing in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-027",
    label: "scam",
    language: "hinglish",
    domain: "Electricity/gas bill scam",
    message: "Bijli office alert: Bill pending 1850 Rs. Aaj raat light kat jayegi. Line bachane ke liye turant call kare 9820194820 par.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Power cutoff threat", "Urgency"],
    difficulty: "easy",
    notes: "Short electricity threat in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-028",
    label: "scam",
    language: "hinglish",
    domain: "Card/payment reversal",
    message: "HDFC Card points worth 4,800 Rs expire ho rahe hain tonight. Cash me convert karne ke liye yahan click kare: http://hdfc-rewards-points.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Expiring points lure", "Phishing link"],
    difficulty: "easy",
    notes: "Reward points cash lure in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-029",
    label: "scam",
    language: "hinglish",
    domain: "Job/task scam",
    message: "Google review likho aur daily 2500 kamao. No fees required. Join telegram: @google_review_earning",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Task scam", "Telegram recruiter"],
    difficulty: "easy",
    notes: "Google review task scam in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-030",
    label: "scam",
    language: "hinglish",
    domain: "Digital arrest scam",
    message: "NCB Police Delhi: Aapke naam pe illegal drug consignment pakda gaya hai. Supreme Court hearing ke liye video call join kare: https://ncb-virtual-court.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "NCB impersonation"],
    difficulty: "hard",
    notes: "NCB digital arrest in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-031",
    label: "scam",
    language: "hinglish",
    domain: "Fake subscription renewal",
    message: "Netflix auto-debit failed. Aapka subscription cancel ho gaya hai. Payment update kare: https://netflix-update-pay.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Payment update phishing", "Subscription suspension"],
    difficulty: "medium",
    notes: "Netflix payment update in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-032",
    label: "scam",
    language: "hinglish",
    domain: "Loan scam",
    message: "Pradhan Mantri Loan Scheme: 10 Lakh ka business loan pass ho gaya. Sirf 2500 Rs file charge pay kare release ke liye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Advance fee loan"],
    difficulty: "easy",
    notes: "Advance fee business loan in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-033",
    label: "scam",
    language: "hinglish",
    domain: "Courier/parcel scam",
    message: "India Post: Parcel delivery fail ho gaya kyunki flat number nahi tha. Redelivery fee 35 Rs pay kare: https://indiapost-parcel.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["India Post phishing", "Small fee card trap"],
    difficulty: "medium",
    notes: "India Post parcel redelivery in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-034",
    label: "scam",
    language: "hinglish",
    domain: "SIM deactivation",
    message: "Airtel: Aapka SIM 24 ghante me band ho jayega. Active rakhne ke liye 9102938192 pe call kare.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM block threat", "Direct phone number"],
    difficulty: "easy",
    notes: "Airtel SIM block in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-035",
    label: "scam",
    language: "hinglish",
    domain: "Remote-access/support scam",
    message: "Bank of Baroda: Aapke YONO app me bug aa gaya hai. Resolve karne ke liye TeamViewer QuickSupport download kare aur code bataye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Remote screen sharing", "Bank impersonation"],
    difficulty: "medium",
    notes: "TeamViewer screen sharing in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-036",
    label: "scam",
    language: "hinglish",
    domain: "Lottery/prize",
    message: "Congratulations! Aapko Diwali Lucky Draw me Royal Enfield bike mili hai. Registration fee 3500 Rs transfer kare delivery ke liye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Bike lottery", "Advance fee"],
    difficulty: "easy",
    notes: "Bike lottery advance fee in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-037",
    label: "scam",
    language: "hinglish",
    domain: "Police/legal threat",
    message: "Cyber Cell Mumbai: Aapke against porn case me warrant hai. Arrest se bachne ke liye 10,000 fine turant pay kare is UPI cyberpolice@okaxis par.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Legal extortion", "Fake police UPI"],
    difficulty: "medium",
    notes: "Police fine extortion in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-038",
    label: "scam",
    language: "hinglish",
    domain: "Generic credential phishing",
    message: "Instagram Copyright Alert: Aapki profile meta guidelines violate kar rahi hai. 24 hours me appeal kare warna account delete hoga: https://instagram-meta-appeal.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Copyright appeal", "Account deletion threat"],
    difficulty: "medium",
    notes: "Instagram copyright appeal in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-039",
    label: "scam",
    language: "hinglish",
    domain: "Fake customer support",
    message: "PhonePe 24x7 Helpline: Agar transaction fail hua hai aur paisa cut gaya to call kare 08920194820 par turant refund ke liye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake helpline number"],
    difficulty: "medium",
    notes: "Fake PhonePe customer care number in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-040",
    label: "scam",
    language: "hinglish",
    domain: "UPI/payment fraud",
    message: "Rs 8,000 ka cashback lene ke liye PhonePe open kare aur collect request pe accept dabake PIN dale.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests UPI PIN to receive money"],
    difficulty: "easy",
    notes: "Collect request cashback trick in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-041",
    label: "scam",
    language: "hinglish",
    domain: "Investment/crypto scam",
    message: "Crypto Mining: 1000 Rs invest karo aur daily 100 Rs return pao lifetime. Join fast: https://crypto-mining-daily.xyz",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic returns", "Crypto Ponzi"],
    difficulty: "easy",
    notes: "Crypto Ponzi in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-042",
    label: "scam",
    language: "hinglish",
    domain: "Fake employment offer",
    message: "Indigo Airlines Hiring: Ground staff selection ho gaya hai (Salary 32,000). Uniform aur security deposit 2,000 Rs submit kare: https://indigo-careers-portal.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Job advance fee", "Airline impersonation"],
    difficulty: "medium",
    notes: "Airline ground staff job scam in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-043",
    label: "scam",
    language: "hinglish",
    domain: "Fake refund",
    message: "Income tax refund of Rs 14,200 approved. Apna bank account verify kare direct transfer ke liye: http://tax-refund-efiling.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Tax refund lure", "Phishing link"],
    difficulty: "medium",
    notes: "Tax refund in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-044",
    label: "scam",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "PNB customer, aapka account debit transactions ke liye hold pe hai. Aadhaar OTP daal kar unblock kare: http://bit.ly/pnbUnblock2026",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Shortened URL", "Account hold threat"],
    difficulty: "easy",
    notes: "Shortened URL PNB unblock in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-045",
    label: "scam",
    language: "hinglish",
    domain: "Electricity/gas bill scam",
    message: "Electricity power cut notice: Previous bill unpaid. Contact power officer immediately at 9810293847 before 8 PM.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Utility disconnection threat", "Direct phone number"],
    difficulty: "easy",
    notes: "Electricity cutoff in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-046",
    label: "scam",
    language: "hinglish",
    domain: "Card/payment reversal",
    message: "Amazon 48,000 charge alert on card ending 8910. Agar unauthorized hai to turant 9830219482 pe call karke reverse karwaye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["False transaction panic", "Direct phone number"],
    difficulty: "medium",
    notes: "Credit card charge reverse call scam in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-047",
    label: "scam",
    language: "hinglish",
    domain: "Fake traffic challan/fine",
    message: "e-Challan: Gaadi MH02CD5678 ka speeding fine 2,000 Rs pending hai. Pay online: https://m-parivahan-pay.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Challan threat", "Phishing link"],
    difficulty: "medium",
    notes: "E-challan in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-048",
    label: "scam",
    language: "hinglish",
    domain: "Job/task scam",
    message: "Hotel review likhne ka kaam. Har review ka 300 Rs instant GPay. Contact kare Telegram pe: @hotel_tasks_india",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Task scam", "Telegram handle"],
    difficulty: "easy",
    notes: "Hotel review task in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-049",
    label: "scam",
    language: "hinglish",
    domain: "Digital arrest scam",
    message: "CBI Notice: Aapke naam par Money Laundering ka case darj hua hai. Video interrogation ke liye link open kare: https://cbi-investigation.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "CBI impersonation"],
    difficulty: "hard",
    notes: "CBI digital arrest video link in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-050",
    label: "scam",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "Axis Bank: Debit card expiry hone ki wajah se block ho jayega. New card dispatch ke liye CVV aur OTP confirm kare call par.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests CVV and OTP", "Card block threat"],
    difficulty: "easy",
    notes: "Card CVV harvesting in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-051",
    label: "scam",
    language: "hinglish",
    domain: "Fake government benefit/subsidy",
    message: "Sarkar de rahi hai sabhi ko free smartphone aur 1 year 5G internet. Apply kare: http://free-phone-gov.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake government scheme", "Viral lure"],
    difficulty: "easy",
    notes: "Free phone scheme in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-052",
    label: "scam",
    language: "hinglish",
    domain: "Courier/parcel scam",
    message: "DHL: Foreign parcel custom clearance me hold hai. Custom duty 8,500 Rs pay kare UPI par release ke liye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Customs parcel scam", "Advance fee"],
    difficulty: "medium",
    notes: "Foreign parcel customs duty in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-053",
    label: "scam",
    language: "hinglish",
    domain: "Loan scam",
    message: "Aadhar card pe 5 lakh ka loan approve ho gaya. 999 Rs registration fee bhej ke turant paisa pao.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Advance fee loan"],
    difficulty: "easy",
    notes: "Aadhaar loan advance fee in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-054",
    label: "scam",
    language: "hinglish",
    domain: "SIM deactivation",
    message: "Vi Alert: Aapka SIM verification incomplete hai. Aaj sham 6 baje band ho jayega. Call kare 9402918293 par.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM block", "Direct phone number"],
    difficulty: "easy",
    notes: "Vi SIM block in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-055",
    label: "scam",
    language: "hinglish",
    domain: "Fake customer support",
    message: "GPay customer care: Paise transfer nahi hue to turant hamare help desk 9820194820 pe baat kare.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake helpline number"],
    difficulty: "medium",
    notes: "GPay fake helpline in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-056",
    label: "scam",
    language: "hinglish",
    domain: "WhatsApp/Telegram account takeover",
    message: "WhatsApp team: Aapke account me abnormal activity mili hai. Apna verification code SMS se dekh kar yahan reply kare.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account takeover", "Requests verification code"],
    difficulty: "hard",
    notes: "WhatsApp OTP theft in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-057",
    label: "scam",
    language: "hinglish",
    domain: "E-commerce order scam",
    message: "Amazon reward: Sony 4K TV worth 65,000 mil raha hai sirf 3,999 Rs me. Offer ends in 1 hour: https://amzn-superdeals.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic discount", "Urgency"],
    difficulty: "easy",
    notes: "Fake TV discount in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-058",
    label: "scam",
    language: "hinglish",
    domain: "Police/legal threat",
    message: "High Court notice: Cheque bounce case me non-bailable warrant nikla hai. Aaj shaam tak vakil 9830219482 se settle kare.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Legal warrant threat", "Extortion"],
    difficulty: "hard",
    notes: "Cheque bounce extortion in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-059",
    label: "scam",
    language: "hinglish",
    domain: "UPI/payment fraud",
    message: "PhonePe collect request of Rs 2,500 pending. Accept kare aur PIN dale cashback receive karne ke liye.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests UPI PIN to receive money"],
    difficulty: "easy",
    notes: "Collect request cashback in Hinglish."
  },
  {
    sampleId: "HIN-SCAM-060",
    label: "scam",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "Dear customer, your bank account KYC is expired. Kindly update immediately using http://bit.ly/bankKycUpdateNow to avoid penalty.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Shortened URL", "KYC threat"],
    difficulty: "easy",
    notes: "Shortened URL KYC in Hinglish."
  }
];

export const hinglishLegitimate: BenchmarkSample[] = [
  // 1. Bank transaction confirmations
  {
    sampleId: "HIN-LEGIT-001",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank transaction confirmations",
    message: "Dear Customer, INR 1,250.00 debited from your SBI A/C XX4821 on 24-02-2026 for purchase at D-MART. Available balance: INR 22,450.00. Agar ye aapne nahi kiya to 1800112211 par call kare.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "SBI transaction alert in Hinglish with official toll free."
  },
  {
    sampleId: "HIN-LEGIT-002",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank transaction confirmations",
    message: "HDFC Bank Alert: Rs 45,000.00 credited to your account XX8910 as monthly salary by TCS LTD via NEFT. Total balance: Rs 68,900.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Salary credit alert in Hinglish."
  },

  // 2. UPI payment confirmations
  {
    sampleId: "HIN-LEGIT-003",
    label: "legitimate",
    language: "hinglish",
    domain: "UPI payment confirmations",
    message: "Google Pay: Paid Rs 320.00 to Sharma Sweets successfully from your ICICI Bank A/C XX9012. UPI Ref No 604928194021.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Google Pay payment in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-004",
    label: "legitimate",
    language: "hinglish",
    domain: "UPI payment confirmations",
    message: "PhonePe Alert: Money received! Rs 2,500.00 credited to your account XX4821 from Rohit Sharma. UPI Ref: 605920194820.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "PhonePe credit notification in Hinglish."
  },

  // 3. Order & delivery updates
  {
    sampleId: "HIN-LEGIT-005",
    label: "legitimate",
    language: "hinglish",
    domain: "Delivery updates",
    message: "Amazon: Aapka package tracking #AMZN8920194 aaj delivery ke liye nikla hai. Delivery agent Ramesh ko package lete waqt ye delivery code 4829 bataye.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Amazon delivery code in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-006",
    label: "legitimate",
    language: "hinglish",
    domain: "Delivery updates",
    message: "Zomato: Aapka biryani order restaurant se pick ho gaya hai aur 20 minutes me deliver ho jayega. Live location app me dekhe.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Zomato order delivery in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-007",
    label: "legitimate",
    language: "hinglish",
    domain: "Genuine order confirmations",
    message: "Flipkart: Order #OD89201948 place ho gaya hai. Expected delivery date: Friday, 27 February. Order track kare Flipkart app me.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Flipkart order confirmation in Hinglish."
  },

  // 4. Utility & recharge
  {
    sampleId: "HIN-LEGIT-008",
    label: "legitimate",
    language: "hinglish",
    domain: "Electricity bills",
    message: "Tata Power DDL: Consumer #600192847 ka Feb-2026 ka bill Rs 2,340.00 generate ho gaya hai. Due date: 08-Mar-2026. Bill pay kare official app ya tatapower-ddl.com par.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Electricity bill notification in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-009",
    label: "legitimate",
    language: "hinglish",
    domain: "Mobile recharge confirmations",
    message: "Jio: 749 Rs ka recharge aapke number 9820194820 pe successfully activate ho gaya hai. 2GB daily data + unlimited calls 84 days ke liye.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Jio recharge in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-010",
    label: "legitimate",
    language: "hinglish",
    domain: "LPG Gas booking",
    message: "HP Gas: 14.2 kg refill cylinder successfully book ho gaya hai. Order #892019. Delivery 2 din me hogi. Total bill: Rs 853.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "HP Gas booking in Hinglish."
  },

  // 5. Train & flight bookings
  {
    sampleId: "HIN-LEGIT-011",
    label: "legitimate",
    language: "hinglish",
    domain: "Train/flight confirmations",
    message: "IRCTC PNR: 2849102848, Train: 12952 Mumbai Rajdhani, Date: 28-Feb-2026, Class: 3A, Coach: B4, Berth: 42 (Side Lower). Shubh yatra.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "IRCTC confirmation in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-012",
    label: "legitimate",
    language: "hinglish",
    domain: "Train/flight confirmations",
    message: "IndiGo flight 6E 534 (BOM to DEL) on 01 Mar 2026 confirmed. Web check-in open ho gaya hai goindigo.in par.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "IndiGo check-in in Hinglish."
  },

  // 6. Security notices & OTPs
  {
    sampleId: "HIN-LEGIT-013",
    label: "legitimate",
    language: "hinglish",
    domain: "Login notifications",
    message: "892014 aapka Netflix login verification code hai. Ye code 10 minute ke liye valid hai. Kisi ke sath share na kare.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Netflix OTP in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-014",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "Bank Security Advisory: Bank of Baroda kabhi bhi phone ya SMS par aapka NetBanking Password ya Card PIN nahi mangta. Kisi ko OTP na bataye.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Bank security awareness in Hinglish with keywords."
  },
  {
    sampleId: "HIN-LEGIT-015",
    label: "legitimate",
    language: "hinglish",
    domain: "Account security notifications",
    message: "Security Alert: ATM par 3 baar galat PIN dalne ki wajah se aapka debit card aaj ke liye temporarily block ho gaya hai. Card kal automatically unblock ho jayega.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Legitimate PIN block notice in Hinglish."
  },

  // Continue with Hinglish legitimate samples 16 to 60
  {
    sampleId: "HIN-LEGIT-016",
    label: "legitimate",
    language: "hinglish",
    domain: "FASTag toll payments",
    message: "FASTag Alert: Rs 85.00 deducted at toll plaza on NH48 from vehicle MH12DE3920. Balance: Rs 415.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "FASTag toll in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-017",
    label: "legitimate",
    language: "hinglish",
    domain: "Doctor appointment",
    message: "Apollo Clinic: Dr. Sanjay Gupta ke sath aapki appointment confirm hai 26-Feb at 11:30 AM. Clinic time pe pahuche.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Doctor consultation in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-018",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "SBI Alert: Savings account XX4821 me quarterly interest Rs 412.00 credit ho gaya hai. Total balance: Rs 52,190.00.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Interest credit in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-019",
    label: "legitimate",
    language: "hinglish",
    domain: "Government informational messages",
    message: "Sanchar Saathi Portal (DoT): Agar aapka mobile chori ho gaya hai to turant sancharsaathi.gov.in pe jaake IMEI block kare.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Sanchar Saathi in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-020",
    label: "legitimate",
    language: "hinglish",
    domain: "Stock broking/demat",
    message: "Zerodha: Order executed! BOUGHT 10 shares of INFY @ 1,840.50 on NSE. Trade ID: 29481920.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Stock trade in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-021",
    label: "legitimate",
    language: "hinglish",
    domain: "Insurance reminders",
    message: "HDFC Life: Policy #19820194 ka premium 24,000 Rs due hai on 15-Mar-2026. Pay kare hdfclife.com pe.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Insurance premium in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-022",
    label: "legitimate",
    language: "hinglish",
    domain: "Workplace notifications",
    message: "Office Notice: Appraisal self-evaluation form submit karne ki last date 6th March 2026 hai. Workday portal pe complete kare.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Workplace appraisal in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-023",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank maintenance notices",
    message: "ICICI Bank: System upgrade ki wajah se Sunday 01-Mar ko raat 1 AM se 4 AM tak NetBanking temporarily unavailable rahega.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Banking maintenance in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-024",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "RBI Guidelines: Agar aapke address me koi change nahi hai to re-KYC ke liye bank branch jane ki zaroorat nahi hai.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "RBI re-KYC info in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-025",
    label: "legitimate",
    language: "hinglish",
    domain: "Delivery updates",
    message: "Blinkit: Aapka grocery order deliver ho gaya hai. Experience rate kare app me.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Blinkit delivery in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-026",
    label: "legitimate",
    language: "hinglish",
    domain: "Card transaction notifications",
    message: "Kotak Card XX4920 used for Rs 1,499.00 at Myntra on 24-Feb-2026. SMS BLOCK 4920 to 5676788 if unauthorized.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Card alert in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-027",
    label: "legitimate",
    language: "hinglish",
    domain: "Government informational messages",
    message: "Ayushman Bharat: Muft ilaj ke liye apna Ayushman Card banwaye. Jankari ke liye pmjay.gov.in dekhe.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Ayushman Bharat in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-028",
    label: "legitimate",
    language: "hinglish",
    domain: "Telecom service notice",
    message: "Airtel: Aapka daily 1.5GB data ka 50% consume ho gaya hai. Extra data ke liye Airtel Thanks app me jaye.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Data quota in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-029",
    label: "legitimate",
    language: "hinglish",
    domain: "Municipal service",
    message: "Property Tax Receipt: Rs 12,400 successfully received for Assessment Year 2025-26 under SAC #892019.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Property tax receipt in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-030",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank transaction confirmations",
    message: "Axis Bank: NEFT of Rs 15,000 successfully sent to Rajesh Sharma with UTR AXISN26055891024.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "NEFT outward transfer in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-031",
    label: "legitimate",
    language: "hinglish",
    domain: "Login notifications",
    message: "DigiLocker login OTP is 492019. Valid for 10 minutes. Do not share with anyone.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "DigiLocker OTP in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-032",
    label: "legitimate",
    language: "hinglish",
    domain: "Pharmacy/healthcare",
    message: "Apollo Pharmacy: Aapki medicines pack ho gayi hain aur kal 2 PM tak deliver hongi. Bill: Rs 640.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Pharmacy delivery in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-033",
    label: "legitimate",
    language: "hinglish",
    domain: "Vehicle service",
    message: "Maruti Service: Swift Dzire (MH02EF1029) ki service complete ho gayi hai. Workshop se pick kar sakte hain. Total: Rs 5,420.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Car servicing notice in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-034",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "SBI: Aapka naya cheque book Speed Post tracking #ED892019482IN se bhej diya gaya hai.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Cheque book dispatch in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-035",
    label: "legitimate",
    language: "hinglish",
    domain: "Account security notifications",
    message: "Google Security: New sign-in on Windows Chrome (Delhi, India). Agar ye aap the to koi action lene ki zaroorat nahi hai.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Google sign-in alert in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-036",
    label: "legitimate",
    language: "hinglish",
    domain: "Government informational messages",
    message: "Election Commission: Apna polling booth janne ke liye voters.eci.gov.in pe jaye ya 1950 pe call kare.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Voter info in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-037",
    label: "legitimate",
    language: "hinglish",
    domain: "Workplace notifications",
    message: "Slack notice: Team meeting schedule ho gayi hai Friday 4 PM pe sprint review ke liye.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Slack meeting alert in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-038",
    label: "legitimate",
    language: "hinglish",
    domain: "Delivery updates",
    message: "BlueDart: Tracking #49201948 out for delivery today. Delivery agent: Sunil Kumar.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "BlueDart delivery in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-039",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank transaction confirmations",
    message: "Rs 450.00 Spotify subscription auto-debit successfully processed on ICICI Bank A/C XX9012 under e-mandate.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Auto-debit in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-040",
    label: "legitimate",
    language: "hinglish",
    domain: "University/college notifications",
    message: "DU Academic Notice: Semester exam admit cards student portal du.ac.in pe upload ho gaye hain.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "College admit card in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-041",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "HDFC Bank: Monthly e-statement registered email pe send ho gaya hai. Password aapka DOB aur PAN hai.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "E-statement in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-042",
    label: "legitimate",
    language: "hinglish",
    domain: "Mobile recharge confirmations",
    message: "Vi: Aapka pack 2 din me expire hoga. Unlimited calls ke liye vi.app se recharge kare.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Vi pack expiry in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-043",
    label: "legitimate",
    language: "hinglish",
    domain: "Electricity bills",
    message: "Electricity bill of Rs 1,450 successfully received for Consumer #8920194. Receipt #UP892019.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Bill receipt in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-044",
    label: "legitimate",
    language: "hinglish",
    domain: "Transit/toll payments",
    message: "MakeMyTrip: Goa hotel booking confirm ho gayi hai. Booking ID: MMT8920194. Check-in 05 March.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Hotel booking in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-045",
    label: "legitimate",
    language: "hinglish",
    domain: "Government informational messages",
    message: "EPFO: PF account me January 2026 ka contribution Rs 3,600 credit ho gaya hai. Balance: Rs 2,45,900.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "EPF credit in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-046",
    label: "legitimate",
    language: "hinglish",
    domain: "Login notifications",
    message: "Your OTP for Uber ride confirmation is 8920. Share only with driver after sitting in cab.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Uber ride OTP in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-047",
    label: "legitimate",
    language: "hinglish",
    domain: "Stock broking/demat",
    message: "Groww: Mutual fund monthly SIP of Rs 5,000 successfully processed for Parag Parikh Flexi Cap Fund.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Mutual fund SIP in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-048",
    label: "legitimate",
    language: "hinglish",
    domain: "School/education",
    message: "School Alert: PTM will be held tomorrow from 9 AM to 12 PM in respective classrooms.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "School PTM in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-049",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank transaction confirmations",
    message: "Cheque #000184 of Rs 25,000 successfully cleared from your Kotak Bank A/C XX9012.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Cheque clearance in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-050",
    label: "legitimate",
    language: "hinglish",
    domain: "Municipal service",
    message: "BMC Water Supply: Maintenance work ke chalte kal subah 10 baje se 2 baje tak water supply band rahegi.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Water maintenance in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-051",
    label: "legitimate",
    language: "hinglish",
    domain: "Hospital appointment",
    message: "Max Hospital: Blood test report ready hai. Online maxhealthcare.in pe login karke download kare.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Medical report in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-052",
    label: "legitimate",
    language: "hinglish",
    domain: "E-commerce order scam",
    message: "Myntra: Exchange pickup scheduled for tomorrow between 2 PM to 5 PM. Item tag ke sath ready rakhe.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Exchange pickup in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-053",
    label: "legitimate",
    language: "hinglish",
    domain: "Telecom service notice",
    message: "JioFiber: Monthly invoice of Rs 824 generated for connection #022-39019284. Due date: 05-Mar-2026.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Broadband invoice in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-054",
    label: "legitimate",
    language: "hinglish",
    domain: "Government informational messages",
    message: "National Health Authority: ABHA health card bilkul free banta hai. Kisi ko koi paise na de.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "ABHA advisory in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-055",
    label: "legitimate",
    language: "hinglish",
    domain: "Bank account/KYC",
    message: "Canara Bank: New contactless debit card dispatched via Speed Post tracking #ED892019482IN.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Debit card dispatch in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-056",
    label: "legitimate",
    language: "hinglish",
    domain: "Donation receipt",
    message: "CRY Donation: Rs 1,000 donation receipt #CRY892019 email pe bhej di gayi hai. 80G tax benefit available.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Donation receipt in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-057",
    label: "legitimate",
    language: "hinglish",
    domain: "Workplace notifications",
    message: "HR Update: FY 2025-26 ke liye investment proof submit karne ki last date 10th March hai.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "HR tax proof in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-058",
    label: "legitimate",
    language: "hinglish",
    domain: "Transit/toll payments",
    message: "Mumbai Metro: Smart card recharge of Rs 300 successful via UPI. AFC gate pe tap kare update ke liye.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Metro recharge in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-059",
    label: "legitimate",
    language: "hinglish",
    domain: "Banking security advisory",
    message: "RBI Alert: Kabhi bhi apna UPI PIN kisi ko payment receive karne ke liye na dale. Savdhaan rahe.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "RBI financial literacy in Hinglish."
  },
  {
    sampleId: "HIN-LEGIT-060",
    label: "legitimate",
    language: "hinglish",
    domain: "Login notifications",
    message: "Aadhaar eKYC authentication OTP is 892014. Generated by UIDAI for bank verification. Valid for 10 mins.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Aadhaar eKYC OTP in Hinglish."
  }
];

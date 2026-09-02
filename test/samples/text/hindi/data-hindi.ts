import type { BenchmarkSample } from "../../../evaluation/types";

export const hindiScams: BenchmarkSample[] = [
  // 1. Bank account/KYC
  {
    sampleId: "HI-SCAM-001",
    label: "scam",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "प्रिय एसबीआई ग्राहक, आपका खाता आज रात 10 बजे ब्लॉक कर दिया जाएगा क्योंकि आपका पैन कार्ड लिंक नहीं है। तुरंत पैन अपडेट करने के लिए इस लिंक पर क्लिक करें: https://sbi-pan-kyc.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Urgency", "Account block threat", "Phishing link"],
    difficulty: "easy",
    notes: "SBI PAN KYC threat in Hindi."
  },
  {
    sampleId: "HI-SCAM-002",
    label: "scam",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "पीएनबी बैंक अलर्ट: आपके खाते से संदिग्ध लेनदेन रोकने के लिए पुनः सत्यापन अनिवार्य है। यदि आपने यह नहीं किया है, तो तुरंत अपने 16 अंकों का एटीएम कार्ड नंबर और पिन हमारे सहायता अधिकारी 9876543210 को भेजें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests ATM PIN", "Impersonation"],
    difficulty: "easy",
    notes: "Asking for ATM PIN and card number over SMS."
  },
  {
    sampleId: "HI-SCAM-003",
    label: "scam",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "बैंक ऑफ बड़ौदा: आरबीआई के नए नियमों के तहत आपके खाते का बायोमेट्रिक अपडेशन बाकी है। बैंक शाखा जाने से बचने के लिए हमारा सहायता ऐप डाउनलोड करें: http://bob-support-app.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Malware download lure", "Suspicious link"],
    difficulty: "medium",
    notes: "Malware APK disguised as bank biometric update."
  },

  // 2. UPI/payment fraud
  {
    sampleId: "HI-SCAM-004",
    label: "scam",
    language: "hindi",
    domain: "UPI/payment fraud",
    message: "आपको फोनपे पर 5,000 रुपये का कैशबैक मिला है। पैसे सीधे बैंक खाते में जमा करने के लिए लिंक खोलें और अपना यूपीआई पिन दर्ज करें: https://phonepe-reward-claim.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests UPI PIN to receive money", "Cashback lure"],
    difficulty: "easy",
    notes: "Entering UPI PIN to receive money."
  },
  {
    sampleId: "HI-SCAM-005",
    label: "scam",
    language: "hindi",
    domain: "UPI/payment fraud",
    message: "ओएलएक्स क्रेता: मैंने आपके सामान के लिए 12,000 रुपये भेज दिए हैं। राशि प्राप्त करने के लिए प्राप्त क्यूआर कोड को स्कैन करें और पुष्टि करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["QR code fraud", "Reverse payment scam"],
    difficulty: "easy",
    notes: "OLX QR code reverse payment scam."
  },

  // 3. Electricity/gas bill scam
  {
    sampleId: "HI-SCAM-006",
    label: "scam",
    language: "hindi",
    domain: "Electricity/gas bill scam",
    message: "प्रिय उपभोक्ता, आज रात 9:30 बजे बिजली कार्यालय से आपकी बिजली काट दी जाएगी क्योंकि आपका पिछले महीने का बिल अपडेट नहीं हुआ है। कृपया तुरंत हमारे बिजली अधिकारी 9830219482 से संपर्क करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Utility disconnection threat", "Direct phone number", "Urgency"],
    difficulty: "easy",
    notes: "Classic Hindi electricity disconnection scam."
  },
  {
    sampleId: "HI-SCAM-007",
    label: "scam",
    language: "hindi",
    domain: "Electricity/gas bill scam",
    message: "उर्जा विभाग सूचना: आपका गैस कनेक्शन सब्सिडी सत्यापन न होने के कारण कल सुबह से बंद कर दिया जाएगा। पुनः चालू रखने के लिए 150 रुपये का शुल्क इस यूपीआई gas-subsidy@okaxis पर तुरंत भुगतान करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Gas disconnection threat", "Personal UPI payment"],
    difficulty: "medium",
    notes: "Gas subsidy and disconnection threat."
  },

  // 4. Digital arrest scam / Police threat
  {
    sampleId: "HI-SCAM-008",
    label: "scam",
    language: "hindi",
    domain: "Digital arrest scam",
    message: "सीबीआई और मुंबई साइबर क्राइम शाखा: आपके आधार कार्ड से 16 फर्जी बैंक खाते और नशीली दवाओं का पार्सल जुड़ा पाया गया है। आपको डिजिटल अरेस्ट के तहत रखा गया है। वीडियो कॉल से हटने पर तुरंत पुलिस घर पहुंचेगी।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "Extortion", "Law enforcement impersonation"],
    difficulty: "easy",
    notes: "Hindi digital arrest scam script."
  },
  {
    sampleId: "HI-SCAM-009",
    label: "scam",
    language: "hindi",
    domain: "Police/legal threat",
    message: "दिल्ली पुलिस साइबर सेल: आपके फोन नंबर से अश्लील सामग्री प्रसारित करने का गैर-जमानती वारंट जारी हुआ है। गिरफ्तारी से बचने के लिए जांच अधिकारी शर्मा जी से 9810293847 पर 1 घंटे के अंदर बात करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Arrest warrant threat", "Urgency"],
    difficulty: "medium",
    notes: "Police cybercell phone extortion."
  },

  // 5. Lottery/prize
  {
    sampleId: "HI-SCAM-010",
    label: "scam",
    language: "hindi",
    domain: "Lottery/prize",
    message: "केबीसी लकी ड्रा 2026: बधाई हो! आपके सिम कार्ड नंबर ने 25 लाख रुपये की लॉटरी जीती है। अपनी इनामी राशि का चेक प्राप्त करने के लिए मैनेजर विजय कुमार से व्हाट्सएप 9748291039 पर संपर्क करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Lottery scam", "KBC impersonation"],
    difficulty: "easy",
    notes: "KBC Hindi lottery scam."
  },

  // 6. Job/task scam
  {
    sampleId: "HI-SCAM-011",
    label: "scam",
    language: "hindi",
    domain: "Job/task scam",
    message: "घर बैठे पार्ट-टाइम काम: यूट्यूब वीडियो लाइक करें और प्रतिदिन 2000 से 5000 रुपये कमाएं। कोई पूर्व अनुभव नहीं चाहिए। तुरंत काम शुरू करने के लिए टेलीग्राम पर संपर्क करें: @hindi_parttime_job",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Prepaid task scam", "Unrealistic earnings", "Telegram handle"],
    difficulty: "easy",
    notes: "YouTube like task scam in Hindi."
  },
  {
    sampleId: "HI-SCAM-012",
    label: "scam",
    language: "hindi",
    domain: "Job/task scam",
    message: "घर बैठे पैकिंग का काम: पेंसिल और मोमबत्ती पैकिंग करके हर महीने 35,000 रुपये कमाएं। सामान कंपनी आपके घर पहुंचाएगी। रजिस्ट्रेशन फीस 999 रुपये जमा करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Advance fee job", "Packing scam"],
    difficulty: "easy",
    notes: "Work from home packing advance fee fraud."
  },

  // 7. Loan scam
  {
    sampleId: "HI-SCAM-013",
    label: "scam",
    language: "hindi",
    domain: "Loan scam",
    message: "प्रधानमंत्री जन धन ऋण योजना: बिना गारंटी 5 लाख रुपये का आसान लोन 1% ब्याज दर पर मंजूर। फाइल चार्ज और बीमा के लिए 1,999 रुपये भेजें और 15 मिनट में पैसा पाएं: 9820194820 पर कॉल करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Advance fee loan", "Government scheme impersonation"],
    difficulty: "easy",
    notes: "Advance fee loan pretending to be PM scheme."
  },

  // 8. SIM deactivation
  {
    sampleId: "HI-SCAM-014",
    label: "scam",
    language: "hindi",
    domain: "SIM deactivation",
    message: "एयरटेल आवश्यक सूचना: आपका सिम सत्यापन अधूरा है। आज शाम 7 बजे आपका सिम ब्लॉक कर दिया जाएगा। सिम चालू रखने के लिए तुरंत 9102938472 पर कॉल करके ई-केवाईसी पूरा करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM deactivation threat", "Urgency"],
    difficulty: "easy",
    notes: "Telecom SIM block threat."
  },

  // 9. Fake government benefit/subsidy
  {
    sampleId: "HI-SCAM-015",
    label: "scam",
    language: "hindi",
    domain: "Fake government benefit/subsidy",
    message: "पीएम किसान सम्मान निधि: आपकी 17वीं किस्त के 2,000 रुपये बैंक खाता लिंक न होने के कारण रोक दिए गए हैं। किस्त तुरंत प्राप्त करने के लिए आधार सत्यापन करें: https://pmkisan-gov-portal.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Govt subsidy lure", "Fake portal"],
    difficulty: "medium",
    notes: "PM Kisan installment phishing."
  },
  {
    sampleId: "HI-SCAM-016",
    label: "scam",
    language: "hindi",
    domain: "Fake government benefit/subsidy",
    message: "निशुल्क सोलर पैनल योजना 2026: भारत सरकार सभी ग्रामीण और शहरी घरों को मुफ्त सोलर पैनल दे रही है। आवेदन करने की अंतिम तिथि आज है। तुरंत फॉर्म भरें: http://free-solar-yojana.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Free solar scheme lure", "Urgency", "Suspicious link"],
    difficulty: "easy",
    notes: "Free solar panel viral lure."
  },

  // 10. Courier/parcel scam
  {
    sampleId: "HI-SCAM-017",
    label: "scam",
    language: "hindi",
    domain: "Courier/parcel scam",
    message: "भारतीय डाक सूचना: आपका स्पीड पोस्ट पार्सल पता अधूरा होने के कारण डाकघर में रुका हुआ है। पता अपडेट करें और 45 रुपये का पुनः वितरण शुल्क भरें: https://indiapost-update.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["India post phishing", "Small fee card trap"],
    difficulty: "medium",
    notes: "India Post address update phishing."
  },

  // 11. Aadhaar/PAN/document update
  {
    sampleId: "HI-SCAM-018",
    label: "scam",
    language: "hindi",
    domain: "Aadhaar/PAN/document update",
    message: "आधार कार्ड सूचना: सुप्रीम कोर्ट के आदेशानुसार सभी नागरिकों को अपने फिंगरप्रिंट और चेहरे का डेटा ऑनलाइन सत्यापित करना होगा अन्यथा आधार अमान्य हो जाएगा: http://uidai-aadhar-auth.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake legal mandate", "Aadhaar phishing"],
    difficulty: "medium",
    notes: "Fake Aadhaar biometric online update."
  },

  // 12. Card/payment reversal
  {
    sampleId: "HI-SCAM-019",
    label: "scam",
    language: "hindi",
    domain: "Card/payment reversal",
    message: "सावधान: आपके क्रेडिट कार्ड से 49,999 रुपये का लेनदेन फ्लिपकार्ट पर किया गया है। यदि यह आपने नहीं किया है, तो लेनदेन निरस्त करने के लिए 10 मिनट के अंदर 9849201948 पर संपर्क करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["False transaction panic", "Direct mobile number", "Urgency"],
    difficulty: "medium",
    notes: "Panic inducing transaction cancellation."
  },

  // 13. Investment/crypto scam
  {
    sampleId: "HI-SCAM-020",
    label: "scam",
    language: "hindi",
    domain: "Investment/crypto scam",
    message: "शेयर बाजार दैनिक मुनाफा: हमारे वीआईपी व्हाट्सएप ग्रुप से जुड़ें और रोजाना 20% निश्चित रिटर्न पाएं। सेबी प्रमाणित विशेषज्ञ मार्गदर्शन। ग्रुप लिंक: https://chat.whatsapp.com/inv/hindiWealthGroup",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Guaranteed return", "WhatsApp investment group"],
    difficulty: "medium",
    notes: "Stock market tips fraud."
  },

  // 14. Fake traffic challan/fine
  {
    sampleId: "HI-SCAM-021",
    label: "scam",
    language: "hindi",
    domain: "Fake traffic challan/fine",
    message: "यातायात पुलिस चालान: आपके वाहन पर 1,500 रुपये का लंबित रेड लाइट चालान है। कोर्ट में पेशी से बचने के लिए 24 घंटे में भुगतान करें: https://echallan-pay-traffic.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Traffic fine threat", "Court summons threat"],
    difficulty: "medium",
    notes: "Traffic police e-challan phishing in Hindi."
  },

  // 15. Fake customer support
  {
    sampleId: "HI-SCAM-022",
    label: "scam",
    language: "hindi",
    domain: "Fake customer support",
    message: "गूगल पे ग्राहक सहायता: आपके रुके हुए पैसे वापस पाने के लिए हमारे सहायता केंद्र से जुड़ें। हमारे अधिकारी के निर्देशानुसार AnyDesk ऐप इंस्टॉल करके कोड बताएं।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Remote access tool", "Fake customer support"],
    difficulty: "easy",
    notes: "AnyDesk screen sharing banking scam."
  },

  // 16. Mobile recharge fraud
  {
    sampleId: "HI-SCAM-023",
    label: "scam",
    language: "hindi",
    domain: "Mobile recharge fraud",
    message: "मुफ्त रिचार्ज ऑफर: राम मंदिर वर्षगांठ के उपलक्ष्य में सभी भारतीय उपयोगकर्ताओं को 3 महीने का मुफ्त 5G रिचार्ज दिया जा रहा है। अपना नंबर यहां दर्ज करें: https://free-rammandir-recharge.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Viral bait recharge", "Suspicious link"],
    difficulty: "easy",
    notes: "Religious/event viral free recharge bait."
  },

  // 17. Remote-access/support scam
  {
    sampleId: "HI-SCAM-024",
    label: "scam",
    language: "hindi",
    domain: "Remote-access/support scam",
    message: "एसबीआई योनो सुरक्षा अपडेट: आपके मोबाइल बैंकिंग में तकनीकी खराबी आ गई है। इसे ठीक करने के लिए हमारे बैंक इंजीनियर को क्विकसपोर्ट आईडी प्रदान करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Remote screen sharing", "Bank impersonation"],
    difficulty: "medium",
    notes: "QuickSupport remote access banking fraud."
  },

  // 18. Fake refund
  {
    sampleId: "HI-SCAM-025",
    label: "scam",
    language: "hindi",
    domain: "Fake refund",
    message: "आयकर रिफंड सूचना: वित्तीय वर्ष 2024-25 के लिए आपका 18,450 रुपये का रिफंड स्वीकृत हो गया है। राशि अपने बैंक खाते में जमा करने के लिए विवरण सत्यापित करें: http://incometax-refund-verify.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Tax refund lure", "Phishing link"],
    difficulty: "medium",
    notes: "Income tax refund phishing in Hindi."
  },

  // Continue with Hindi scams across categories 26-60
  {
    sampleId: "HI-SCAM-026",
    label: "scam",
    language: "hindi",
    domain: "Insurance scam",
    message: "भारतीय जीवन बीमा निगम (LIC): आपकी बंद पड़ी पॉलिसी पर 2,80,000 रुपये का बोनस फंड बकाया है। यह राशि सीधे बैंक खाते में पाने के लिए 8,500 रुपये सरकारी टैक्स जमा करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Insurance bonus advance fee", "LIC impersonation"],
    difficulty: "medium",
    notes: "Lapsed insurance policy bonus release scam."
  },
  {
    sampleId: "HI-SCAM-027",
    label: "scam",
    language: "hindi",
    domain: "Fake employment offer",
    message: "रेलवे भर्ती बोर्ड सूचना: आपका चयन टीटीई (TTE) पद पर हो गया है। नियुक्ति पत्र डाउनलोड करने और वर्दी शुल्क के लिए 2,500 रुपये जमा करें: https://rrb-recruitment-portal.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Job advance fee", "Railway impersonation"],
    difficulty: "medium",
    notes: "Railway recruitment advance fee scam."
  },
  {
    sampleId: "HI-SCAM-028",
    label: "scam",
    language: "hindi",
    domain: "Scholarship/education scam",
    message: "मेधावी छात्रवृत्ति 2026: आपके बच्चे को 50,000 रुपये की उच्च शिक्षा छात्रवृत्ति स्वीकृत हुई है। छात्रवृत्ति प्रमाण पत्र और राशि पाने के लिए 499 रुपये शुल्क भेजें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Scholarship advance fee"],
    difficulty: "medium",
    notes: "Student scholarship registration fee scam."
  },
  {
    sampleId: "HI-SCAM-029",
    label: "scam",
    language: "hindi",
    domain: "E-commerce order scam",
    message: "धमाका सेल: केवल 999 रुपये में 5G स्मार्टफोन और स्मार्टवॉच कॉम्बो। सीमित स्टॉक उपलब्ध है। अभी ऑर्डर करें: https://super-festive-deals.store",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic price lure", "Fake store"],
    difficulty: "easy",
    notes: "Fake e-commerce smartphone deal."
  },
  {
    sampleId: "HI-SCAM-030",
    label: "scam",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "प्रिय ग्राहक, आपका बैंक खाता निष्क्रिय कर दिया गया है। पुनः सक्रिय करने के लिए अपना आधार नंबर और एसएमएस पर आया ओटीपी इस नंबर 9839201948 पर भेजें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests OTP", "Account inactive threat"],
    difficulty: "easy",
    notes: "Direct request for OTP and Aadhaar via SMS."
  },
  {
    sampleId: "HI-SCAM-031",
    label: "scam",
    language: "hindi",
    domain: "Electricity/gas bill scam",
    message: "बिजली बिल भुगतान नहीं हुआ है। तुरंत 9820194820 पर कॉल करें अन्यथा आज शाम कनेक्शन कट जाएगा।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Urgency", "Power disconnection threat"],
    difficulty: "easy",
    notes: "Short electricity scam SMS."
  },
  {
    sampleId: "HI-SCAM-032",
    label: "scam",
    language: "hindi",
    domain: "Digital arrest scam",
    message: "केंद्रीय जांच ब्यूरो (CBI) सूचना: आपके नाम पर अवैध मनी लॉन्ड्रिंग का मामला दर्ज किया गया है। सुप्रीम कोर्ट की वर्चुअल कोर्ट में पेश होने के लिए तुरंत लिंक पर जुड़ें: https://cbi-virtual-court.in/room",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "CBI impersonation"],
    difficulty: "hard",
    notes: "CBI virtual court digital arrest."
  },
  {
    sampleId: "HI-SCAM-033",
    label: "scam",
    language: "hindi",
    domain: "UPI/payment fraud",
    message: "गूगल पे पर 3,500 रुपये प्राप्त करने के लिए 'पेमेंट स्वीकार करें' बटन दबाएं और अपना 4 अंकों का गुप्त यूपीआई पिन डालें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests UPI PIN to receive money"],
    difficulty: "easy",
    notes: "Entering PIN to receive funds."
  },
  {
    sampleId: "HI-SCAM-034",
    label: "scam",
    language: "hindi",
    domain: "Job/task scam",
    message: "घर बैठे होटल रेटिंग का काम करें। 1 घंटे में 1500 रुपये तक कमाएं। काम के लिए टेलीग्राम जॉइन करें: @hotel_rating_hindi",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Task scam", "Telegram recruiter"],
    difficulty: "easy",
    notes: "Hotel review task scam."
  },
  {
    sampleId: "HI-SCAM-035",
    label: "scam",
    language: "hindi",
    domain: "Police/legal threat",
    message: "थाना साइबर क्राइम: आपके खिलाफ अश्लील वीडियो देखने का केस दर्ज हुआ है। जेल जाने से बचने के लिए जुर्माना 5000 रुपये तुरंत इस यूपीआई police-fine@okaxis पर भरें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Extortion", "Police fine threat"],
    difficulty: "medium",
    notes: "Pornography case extortion."
  },
  {
    sampleId: "HI-SCAM-036",
    label: "scam",
    language: "hindi",
    domain: "Aadhaar/PAN/document update",
    message: "पैन कार्ड को बैंक खाते से लिंक करना अनिवार्य है वरना 10,000 रुपये का जुर्माना लगेगा। अभी लिंक करें: http://bit.ly/panLinkHindi",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Shortened URL", "Penalty threat"],
    difficulty: "easy",
    notes: "PAN link penalty threat with bit.ly."
  },
  {
    sampleId: "HI-SCAM-037",
    label: "scam",
    language: "hindi",
    domain: "SIM deactivation",
    message: "जियो ग्राहक, आपका 5G सिम वेरिफिकेशन फेल हो गया है। 2 घंटे में सेवाएं बंद हो जाएंगी। कस्टमर केयर ऑफिसर 9102938192 पर कॉल करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM block", "Direct phone number"],
    difficulty: "easy",
    notes: "Jio 5G verification block."
  },
  {
    sampleId: "HI-SCAM-038",
    label: "scam",
    language: "hindi",
    domain: "Lottery/prize",
    message: "बधाई! आपके मोबाइल नंबर ने मारुति स्विफ्ट कार जीती है। कार की डिलीवरी बुक करने के लिए 4,500 रुपये आरटीओ टैक्स तुरंत भेजें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Car prize", "Advance fee"],
    difficulty: "easy",
    notes: "Car prize advance tax scam."
  },
  {
    sampleId: "HI-SCAM-039",
    label: "scam",
    language: "hindi",
    domain: "Fake government benefit/subsidy",
    message: "महिला सम्मान योजना 2026: सभी महिलाओं को प्रतिमाह 3,000 रुपये की आर्थिक सहायता दी जा रही है। अपना नाम सूची में देखने के लिए अभी रजिस्टर करें: http://mahila-samman-yojana.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake welfare scheme", "Suspicious link"],
    difficulty: "medium",
    notes: "Women welfare scheme viral bait."
  },
  {
    sampleId: "HI-SCAM-040",
    label: "scam",
    language: "hindi",
    domain: "Loan scam",
    message: "तुरंत पर्सनल लोन 2 लाख रुपये 0% ब्याज पर बिना किसी कागजात के। 15 मिनट में स्वीकृति। प्रोसेसिंग फीस 500 रुपये जमा करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic 0% loan", "Advance fee"],
    difficulty: "easy",
    notes: "0% interest loan advance fee scam."
  },
  {
    sampleId: "HI-SCAM-041",
    label: "scam",
    language: "hindi",
    domain: "Courier/parcel scam",
    message: "डीएचएल पार्सल: आपका विदेश से आया गिफ्ट कस्टम विभाग में अटका है। कस्टम ड्यूटी 12,000 रुपये एजेंट के खाते में डालें ताकि पार्सल रिलीज हो सके।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Customs parcel scam", "Advance fee"],
    difficulty: "medium",
    notes: "Foreign gift customs duty fraud."
  },
  {
    sampleId: "HI-SCAM-042",
    label: "scam",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "आईसीआईसीआई बैंक: आपके खाते में संदिग्ध गतिविधि के कारण इंटरनेट बैंकिंग ब्लॉक है। अनब्लॉक करने के लिए ऐप डाउनलोड करें: https://icici-unblock-secure.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account blocked threat", "Phishing link"],
    difficulty: "medium",
    notes: "ICICI net banking unblock phishing."
  },
  {
    sampleId: "HI-SCAM-043",
    label: "scam",
    language: "hindi",
    domain: "Fake customer support",
    message: "पेटीएम वॉलेट सहायता: यदि आपका पैसा फंसा हुआ है तो हमारे 24 घंटे कस्टमर केयर नंबर 9840291029 पर तुरंत संपर्क करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake customer support number"],
    difficulty: "medium",
    notes: "Fake Paytm helpline number."
  },
  {
    sampleId: "HI-SCAM-044",
    label: "scam",
    language: "hindi",
    domain: "Investment/crypto scam",
    message: "क्रिप्टो कॉइन माइनिंग: प्रतिदिन 500 रुपये लगाएं और 1 महीने में 50,000 रुपये पाएं। 100% सुरक्षित और गारंटीड। ग्रुप में जुड़ें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic returns", "Crypto Ponzi"],
    difficulty: "easy",
    notes: "Crypto Ponzi scheme in Hindi."
  },
  {
    sampleId: "HI-SCAM-045",
    label: "scam",
    language: "hindi",
    domain: "E-commerce order scam",
    message: "अमेज़न लकी कस्टमर ऑफर: आपको मिला है सैमसंग टीवी 95% डिस्काउंट पर केवल 2,499 रुपये में। ऑफर केवल 30 मिनट के लिए वैध: https://amzn-festive-deal.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Unrealistic discount", "Urgency", "Fake link"],
    difficulty: "easy",
    notes: "Samsung TV 95% discount fake Amazon link."
  },
  {
    sampleId: "HI-SCAM-046",
    label: "scam",
    language: "hindi",
    domain: "Card/payment reversal",
    message: "एचडीएफसी क्रेडिट कार्ड: आपके रिवॉर्ड पॉइंट्स का मूल्य 3,500 रुपये आज रात समाप्त हो रहा है। नकद पैसे अपने खाते में पाने के लिए यहां क्लिक करें: http://hdfc-rewards-cash.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Expiring points lure", "Phishing link"],
    difficulty: "medium",
    notes: "Reward points cash redemption phishing in Hindi."
  },
  {
    sampleId: "HI-SCAM-047",
    label: "scam",
    language: "hindi",
    domain: "Generic credential phishing",
    message: "फेसबुक सुरक्षा चेतावनी: आपके खाते पर किसी अन्य डिवाइस से लॉगिन का प्रयास किया गया। अपना खाता सुरक्षित करने के लिए पासवर्ड बदलें: https://fb-security-checkpoint.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Phishing link", "Credential theft"],
    difficulty: "medium",
    notes: "Facebook security alert phishing in Hindi."
  },
  {
    sampleId: "HI-SCAM-048",
    label: "scam",
    language: "hindi",
    domain: "Job/task scam",
    message: "गूगल मैप्स पर 5 स्टार रेटिंग दें और प्रति रिव्यू 300 रुपये कमाएं। सीधे बैंक खाते में भुगतान। अभी संपर्क करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Map review task scam"],
    difficulty: "easy",
    notes: "Review task scam."
  },
  {
    sampleId: "HI-SCAM-049",
    label: "scam",
    language: "hindi",
    domain: "Electricity/gas bill scam",
    message: "उत्तर प्रदेश पावर कॉर्पोरेशन (UPPCL): आपका बिजली मीटर बिल 2450 रुपये बकाया है। लाइनमैन को लाइन काटने से रोकने के लिए तुरंत कॉल करें: 9810293847",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["UPPCL impersonation", "Power disconnection threat"],
    difficulty: "easy",
    notes: "UPPCL electricity disconnection threat."
  },
  {
    sampleId: "HI-SCAM-050",
    label: "scam",
    language: "hindi",
    domain: "Digital arrest scam",
    message: "नारकोटिक्स कंट्रोल ब्यूरो (NCB): आपके पार्सल में प्रतिबंधित दवाएं पाई गई हैं। आपके खिलाफ गिरफ्तारी वारंट जारी है। वीडियो पूछताछ में शामिल हों: https://ncb-virtual-hearing.net",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "NCB impersonation"],
    difficulty: "hard",
    notes: "NCB digital arrest video interrogation lure."
  },
  {
    sampleId: "HI-SCAM-051",
    label: "scam",
    language: "hindi",
    domain: "Fake traffic challan/fine",
    message: "ई-चालान सूचना: गाड़ी नंबर UP32AB9999 का ओवरस्पीडिंग चालान 2000 रुपये जमा नहीं हुआ। लाइसेंस रद्द होने से पहले भरें: https://parivahan-challan-up.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Traffic challan threat", "License suspension"],
    difficulty: "medium",
    notes: "E-challan payment phishing in Hindi."
  },
  {
    sampleId: "HI-SCAM-052",
    label: "scam",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "कोटक बैंक: आपका बचत खाता केवाईसी अपडेट न होने के कारण फ्रीज कर दिया गया है। 10 मिनट में अनफ्रीज करने के लिए लिंक खोलें: https://kotak-unfreeze-online.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account freeze threat", "Phishing link"],
    difficulty: "medium",
    notes: "Kotak account freeze phishing."
  },
  {
    sampleId: "HI-SCAM-053",
    label: "scam",
    language: "hindi",
    domain: "UPI/payment fraud",
    message: "फोनपे रिफंड डेस्क: आपका असफल रिचार्ज रिफंड 719 रुपये आपके यूपीआई पर भेजा जा रहा है। प्राप्त करने के लिए अपना यूपीआई पिन दर्ज करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests UPI PIN to receive refund"],
    difficulty: "easy",
    notes: "UPI refund PIN phishing."
  },
  {
    sampleId: "HI-SCAM-054",
    label: "scam",
    language: "hindi",
    domain: "Loan scam",
    message: "मुद्रा लोन योजना: 10 लाख रुपये का सरकारी व्यापार लोन मंजूर। केवल आधार कार्ड पर लोन। 2500 रुपये फाइल शुल्क तुरंत जमा करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Mudra loan advance fee"],
    difficulty: "easy",
    notes: "Mudra loan scheme advance fee."
  },
  {
    sampleId: "HI-SCAM-055",
    label: "scam",
    language: "hindi",
    domain: "WhatsApp/Telegram account takeover",
    message: "व्हाट्सएप सुरक्षा: आपके नंबर पर नए फोन में लॉगिन की कोशिश हुई। अपना खाता बचाने के लिए आया हुआ 6 अंकों का कोड तुरंत बताएं।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account takeover", "Requests verification code"],
    difficulty: "hard",
    notes: "WhatsApp registration code theft in Hindi."
  },
  {
    sampleId: "HI-SCAM-056",
    label: "scam",
    language: "hindi",
    domain: "Fake government benefit/subsidy",
    message: "फ्री सिलाई मशीन योजना: सरकार सभी महिलाओं को मुफ्त सिलाई मशीन और 15,000 रुपये की राशि दे रही है। आवेदन करने के लिए यहां फॉर्म भरें: http://free-silai-yojana.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake welfare scheme", "Viral lure"],
    difficulty: "easy",
    notes: "Free sewing machine fake welfare scheme."
  },
  {
    sampleId: "HI-SCAM-057",
    label: "scam",
    language: "hindi",
    domain: "Courier/parcel scam",
    message: "कूरियर डिलीवरी सूचना: आपका पार्सल घर पर कोई न होने के कारण वापस भेजा जा रहा है। दोबारा डिलीवरी के लिए 25 रुपये का भुगतान यहां करें: https://courier-redelivery-pay.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Redelivery fee lure", "Phishing link"],
    difficulty: "medium",
    notes: "Parcel redelivery fee phishing."
  },
  {
    sampleId: "HI-SCAM-058",
    label: "scam",
    language: "hindi",
    domain: "Fake customer support",
    message: "गूगल पे रिफंड कस्टमर केयर नंबर: यदि आपके पैसे कट गए हैं और खाते में नहीं पहुंचे तो तुरंत कॉल करें 08920194820 पर।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Fake customer helpline number"],
    difficulty: "medium",
    notes: "Fake helpline number for GPay."
  },
  {
    sampleId: "HI-SCAM-059",
    label: "scam",
    language: "hindi",
    domain: "SIM deactivation",
    message: "बीएसएनएल सूचना: आपका सिम आज रात 8 बजे बंद हो जाएगा क्योंकि बायोमेट्रिक अंगूठा नहीं लगा है। तुरंत 9402910294 पर संपर्क करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM deactivation", "Urgency"],
    difficulty: "easy",
    notes: "BSNL SIM deactivation threat in Hindi."
  },
  {
    sampleId: "HI-SCAM-060",
    label: "scam",
    language: "hindi",
    domain: "Police/legal threat",
    message: "हाईकोर्ट लीगल नोटिस: चेक बाउंस मामले में आपके खिलाफ गैर-जमानती वारंट जारी किया गया है। आज शाम 4 बजे तक वकील साहब 9830219482 से बात करके समझौता करें।",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Legal warrant threat", "Extortion"],
    difficulty: "hard",
    notes: "Cheque bounce legal notice threat in Hindi."
  }
];

export const hindiLegitimate: BenchmarkSample[] = [
  // 1. Bank transaction confirmations
  {
    sampleId: "HI-LEGIT-001",
    label: "legitimate",
    language: "hindi",
    domain: "Bank transaction confirmations",
    message: "प्रिय ग्राहक, आपके खाता संख्या XX4821 से 1,500.00 रुपये 24-02-2026 को एटीएम से निकाले गए हैं। उपलब्ध शेष राशि: 18,420.00 रुपये। यदि यह आपने नहीं किया है तो 1800112211 पर कॉल करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Authentic SBI Hindi ATM withdrawal alert."
  },
  {
    sampleId: "HI-LEGIT-002",
    label: "legitimate",
    language: "hindi",
    domain: "Bank transaction confirmations",
    message: "आपके पीएनबी खाते XX8910 में वेतन के रूप में 42,000.00 रुपये एनएसीएच (NACH) के माध्यम से जमा किए गए हैं। कुल शेष राशि: 54,200.00 रुपये।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "PNB salary credit alert in Hindi."
  },

  // 2. UPI payment confirmations
  {
    sampleId: "HI-LEGIT-003",
    label: "legitimate",
    language: "hindi",
    domain: "UPI payment confirmations",
    message: "फोनपे: आपके खाते से 250.00 रुपये का भुगतान शर्मा किराना स्टोर को सफलतापूर्वक कर दिया गया है। यूपीआई संदर्भ संख्या 604928194021.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "PhonePe merchant payment confirmation in Hindi."
  },
  {
    sampleId: "HI-LEGIT-004",
    label: "legitimate",
    language: "hindi",
    domain: "UPI payment confirmations",
    message: "गूगल पे: राहुल वर्मा से 1,200.00 रुपये आपके बैंक ऑफ बड़ौदा खाते XX9012 में प्राप्त हुए।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Google Pay money received notification in Hindi."
  },

  // 3. Train/flight confirmations
  {
    sampleId: "HI-LEGIT-005",
    label: "legitimate",
    language: "hindi",
    domain: "Train/flight confirmations",
    message: "आईआरसीटीसी (IRCTC) पीएनआर: 2849102848, गाड़ी संख्या: 12418 / प्रयागराज एक्सप्रेस, यात्रा तिथि: 28-फरवरी-2026, श्रेणी: 3A, कोच: B2, बर्थ: 35 (लोअर)। शुभ यात्रा।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official IRCTC train ticket reservation confirmation in Hindi."
  },

  // 4. Utility bills & recharges
  {
    sampleId: "HI-LEGIT-006",
    label: "legitimate",
    language: "hindi",
    domain: "Electricity bills",
    message: "उत्तर प्रदेश पावर कॉर्पोरेशन: उपभोक्ता संख्या 1002938472 का माह फरवरी 2026 का बिल 1,420.00 रुपये है। देय तिथि 05-मार्च-2026 है। ऑनलाइन भुगतान uppcl.org पर करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official UPPCL electricity bill in Hindi."
  },
  {
    sampleId: "HI-LEGIT-007",
    label: "legitimate",
    language: "hindi",
    domain: "Mobile recharge confirmations",
    message: "जियो: 299 रुपये का रिचार्ज आपके नंबर 9820194820 पर सफलतापूर्वक सक्रिय हो गया है। 2GB प्रतिदिन डेटा और असीमित कॉल्स 28 दिनों के लिए वैध।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Jio Hindi recharge confirmation."
  },
  {
    sampleId: "HI-LEGIT-008",
    label: "legitimate",
    language: "hindi",
    domain: "LPG Gas booking",
    message: "इंडेन गैस: आपका 14.2 किग्रा एलपीजी सिलेंडर बुक हो गया है। बुकिंग संदर्भ #89201948। भुगतान राशि: 853.00 रुपये। डिलीवरी 2 दिनों में की जाएगी।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Indane LPG booking alert in Hindi."
  },

  // 5. Delivery & order updates
  {
    sampleId: "HI-LEGIT-009",
    label: "legitimate",
    language: "hindi",
    domain: "Delivery updates",
    message: "फ्लिपकार्ट: आपका ऑर्डर #OD8920194 डिलीवरी एजेंट द्वारा पहुंचा दिया गया है। हमारे साथ खरीदारी करने के लिए धन्यवाद।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Flipkart delivery completion in Hindi."
  },
  {
    sampleId: "HI-LEGIT-010",
    label: "legitimate",
    language: "hindi",
    domain: "Delivery updates",
    message: "अमेज़न: आपका पार्सल आज आपके पते पर पहुंचेगा। डिलीवरी एजेंट को केवल सामान प्राप्त करते समय यह सुरक्षा कोड 4829 बताएं।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Amazon Hindi delivery OTP."
  },

  // 6. Government informational & educational messages
  {
    sampleId: "HI-LEGIT-011",
    label: "legitimate",
    language: "hindi",
    domain: "Government informational messages",
    message: "भारत निर्वाचन आयोग: मतदाता सूची में अपना नाम देखने और मतदान केंद्र जानने के लिए voters.eci.gov.in पर जाएं अथवा 1950 पर कॉल करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Election Commission voter information in Hindi."
  },
  {
    sampleId: "HI-LEGIT-012",
    label: "legitimate",
    language: "hindi",
    domain: "Government informational messages",
    message: "संचार साथी (दूरसंचार विभाग): अपना खोया या चोरी हुआ मोबाइल फोन ब्लॉक करने के लिए आधिकारिक पोर्टल sancharsaathi.gov.in का उपयोग करें। साइबर ठगों से सावधान रहें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "DoT Sanchar Saathi advisory in Hindi."
  },
  {
    sampleId: "HI-LEGIT-013",
    label: "legitimate",
    language: "hindi",
    domain: "Government informational messages",
    message: "ईपीएफओ (EPFO): आपके पीएफ खाते में माह जनवरी 2026 के लिए नियोक्ता और कर्मचारी का अंशदान 3,600 रुपये जमा कर दिया गया है। कुल शेष राशि: 1,84,200 रुपये।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "EPF deposit update in Hindi."
  },

  // 7. Security advisories & OTPs
  {
    sampleId: "HI-LEGIT-014",
    label: "legitimate",
    language: "hindi",
    domain: "Login notifications",
    message: "492018 आपका नेटबैंकिंग लॉगिन ओटीपी है। यह 5 मिनट के लिए वैध है। सुरक्षा के लिए यह ओटीपी किसी के साथ साझा न करें, बैंक कभी ओटीपी नहीं मांगता।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Banking OTP in Hindi with security warning."
  },
  {
    sampleId: "HI-LEGIT-015",
    label: "legitimate",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "सुरक्षा चेतावनी: बैंक ऑफ इंडिया कभी भी आपसे फोन या एसएमएस पर आपका एटीएम पिन, पासवर्ड या सीवीवी नहीं मांगता है। सतर्क रहें और सुरक्षित रहें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Legitimate bank security advisory in Hindi containing suspicious keywords."
  },

  // Continue with Hindi legitimate samples 16 to 60
  {
    sampleId: "HI-LEGIT-016",
    label: "legitimate",
    language: "hindi",
    domain: "FASTag toll payments",
    message: "फास्टैग अलर्ट: आपके वाहन UP32CD1234 से टोल प्लाजा पर 65.00 रुपये काटे गए। शेष राशि: 345.00 रुपये।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "FASTag toll debit in Hindi."
  },
  {
    sampleId: "HI-LEGIT-017",
    label: "legitimate",
    language: "hindi",
    domain: "Hospital appointment",
    message: "एम्स नई दिल्ली: डॉ. राजेश कुमार के साथ आपकी ओपीडी अपॉइंटमेंट 27-फरवरी-2026 को सुबह 10:00 बजे कमरा संख्या 14 में पुष्ट है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "AIIMS hospital appointment in Hindi."
  },
  {
    sampleId: "HI-LEGIT-018",
    label: "legitimate",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "भारतीय स्टेट बैंक: आपके बचत खाते XX3902 में तिमाही ब्याज के 340.00 रुपये जमा किए गए हैं।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Savings account interest credit in Hindi."
  },
  {
    sampleId: "HI-LEGIT-019",
    label: "legitimate",
    language: "hindi",
    domain: "Tax acknowledgements",
    message: "आयकर विभाग: वित्तीय वर्ष 2024-25 का आपका आयकर रिटर्न सफलतापूर्वक दाखिल और सत्यापित हो गया है। पावती संख्या #294819204820.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "ITR acknowledgement in Hindi."
  },
  {
    sampleId: "HI-LEGIT-020",
    label: "legitimate",
    language: "hindi",
    domain: "Mutual funds/investments",
    message: "एसबीआई म्यूचुअल फंड: आपकी 2,000 रुपये की मासिक एसआईपी सफलतापूर्वक प्रोसेस हो गई है। फोलियो संख्या #49201948.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Mutual fund SIP confirmation in Hindi."
  },
  {
    sampleId: "HI-LEGIT-021",
    label: "legitimate",
    language: "hindi",
    domain: "Insurance reminders",
    message: "एलआईसी (LIC): आपकी पॉलिसी संख्या 192019482 की प्रीमियम राशि 3,450 रुपये 15-मार्च-2026 तक देय है। ऑनलाइन भुगतान licindia.in पर करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "LIC premium reminder in Hindi."
  },
  {
    sampleId: "HI-LEGIT-022",
    label: "legitimate",
    language: "hindi",
    domain: "School/education",
    message: "केंद्रीय विद्यालय: कक्षा 10वीं की प्री-बोर्ड परीक्षाएं 2 मार्च से प्रारंभ होंगी। विस्तृत समय-सारिणी विद्यालय सूचना पटल पर उपलब्ध है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "School exam schedule notice in Hindi."
  },
  {
    sampleId: "HI-LEGIT-023",
    label: "legitimate",
    language: "hindi",
    domain: "Bank maintenance notices",
    message: "पीएनबी सूचना: सिस्टम अपग्रेड के कारण 1 मार्च रात 1 बजे से 3 बजे तक यूपीआई सेवाएं अस्थायी रूप से बाधित रहेंगी। असुविधा के लिए खेद है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "PNB maintenance alert in Hindi."
  },
  {
    sampleId: "HI-LEGIT-024",
    label: "legitimate",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "रिजर्व बैंक के निर्देशानुसार, यदि आपके पते या पहचान में कोई बदलाव नहीं हुआ है तो शाखा जाए बिना री-केवाईसी की आवश्यकता नहीं है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "RBI re-KYC informational notice in Hindi."
  },
  {
    sampleId: "HI-LEGIT-025",
    label: "legitimate",
    language: "hindi",
    domain: "Delivery updates",
    message: "ज़ोमैटो: आपके खाने का ऑर्डर डिलीवरी पार्टनर द्वारा पिक कर लिया गया है और 15 मिनट में आपके पते पर पहुंच जाएगा।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Zomato food delivery notification in Hindi."
  },
  {
    sampleId: "HI-LEGIT-026",
    label: "legitimate",
    language: "hindi",
    domain: "Card transaction notifications",
    message: "अलर्ट: आपके एचडीएफसी डेबिट कार्ड XX1029 से 899.00 रुपये का भुगतान बुकमाईशो पर किया गया है। यदि यह आपने नहीं किया है तो तुरंत बैंक को सूचित करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Debit card transaction alert in Hindi."
  },
  {
    sampleId: "HI-LEGIT-027",
    label: "legitimate",
    language: "hindi",
    domain: "Government informational messages",
    message: "आयुष्मान भारत योजना: 5 लाख रुपये तक का मुफ्त इलाज पाने के लिए अपना आयुष्मान कार्ड नजदीकी जन सेवा केंद्र से बनवाएं।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Ayushman Bharat scheme information in Hindi."
  },
  {
    sampleId: "HI-LEGIT-028",
    label: "legitimate",
    language: "hindi",
    domain: "Telecom service notice",
    message: "एयरटेल: आपने अपने दैनिक 1.5GB डेटा का 100% उपयोग कर लिया है। अतिरिक्त डेटा पैक के लिए एयरटेल थैंक्स ऐप पर जाएं।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Airtel data limit notification in Hindi."
  },
  {
    sampleId: "HI-LEGIT-029",
    label: "legitimate",
    language: "hindi",
    domain: "Municipal service",
    message: "नगर निगम लखनऊ: हाउस टैक्स बिल 2025-26 के समय पर भुगतान पर 10% की छूट 31 मार्च तक उपलब्ध है। ऑनलाइन पोर्टल lmc.up.nic.in पर भुगतान करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Municipal house tax discount notice in Hindi."
  },
  {
    sampleId: "HI-LEGIT-030",
    label: "legitimate",
    language: "hindi",
    domain: "Bank transaction confirmations",
    message: "प्रिय ग्राहक, आपके खाते XX9012 से एनईएफटी द्वारा 10,000.00 रुपये विजय कुमार के खाते में सफलतापूर्वक स्थानांतरित कर दिए गए हैं।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "NEFT remittance alert in Hindi."
  },
  {
    sampleId: "HI-LEGIT-031",
    label: "legitimate",
    language: "hindi",
    domain: "Login notifications",
    message: "डिजीलॉकर लॉगिन हेतु आपका ओटीपी 892019 है। यह 10 मिनट के लिए मान्य है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "DigiLocker login OTP in Hindi."
  },
  {
    sampleId: "HI-LEGIT-032",
    label: "legitimate",
    language: "hindi",
    domain: "Pharmacy/healthcare",
    message: "दवा ऑर्डर सूचना: आपका दवा ऑर्डर #892019 पैक हो गया है और कल दोपहर तक आपके पते पर पहुंचा दिया जाएगा। बिल राशि: 450 रुपये।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Pharmacy order status in Hindi."
  },
  {
    sampleId: "HI-LEGIT-033",
    label: "legitimate",
    language: "hindi",
    domain: "Vehicle service",
    message: "हीरो मोटोकॉर्प: आपकी बाइक (UP32XY4820) की सर्विस पूरी हो चुकी है। कृपया कार्यशाला से अपनी बाइक प्राप्त कर लें। कुल बिल: 650.00 रुपये।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Bike servicing notice in Hindi."
  },
  {
    sampleId: "HI-LEGIT-034",
    label: "legitimate",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "बैंक सूचना: आपका नया चेकबुक स्पीड पोस्ट द्वारा भेज दिया गया है। ट्रैकिंग संख्या: ED892019482IN.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Cheque book dispatch in Hindi."
  },
  {
    sampleId: "HI-LEGIT-035",
    label: "legitimate",
    language: "hindi",
    domain: "Account security notifications",
    message: "आवश्यक सुरक्षा सूचना: गलत एटीएम पिन तीन बार डालने के कारण आपका कार्ड आज के लिए अस्थायी रूप से ब्लॉक हो गया है। यह कल स्वतः चालू हो जाएगा।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Contains 'गलत एटीएम पिन' and 'ब्लॉक' but is a legitimate bank security alert."
  },
  {
    sampleId: "HI-LEGIT-036",
    label: "legitimate",
    language: "hindi",
    domain: "Government informational messages",
    message: "कृषि विभाग: गेहूं की फसल में सिंचाई और उर्वरक प्रबंधन की सलाह हेतु किसान कॉल सेंटर 1800-180-1551 पर निशुल्क कॉल करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Kisan call center agricultural advisory in Hindi."
  },
  {
    sampleId: "HI-LEGIT-037",
    label: "legitimate",
    language: "hindi",
    domain: "Workplace notifications",
    message: "कार्यालय सूचना: 26 फरवरी को महाशिवरात्रि के उपलक्ष्य में कार्यालय बंद रहेगा। सभी कर्मचारियों को शुभकामनाएं।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Office holiday notice in Hindi."
  },
  {
    sampleId: "HI-LEGIT-038",
    label: "legitimate",
    language: "hindi",
    domain: "Delivery updates",
    message: "ब्लू डार्ट कूरियर: आपका पार्सल #49201948 आज आपके पते पर डिलीवरी के लिए निकल चुका है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "BlueDart out for delivery alert in Hindi."
  },
  {
    sampleId: "HI-LEGIT-039",
    label: "legitimate",
    language: "hindi",
    domain: "Bank transaction confirmations",
    message: "खाता संख्या XX4821 से 500.00 रुपये का यूपीआई ऑटो-डेबिट नेटफ्लिक्स के लिए सफलतापूर्वक कर दिया गया है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "UPI auto-debit confirmation in Hindi."
  },
  {
    sampleId: "HI-LEGIT-040",
    label: "legitimate",
    language: "hindi",
    domain: "University/college notifications",
    message: "इलाहाबाद विश्वविद्यालय: बीए द्वितीय वर्ष के परीक्षा फॉर्म भरने की अंतिम तिथि 5 मार्च 2026 तक बढ़ा दी गई है। allduniv.ac.in पर जाएं।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "University exam form extension in Hindi."
  },
  {
    sampleId: "HI-LEGIT-041",
    label: "legitimate",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "एसबीआई अलर्ट: आपका मासिक खाता विवरण (Account Statement) आपके पंजीकृत ईमेल पर भेज दिया गया है। पासवर्ड आपका जन्म वर्ष और पिन कोड है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Account e-statement delivery in Hindi."
  },
  {
    sampleId: "HI-LEGIT-042",
    label: "legitimate",
    language: "hindi",
    domain: "Mobile recharge confirmations",
    message: "बीएसएनएल: आपका टॉकटाइम बैलेंस 10 रुपये से कम है। आपातकालीन कॉल्स जारी रखने के लिए bsnl.co.in या ऐप से रिचार्ज करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "BSNL low balance alert in Hindi."
  },
  {
    sampleId: "HI-LEGIT-043",
    label: "legitimate",
    language: "hindi",
    domain: "Electricity bills",
    message: "मध्य प्रदेश विद्युत वितरण: उपभोक्ता क्रमांक 89201948 का बिल 850 रुपये सफलतापूर्वक प्राप्त हुआ। पावती संख्या #MP8920194.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Electricity bill payment receipt in Hindi."
  },
  {
    sampleId: "HI-LEGIT-044",
    label: "legitimate",
    language: "hindi",
    domain: "Transit/toll payments",
    message: "आईआरसीटीसी: आपका भोजन ऑर्डर गाड़ी संख्या 12555 में सीट 42 पर डिलीवर कर दिया गया है। खानपान का आनंद लें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "IRCTC e-catering delivery in Hindi."
  },
  {
    sampleId: "HI-LEGIT-045",
    label: "legitimate",
    language: "hindi",
    domain: "Government informational messages",
    message: "प्रधानमंत्री सुरक्षा बीमा योजना: 20 रुपये का वार्षिक प्रीमियम आपके खाते से स्वतः नवीनीकृत हो गया है। 2 लाख रुपये का दुर्घटना बीमा कवर सक्रिय है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "PMSBY renewal confirmation in Hindi."
  },
  {
    sampleId: "HI-LEGIT-046",
    label: "legitimate",
    language: "hindi",
    domain: "Login notifications",
    message: "ई-श्रम पोर्टल लॉगिन हेतु आपका ओटीपी 392019 है। यह 10 मिनट तक वैध रहेगा।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "e-Shram portal OTP in Hindi."
  },
  {
    sampleId: "HI-LEGIT-047",
    label: "legitimate",
    language: "hindi",
    domain: "Stock broking/demat",
    message: "ग्रो (Groww): आपका फंड जमा अनुरोध 5,000 रुपये सफलतापूर्वक पूरा हो गया है। ट्रेडिंग खाते में राशि उपलब्ध है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Groww trading fund deposit in Hindi."
  },
  {
    sampleId: "HI-LEGIT-048",
    label: "legitimate",
    language: "hindi",
    domain: "School/education",
    message: "डीपीएस स्कूल: कल 25 फरवरी को अभिभावक-शिक्षक बैठक (PTM) सुबह 9 बजे से 12 बजे तक आयोजित होगी। आपकी उपस्थिति अपेक्षित है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "School PTM notice in Hindi."
  },
  {
    sampleId: "HI-LEGIT-049",
    label: "legitimate",
    language: "hindi",
    domain: "Bank transaction confirmations",
    message: "बैंक ऑफ इंडिया: 2,000.00 रुपये का चेक #000184 आपके खाते XX8920 से सफलतापूर्वक क्लियर हो गया है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Cheque clearance alert in Hindi."
  },
  {
    sampleId: "HI-LEGIT-050",
    label: "legitimate",
    language: "hindi",
    domain: "Municipal service",
    message: "जलकल विभाग: वार्ड 14 में मुख्य पाइपलाइन मरम्मत के कारण कल सुबह 8 से 12 बजे तक जलापूर्ति बंद रहेगी। कृपया पानी का संचय कर लें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Water supply maintenance announcement in Hindi."
  },
  {
    sampleId: "HI-LEGIT-051",
    label: "legitimate",
    language: "hindi",
    domain: "Hospital appointment",
    message: "मैक्स हॉस्पिटल: आपकी रक्त जांच रिपोर्ट तैयार है। रिपोर्ट maxhealthcare.in पर लॉगिन करके या अस्पताल रिसेप्शन से प्राप्त करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Blood test report ready notification in Hindi."
  },
  {
    sampleId: "HI-LEGIT-052",
    label: "legitimate",
    language: "hindi",
    domain: "E-commerce order scam",
    message: "मीशो (Meesho): आपका रिटर्न पिकअप आज शाम 4 बजे से 7 बजे के बीच निर्धारित है। कृपया वस्तु को मूल पैकिंग में रखें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Meesho return pickup alert in Hindi."
  },
  {
    sampleId: "HI-LEGIT-053",
    label: "legitimate",
    language: "hindi",
    domain: "Telecom service notice",
    message: "वोडाफोन आइडिया: आपके प्लान की वैधता 3 दिन में समाप्त हो रही है। बिना रुकावट सेवाओं के लिए vi.app से रिचार्ज करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Vi plan expiry alert in Hindi."
  },
  {
    sampleId: "HI-LEGIT-054",
    label: "legitimate",
    language: "hindi",
    domain: "Government informational messages",
    message: "कृषि मंत्रालय: प्रधानमंत्री फसल बीमा योजना (PMFBY) के तहत रबी फसलों के बीमा की अंतिम तिथि 31 दिसंबर है। अधिक जानकारी pmfby.gov.in पर देखें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "PMFBY crop insurance information in Hindi."
  },
  {
    sampleId: "HI-LEGIT-055",
    label: "legitimate",
    language: "hindi",
    domain: "Bank account/KYC",
    message: "केनरा बैंक: आपका नया डेबिट कार्ड आपके पते पर भेज दिया गया है। कार्ड सक्रिय करने के लिए नजदीकी एटीएम या मोबाइल ऐप का उपयोग करें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Canara bank debit card dispatch in Hindi."
  },
  {
    sampleId: "HI-LEGIT-056",
    label: "legitimate",
    language: "hindi",
    domain: "Donation receipt",
    message: "पीएम केयर्स फंड (PM CARES): आपके द्वारा 500 रुपये के राष्ट्र निर्माण में योगदान की रसीद #PM8920194 तैयार है। धन्यवाद।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "PM CARES donation receipt in Hindi."
  },
  {
    sampleId: "HI-LEGIT-057",
    label: "legitimate",
    language: "hindi",
    domain: "Workplace notifications",
    message: "कंपनी नोटिस: वित्तीय वर्ष 2025-26 के लिए फॉर्म 16 और टैक्स डिक्लेरेशन सबमिट करने की अंतिम तिथि 10 मार्च है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Company tax declaration notice in Hindi."
  },
  {
    sampleId: "HI-LEGIT-058",
    label: "legitimate",
    language: "hindi",
    domain: "Transit/toll payments",
    message: "दिल्ली मेट्रो: आपके स्मार्ट कार्ड में 200 रुपये का ऑटो-टॉपअप पूरा हुआ। वर्तमान शेष: 340 रुपये।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Delhi Metro top-up alert in Hindi."
  },
  {
    sampleId: "HI-LEGIT-059",
    label: "legitimate",
    language: "hindi",
    domain: "Banking security advisory",
    message: "आरबीआई कहता है: अपना बैंक खाता या यूपीआई पिन किसी अनजान व्यक्ति को न दें। सतर्क रहें, सुरक्षित रहें।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "RBI Kehta Hai official financial literacy message in Hindi."
  },
  {
    sampleId: "HI-LEGIT-060",
    label: "legitimate",
    language: "hindi",
    domain: "Login notifications",
    message: "आधार प्रमाणीकरण के लिए आपका ओटीपी 982019 है। यह यूआईडीएआई (UIDAI) द्वारा उत्पन्न किया गया है और 10 मिनट के लिए मान्य है।",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "UIDAI Aadhaar authentication OTP in Hindi."
  }
];

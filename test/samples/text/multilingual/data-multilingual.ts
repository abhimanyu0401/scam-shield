import type { BenchmarkSample } from "../../../evaluation/types";

export const multilingualScams: BenchmarkSample[] = [
  // --- MARATHI SCAMS (10) ---
  {
    sampleId: "MR-SCAM-001",
    label: "scam",
    language: "marathi",
    domain: "Bank account/KYC",
    message: "प्रिय ग्राहक, आपले बँक खाते पॅन कार्ड लिंक नसल्यामुळे आज रात्री तात्काळ बंद केले जाईल. आपले खाते सुरक्षित ठेवण्यासाठी येथे अपडेट करा: https://maha-bank-kyc.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account suspension threat", "Phishing link"],
    difficulty: "easy",
    notes: "Marathi bank KYC threat."
  },
  {
    sampleId: "MR-SCAM-002",
    label: "scam",
    language: "marathi",
    domain: "Electricity/gas bill scam",
    message: "महावितरण सूचना: मागील महिन्याचे वीज बिल भरले नसल्याने आज रात्री ९:३० वाजता आपला वीज पुरवठा खंडित केला जाईल. तात्काळ वीज अधिकारी ९८३०२१९४८२ यांच्याशी संपर्क साधा.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Utility disconnection threat", "Direct officer number"],
    difficulty: "easy",
    notes: "Mahavitaran electricity disconnection scam in Marathi."
  },
  {
    sampleId: "MR-SCAM-003",
    label: "scam",
    language: "marathi",
    domain: "UPI/payment fraud",
    message: "फोनपे वर तुम्हाला ५,००० रुपयांचे कॅशबॅक बक्षीस मिळाले आहे. बक्षीस खात्यात जमा करण्यासाठी लिंक उघडून आपला यूपीआय पिन टाका: https://phonepe-reward-maha.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests UPI PIN to receive money"],
    difficulty: "easy",
    notes: "PhonePe cashback scam in Marathi."
  },
  {
    sampleId: "MR-SCAM-004",
    label: "scam",
    language: "marathi",
    domain: "Digital arrest scam",
    message: "मुंबई सायबर सेल: आपल्या आधार कार्डवर अवैध पार्सल आणि मनी लाँडरिंगचा गुन्हा दाखल झाला आहे. अटक वॉरंट टाळण्यासाठी त्वरित व्हिडिओ चौकशीत हजर व्हा: https://mumbaipolice-virtual-court.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "Police impersonation"],
    difficulty: "hard",
    notes: "Digital arrest in Marathi."
  },
  {
    sampleId: "MR-SCAM-005",
    label: "scam",
    language: "marathi",
    domain: "Lottery/prize",
    message: "अभिनंदन! केबीसी लकी ड्रॉ मध्ये आपल्या मोबाईल क्रमांकाने २५ लाखांची लॉटरी जिंकली आहे. बक्षीस मिळवण्यासाठी मॅनेजरशी संपर्क साधा: ९७४८२९१०३९.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Lottery fraud", "Advance fee"],
    difficulty: "easy",
    notes: "KBC lottery scam in Marathi."
  },
  {
    sampleId: "MR-SCAM-006",
    label: "scam",
    language: "marathi",
    domain: "Job/task scam",
    message: "घरी बसून अर्धवेळ काम करा आणि दररोज ३,००० ते ५,००० रुपये कमवा. यूट्यूब व्हिडिओ लाईक करण्याचे सोपे काम. टेलिग्रामवर संपर्क करा: @parttime_marathi_job",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Task scam", "Telegram recruiter"],
    difficulty: "easy",
    notes: "Part time task scam in Marathi."
  },
  {
    sampleId: "MR-SCAM-007",
    label: "scam",
    language: "marathi",
    domain: "Loan scam",
    message: "प्रधानमंत्री मुद्रा कर्ज योजना: विनातारण ५ लाख रुपयांचे कर्ज मंजूर. फायलिंग चार्ज १,५०० रुपये पाठवून १० मिनिटात कर्ज मिळवा: ९८२०१९४८२०.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Advance fee loan"],
    difficulty: "easy",
    notes: "Loan scam in Marathi."
  },
  {
    sampleId: "MR-SCAM-008",
    label: "scam",
    language: "marathi",
    domain: "SIM deactivation",
    message: "जिओ सूचना: आपले सिम व्हेरिफिकेशन अपूर्ण आहे. आज संध्याकाळी सिम बंद केले जाईल. चालू ठेवण्यासाठी ९१०२९३८४७२ वर संपर्क साधा.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM block threat"],
    difficulty: "easy",
    notes: "SIM block threat in Marathi."
  },
  {
    sampleId: "MR-SCAM-009",
    label: "scam",
    language: "marathi",
    domain: "Courier/parcel scam",
    message: "भारतीय डाक सूचना: पत्ता अपूर्ण असल्याने आपले पार्सल अडकले आहे. पत्ता दुरुस्ती आणि ३५ रुपये शुल्क भरण्यासाठी येथे क्लिक करा: https://indiapost-update.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["India post phishing"],
    difficulty: "medium",
    notes: "India Post parcel phishing in Marathi."
  },
  {
    sampleId: "MR-SCAM-010",
    label: "scam",
    language: "marathi",
    domain: "Fake traffic challan/fine",
    message: "वाहतूक पोलीस ई-चलन: आपल्या वाहनावर २,००० रुपयांचे प्रलंबित चलन आहे. न्यायालयात खटला दाखल होण्यापूर्वी २४ तासांत भरा: https://echallan-pay-maha.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Traffic challan threat"],
    difficulty: "medium",
    notes: "E-challan phishing in Marathi."
  },

  // --- URDU SCAMS (10) ---
  {
    sampleId: "UR-SCAM-001",
    label: "scam",
    language: "urdu",
    domain: "Bank account/KYC",
    message: "معزز کسٹمر، آپ کا بینک اکاؤنٹ شناختی تصدیق نہ ہونے کی وجہ سے آج معطل کر دیا جائے گا۔ اکاؤنٹ بحال رکھنے کے لیے فوری تصدیق کریں: https://bank-kyc-verify.in",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account suspension threat", "Phishing link"],
    difficulty: "easy",
    notes: "Urdu bank KYC suspension threat."
  },
  {
    sampleId: "UR-SCAM-002",
    label: "scam",
    language: "urdu",
    domain: "Lottery/prize",
    message: "مبارک ہو! آپ کے سم نمبر نے بینظیر انکم سپورٹ / کے بی سی اسکیم میں 25 لاکھ کا انعام جیتا ہے۔ رقم وصول کرنے کے لیے واٹس ایپ پر رابطہ کریں: 9830219482",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Lottery fraud", "Advance fee"],
    difficulty: "easy",
    notes: "Urdu lottery scam."
  },
  {
    sampleId: "UR-SCAM-003",
    label: "scam",
    language: "urdu",
    domain: "Electricity/gas bill scam",
    message: "بجلی کا بل جمع نہ ہونے کی وجہ سے آج رات آپ کا میٹر کاٹ دیا جائے گا۔ بجلی بحال رکھنے کے لیے فوری طور پر افسر سے رابطہ کریں: 9810293847",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Utility disconnection threat", "Direct phone number"],
    difficulty: "easy",
    notes: "Urdu electricity disconnection scam."
  },
  {
    sampleId: "UR-SCAM-004",
    label: "scam",
    language: "urdu",
    domain: "UPI/payment fraud",
    message: "آپ کو 5000 روپے کا نقد کیش بیک ملا ہے۔ رقم اپنے اکاؤنٹ میں حاصل کرنے کے لیے پن درج کریں اور تصدیق کریں۔",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Requests UPI PIN to receive money"],
    difficulty: "easy",
    notes: "Urdu UPI PIN phishing."
  },
  {
    sampleId: "UR-SCAM-005",
    label: "scam",
    language: "urdu",
    domain: "Job/task scam",
    message: "گھر بیٹھے آن لائن ویڈیوز دیکھ کر روزانہ 3000 روپے کمائیں۔ بغیر کسی فیس کے فوری کام شروع کرنے کے لیے ٹیلیگرام پر رابطہ کریں۔",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Task scam", "Telegram recruiter"],
    difficulty: "easy",
    notes: "Urdu task scam."
  },
  {
    sampleId: "UR-SCAM-006",
    label: "scam",
    language: "urdu",
    domain: "Police/legal threat",
    message: "سائبر کرائم پولیس: آپ کے نام پر سنگین مقدمہ درج ہوا ہے۔ گرفتاری سے بچنے کے لیے 1 گھنٹے کے اندر تفتیشی افسر کو کال کریں۔",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Police arrest threat", "Urgency"],
    difficulty: "medium",
    notes: "Urdu police extortion."
  },
  {
    sampleId: "UR-SCAM-007",
    label: "scam",
    language: "urdu",
    domain: "Loan scam",
    message: "بغیر سود آسان ذاتی قرض 5 لاکھ روپے منظور۔ فائل چارج 1200 روپے جمع کرا کے 15 منٹ میں قرض حاصل کریں۔",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Advance fee loan"],
    difficulty: "easy",
    notes: "Urdu advance fee loan."
  },
  {
    sampleId: "UR-SCAM-008",
    label: "scam",
    language: "urdu",
    domain: "SIM deactivation",
    message: "آپ کا سم کارڈ آج بند کر دیا جائے گا۔ سم جاری رکھنے کے لیے فوری بائیو میٹرک تصدیق کروائیں۔ رابطہ: 9102938472",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["SIM block threat"],
    difficulty: "easy",
    notes: "Urdu SIM block threat."
  },
  {
    sampleId: "UR-SCAM-009",
    label: "scam",
    language: "urdu",
    domain: "Courier/parcel scam",
    message: "آپ کا غیر ملکی پارسل کسٹم میں روک لیا گیا ہے۔ کسٹم ڈیوٹی جمع کرانے کے لیے فوری رقم ٹرانسفر کریں۔",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Customs parcel scam"],
    difficulty: "medium",
    notes: "Urdu customs duty parcel scam."
  },
  {
    sampleId: "UR-SCAM-010",
    label: "scam",
    language: "urdu",
    domain: "Digital arrest scam",
    message: "سی بی آئی انتباہ: آپ کے خلاف منی لانڈرنگ کا مقدمہ ہے۔ ویڈیو کال کے ذریعے فوری عدالتی کارروائی میں شامل ہوں۔",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Digital arrest", "Law enforcement impersonation"],
    difficulty: "hard",
    notes: "Urdu digital arrest lure."
  },

  // --- FRENCH SCAMS (10) ---
  {
    sampleId: "FR-SCAM-001",
    label: "scam",
    language: "french",
    domain: "Courier/parcel scam",
    message: "Chronopost: Votre colis numéro 489201 ne peut pas être livré en raison d'une adresse incomplète. Veuillez régler les frais de réexpédition (1,99 €) sur https://chronopost-livraison-colis.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Parcel delivery phishing", "Small fee lure"],
    difficulty: "easy",
    notes: "Chronopost delivery phishing in French."
  },
  {
    sampleId: "FR-SCAM-002",
    label: "scam",
    language: "french",
    domain: "Bank account/KYC",
    message: "BNP Paribas Sécurité: Une connexion inhabituelle a été détectée sur votre espace client. Veuillez confirmer votre identité et votre code secret sous 24h: https://bnp-paribas-securite.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Bank credential phishing", "Phishing link"],
    difficulty: "easy",
    notes: "BNP Paribas phishing in French."
  },
  {
    sampleId: "FR-SCAM-003",
    label: "scam",
    language: "french",
    domain: "Fake government benefit/subsidy",
    message: "Ameli Assurance Maladie: Vous avez droit à un remboursement de soins de 342,80 €. Remplissez vos coordonnées bancaires pour recevoir le virement: https://ameli-remboursement-sante.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Health refund lure", "Fake government portal"],
    difficulty: "medium",
    notes: "Ameli health insurance refund phishing."
  },
  {
    sampleId: "FR-SCAM-004",
    label: "scam",
    language: "french",
    domain: "Fake traffic challan/fine",
    message: "ANTAI: Vous avez une amende impayée de 35,00 € pour excès de vitesse. Majoration à 135 € dans 48h. Réglez votre amende sur https://antai-amendes-gouv.in.fakedomain.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Traffic fine threat", "Subdomain spoofing"],
    difficulty: "medium",
    notes: "ANTAI traffic ticket phishing in French."
  },
  {
    sampleId: "FR-SCAM-005",
    label: "scam",
    language: "french",
    domain: "Police/legal threat",
    message: "Police Nationale / Brigade des Mineurs: Une convocation judiciaire urgente a été émise à votre encontre pour infractions graves en ligne. Répondez sous 48h pour éviter une arrestation immédiate.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Police summon threat", "Extortion"],
    difficulty: "medium",
    notes: "French cyber police summons extortion."
  },
  {
    sampleId: "FR-SCAM-006",
    label: "scam",
    language: "french",
    domain: "Fake subscription renewal",
    message: "Netflix: Votre dernier prélèvement mensuel a échoué. Votre abonnement sera suspendu. Mettez à jour votre carte bancaire ici: https://netflix-renouvellement.net",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Subscription suspension", "Phishing link"],
    difficulty: "easy",
    notes: "Netflix payment phishing in French."
  },
  {
    sampleId: "FR-SCAM-007",
    label: "scam",
    language: "french",
    domain: "WhatsApp/Telegram account takeover",
    message: "Coucou maman, j'ai cassé mon téléphone et ceci est mon numéro temporaire. J'ai une urgence de 450 € à payer aujourd'hui. Peux-tu m'envoyer un virement instantané stp?",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Family impersonation", "Urgent money request"],
    difficulty: "hard",
    notes: "'Coucou maman' family impersonation in French."
  },
  {
    sampleId: "FR-SCAM-008",
    label: "scam",
    language: "french",
    domain: "Job/task scam",
    message: "Offre d'emploi télétravail: Évaluez des produits en ligne et gagnez de 150 € à 300 € par jour. Paiement direct chaque soir. Rejoignez notre canal Telegram @recrutement_france",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Task scam", "Telegram recruiter"],
    difficulty: "easy",
    notes: "Task scam in French."
  },
  {
    sampleId: "FR-SCAM-009",
    label: "scam",
    language: "french",
    domain: "Card/payment reversal",
    message: "Alerte Sécurité Société Générale: Débit de 849,00 € chez Cdiscount en cours. Si vous n'êtes pas à l'origine de cet achat, contactez le service anti-fraude au 09 70 44 89 20.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["False transaction alarm", "Fake fraud desk number"],
    difficulty: "medium",
    notes: "Société Générale credit card charge panic in French."
  },
  {
    sampleId: "FR-SCAM-010",
    label: "scam",
    language: "french",
    domain: "Lottery/prize",
    message: "Félicitations! Vous avez été tiré au sort pour remporter une carte cadeau de 1 000 € chez Carrefour. Cliquez ici pour valider vos coordonnées: http://carrefour-gagnant.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Gift card prize", "Phishing link"],
    difficulty: "easy",
    notes: "Supermarket gift card lottery scam in French."
  },

  // --- GERMAN SCAMS (10) ---
  {
    sampleId: "DE-SCAM-001",
    label: "scam",
    language: "german",
    domain: "Bank account/KYC",
    message: "Deutsche Bank Sicherheitswarnung: Ihr photoTAN-Verfahren läuft in Kürze ab. Um eine Kontosperrung zu vermeiden, erneuern Sie Ihre Registrierung unter https://deutsche-bank-tan-update.net",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account suspension threat", "photoTAN phishing"],
    difficulty: "easy",
    notes: "Deutsche Bank photoTAN phishing in German."
  },
  {
    sampleId: "DE-SCAM-002",
    label: "scam",
    language: "german",
    domain: "Courier/parcel scam",
    message: "DHL Paket: Ihr Paket mit der Sendungsnummer #4892019 konnte wegen fehlender Hausnummer nicht zugestellt werden. Bitte Zollgebühr (1,99 EUR) begleichen: https://dhl-paket-nachsendung.top",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["DHL parcel phishing", "Small fee lure"],
    difficulty: "easy",
    notes: "DHL parcel phishing in German."
  },
  {
    sampleId: "DE-SCAM-003",
    label: "scam",
    language: "german",
    domain: "WhatsApp/Telegram account takeover",
    message: "Hallo Mama/Papa, mein Handy ist ins Wasser gefallen und das ist meine neue Nummer. Ich muss dringend eine Rechnung über 850 Euro überweisen. Kannst du mir helfen?",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Family impersonation", "Urgent money request"],
    difficulty: "hard",
    notes: "'Hallo Mama' WhatsApp scam in German."
  },
  {
    sampleId: "DE-SCAM-004",
    label: "scam",
    language: "german",
    domain: "Tax/refund scam",
    message: "Bundeszentralamt für Steuern: Sie haben Anspruch auf eine Steuerrückerstattung von 412,50 EUR für das Steuerjahr 2025. Bestätigen Sie Ihre Bankverbindung: https://elster-steuerrueckzahlung.site",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Tax refund lure", "Fake tax authority"],
    difficulty: "medium",
    notes: "German tax refund phishing."
  },
  {
    sampleId: "DE-SCAM-005",
    label: "scam",
    language: "german",
    domain: "Police/legal threat",
    message: "Bundeskriminalamt (BKA): Gegen Sie liegt ein richterlicher Haftbefehl wegen Cyber-Vergehen vor. Nehmen Sie innerhalb von 24 Stunden Stellung, um die Festnahme abzuwenden.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Police arrest threat", "Extortion"],
    difficulty: "medium",
    notes: "BKA police summons extortion in German."
  },
  {
    sampleId: "DE-SCAM-006",
    label: "scam",
    language: "german",
    domain: "Fake subscription renewal",
    message: "Amazon Prime: Ihre Mitgliedschaft konnte nicht verlängert werden. Bitte aktualisieren Sie Ihre Zahlungsmethode, um eine Kontodeaktivierung zu verhindern: https://amazon-zahlung-update.org",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Subscription suspension", "Phishing link"],
    difficulty: "easy",
    notes: "Amazon Prime payment phishing in German."
  },
  {
    sampleId: "DE-SCAM-007",
    label: "scam",
    language: "german",
    domain: "Job/task scam",
    message: "Home-Office Angebot: Bewerten Sie mobile Apps und verdienen Sie 200 bis 450 EUR täglich. Sofortige Auszahlung. Kontaktieren Sie uns auf Telegram: @germany_jobs_online",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Task scam", "Telegram recruiter"],
    difficulty: "easy",
    notes: "App review task scam in German."
  },
  {
    sampleId: "DE-SCAM-008",
    label: "scam",
    language: "german",
    domain: "Card/payment reversal",
    message: "Sparkasse Sicherheit: Eine verdächtige Zahlung über 749,00 EUR bei MediaMarkt wurde registriert. Rufen Sie sofort unsere Notfallnummer 030-8920194 an, um die Abbuchung zu stoppen.",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["False transaction alarm", "Direct phone number"],
    difficulty: "medium",
    notes: "Sparkasse fake fraud desk in German."
  },
  {
    sampleId: "DE-SCAM-009",
    label: "scam",
    language: "german",
    domain: "Investment/crypto scam",
    message: "Garantierte Rendite: Investieren Sie in automatisierte Krypto-Arbitrage und erzielen Sie 12% monatlich ohne Risiko. Treten Sie unserer VIP-Gruppe bei: https://crypto-wealth-germany.xyz",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Guaranteed returns", "Crypto Ponzi"],
    difficulty: "easy",
    notes: "Crypto Ponzi scheme in German."
  },
  {
    sampleId: "DE-SCAM-010",
    label: "scam",
    language: "german",
    domain: "Generic credential phishing",
    message: "PayPal Sicherheitsmitteilung: Ihr Konto wurde vorübergehend eingeschränkt. Bitte bestätigen Sie Ihre Identität zur vollständigen Freischaltung: https://paypal-konto-pruefung.cc",
    expectedRiskBand: "81-100",
    expectedMajorSignals: ["Account limited threat", "PayPal phishing"],
    difficulty: "easy",
    notes: "PayPal phishing in German."
  }
];

export const multilingualLegitimate: BenchmarkSample[] = [
  // --- MARATHI LEGITIMATE (10) ---
  {
    sampleId: "MR-LEGIT-001",
    label: "legitimate",
    language: "marathi",
    domain: "Bank transaction confirmations",
    message: "प्रिय ग्राहक, आपल्या बँक खात्यातून XX4821 1,500.00 रुपये 24-02-2026 रोजी एटीएम मधून काढले गेले. शिल्लक: 18,420.00 रुपये.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Marathi ATM debit confirmation."
  },
  {
    sampleId: "MR-LEGIT-002",
    label: "legitimate",
    language: "marathi",
    domain: "Electricity bills",
    message: "महावितरण: ग्राहक क्रमांक 00192847 चे फेब्रुवारी 2026 चे वीज बिल 1,420 रुपये आहे. देय तारीख 08-मार्च-2026. mahadiscom.in वर भरा.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Official Mahavitaran bill in Marathi."
  },
  {
    sampleId: "MR-LEGIT-003",
    label: "legitimate",
    language: "marathi",
    domain: "UPI payment confirmations",
    message: "गुगल पे: रोहित पवार यांना 450.00 रुपयांचे पेमेंट यशस्वीपणे पूर्ण झाले आहे. संदर्भ क्रमांक: 604928194021.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Google Pay payment in Marathi."
  },
  {
    sampleId: "MR-LEGIT-004",
    label: "legitimate",
    language: "marathi",
    domain: "Train/flight confirmations",
    message: "आईआरसीटीसी: गाडी क्रमांक 12124 डेक्कन क्वीन, 28-फेब्रुवारी-2026 रोजी पुणे ते मुंबई आरक्षण पुष्ट झाले. आसन: D2-45.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Train booking in Marathi."
  },
  {
    sampleId: "MR-LEGIT-005",
    label: "legitimate",
    language: "marathi",
    domain: "Delivery updates",
    message: "फ्लिपकार्ट: आपले पार्सल आज डिलिव्हर केले जाईल. डिलिव्हरी एजंटला सामान घेतानाच हा कोड 4829 सांगा.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Flipkart delivery code in Marathi."
  },
  {
    sampleId: "MR-LEGIT-006",
    label: "legitimate",
    language: "marathi",
    domain: "Government informational messages",
    message: "निवडणूक आयोग: मतदार यादीत नाव तपासण्यासाठी voters.eci.gov.in ला भेट द्या किंवा 1950 वर कॉल करा.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Voter helpline in Marathi."
  },
  {
    sampleId: "MR-LEGIT-007",
    label: "legitimate",
    language: "marathi",
    domain: "Mobile recharge confirmations",
    message: "जिओ: 299 रुपयांचा रिचार्ज यशस्वीरीत्या झाला आहे. 2GB प्रतिदिन डेटा आणि अमर्यादित कॉल्स 28 दिवसांसाठी.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Jio recharge in Marathi."
  },
  {
    sampleId: "MR-LEGIT-008",
    label: "legitimate",
    language: "marathi",
    domain: "Login notifications",
    message: "आपला नेटबँकिंग लॉगिन ओटीपी 892014 आहे. हा ओटीपी कोणाशीही शेअर करू नका.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Banking OTP in Marathi."
  },
  {
    sampleId: "MR-LEGIT-009",
    label: "legitimate",
    language: "marathi",
    domain: "Bank account/KYC",
    message: "सुरक्षा सूचना: बँक कधीही फोनवर आपला एटीएम पिन किंवा ओटीपी मागत नाही. फसवणुकीपासून सावध राहा.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Bank security alert in Marathi with keywords."
  },
  {
    sampleId: "MR-LEGIT-010",
    label: "legitimate",
    language: "marathi",
    domain: "FASTag toll payments",
    message: "फास्टॅग अलर्ट: टोल नाक्यावर 65.00 रुपये वजा झाले. उर्वरित शिल्लक: 415.00 रुपये.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "FASTag toll in Marathi."
  },

  // --- URDU LEGITIMATE (10) ---
  {
    sampleId: "UR-LEGIT-001",
    label: "legitimate",
    language: "urdu",
    domain: "Bank transaction confirmations",
    message: "محترم کسٹمر، آپ کے اکاؤنٹ XX4821 سے 2000 روپے کی رقم نکالی گئی ہے۔ موجودہ بیلنس: 15400 روپے۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Urdu bank withdrawal notification."
  },
  {
    sampleId: "UR-LEGIT-002",
    label: "legitimate",
    language: "urdu",
    domain: "UPI payment confirmations",
    message: "فون پے: آپ کے اکاؤنٹ میں احمد کی طرف سے 1500 روپے کامیابی کے ساتھ منتقل کر دیے گئے ہیں۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Urdu UPI payment confirmation."
  },
  {
    sampleId: "UR-LEGIT-003",
    label: "legitimate",
    language: "urdu",
    domain: "Delivery updates",
    message: "ایمازون: آپ کا آرڈر آج ڈیلیور کیا جائے گا۔ ڈیلیوری بوائے کو پارسل وصول کرتے وقت کوڈ 4829 بتائیں۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Amazon OTP in Urdu."
  },
  {
    sampleId: "UR-LEGIT-004",
    label: "legitimate",
    language: "urdu",
    domain: "Electricity bills",
    message: "بجلی کا بل: ماہ فروری کا بل 1850 روپے موصول ہو گیا ہے۔ شکریہ۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Urdu electricity bill receipt."
  },
  {
    sampleId: "UR-LEGIT-005",
    label: "legitimate",
    language: "urdu",
    domain: "Mobile recharge confirmations",
    message: "آپ کے نمبر پر 299 روپے کا موبائل ریچارج کامیابی سے مکمل ہو گیا ہے۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Urdu mobile recharge alert."
  },
  {
    sampleId: "UR-LEGIT-006",
    label: "legitimate",
    language: "urdu",
    domain: "Train/flight confirmations",
    message: "ریلوے ریزرویشن: پی این آر 2849102848، تاریخ 28 فروری 2026، سیٹ کنفرم ہے۔ شبھ یاترا۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Urdu railway reservation confirmation."
  },
  {
    sampleId: "UR-LEGIT-007",
    label: "legitimate",
    language: "urdu",
    domain: "Government informational messages",
    message: "الیکشن کمیشن: ووٹر لسٹ میں اپنا نام دیکھنے کے لیے آفیشل ویب سائٹ voters.eci.gov.in وزٹ کریں۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Urdu voter advisory."
  },
  {
    sampleId: "UR-LEGIT-008",
    label: "legitimate",
    language: "urdu",
    domain: "Login notifications",
    message: "لاگ ان تصدیق کے لیے آپ کا او ٹی پی 892014 ہے۔ یہ کوڈ کسی کے ساتھ شیئر نہ کریں۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Urdu login OTP."
  },
  {
    sampleId: "UR-LEGIT-009",
    label: "legitimate",
    language: "urdu",
    domain: "Bank account/KYC",
    message: "بینک انتباہ: بینک کبھی بھی فون پر آپ کا پن یا پاس ورڈ نہیں مانگتا۔ چوکنا رہیں، محفوظ رہیں۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Urdu bank security education."
  },
  {
    sampleId: "UR-LEGIT-010",
    label: "legitimate",
    language: "urdu",
    domain: "Hospital appointment",
    message: "ہسپتال اپائنٹمنٹ: ڈاکٹر طارق کے ساتھ آپ کی ملاقات کل صبح 10 بجے طے ہے۔",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Urdu doctor appointment notice."
  },

  // --- FRENCH LEGITIMATE (10) ---
  {
    sampleId: "FR-LEGIT-001",
    label: "legitimate",
    language: "french",
    domain: "Bank transaction confirmations",
    message: "BNP Paribas: Paiement CB de 42,50 € chez MONOPRIX PARIS le 24/02/2026. Solde disponible: 1 420,10 €. Signalez toute fraude au 3477.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "BNP Paribas card payment in French."
  },
  {
    sampleId: "FR-LEGIT-002",
    label: "legitimate",
    language: "french",
    domain: "Delivery updates",
    message: "La Poste Colissimo: Votre colis #6A8920194 sera livré aujourd'hui entre 11h et 13h à votre domicile. Suivez la livraison sur laposte.fr.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "La Poste Colissimo delivery in French."
  },
  {
    sampleId: "FR-LEGIT-003",
    label: "legitimate",
    language: "french",
    domain: "Train/flight confirmations",
    message: "SNCF Connect: Votre billet TGV INOUI 6612 (Paris Gare de Lyon -> Lyon Part-Dieu) pour le 28/02/2026 est confirmé. Voiture 4, Place 52.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "SNCF train confirmation in French."
  },
  {
    sampleId: "FR-LEGIT-004",
    label: "legitimate",
    language: "french",
    domain: "Appointment confirmations",
    message: "Doctolib: Rappel de votre rendez-vous avec le Dr. Martin (Dentiste) demain 25 février à 14h30 au 12 rue de la Paix. Annulation possible sur doctolib.fr.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Doctolib appointment in French."
  },
  {
    sampleId: "FR-LEGIT-005",
    label: "legitimate",
    language: "french",
    domain: "Login notifications",
    message: "Votre code de sécurité pour valider votre paiement de 29,90 € chez Amazon est 892014. Ne partagez jamais ce code par téléphone.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "3D Secure 2FA code in French."
  },
  {
    sampleId: "FR-LEGIT-006",
    label: "legitimate",
    language: "french",
    domain: "Electricity bills",
    message: "EDF: Votre facture d'électricité n°892019 d'un montant de 74,50 € a été prélevée le 20/02/2026. Consultez vos factures sur edf.fr.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "EDF electricity invoice in French."
  },
  {
    sampleId: "FR-LEGIT-007",
    label: "legitimate",
    language: "french",
    domain: "Telecom service notice",
    message: "Orange: Votre forfait mobile est renouvelé pour le mois de mars. Vous disposez de 100 Go d'internet en France et Europe. Espace client: orange.fr.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Orange mobile plan in French."
  },
  {
    sampleId: "FR-LEGIT-008",
    label: "legitimate",
    language: "french",
    domain: "Account security notifications",
    message: "Google Sécurité: Nouvelle connexion sur Chrome Windows à Paris, France. Si vous êtes à l'origine de cette connexion, aucune action n'est requise.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Google sign-in alert in French."
  },
  {
    sampleId: "FR-LEGIT-009",
    label: "legitimate",
    language: "french",
    domain: "Bank account/KYC",
    message: "Information Sécurité Société Générale: Nos conseillers ne vous demanderont jamais votre mot de passe ou code secret par téléphone. Restez vigilants.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Bank anti-phishing advisory in French."
  },
  {
    sampleId: "FR-LEGIT-010",
    label: "legitimate",
    language: "french",
    domain: "Restaurant orders",
    message: "Deliveroo: Votre commande chez 'Le Bistrot Parisien' est prête et le livreur est en route. Arrivée prévue à 19h45.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Deliveroo order status in French."
  },

  // --- GERMAN LEGITIMATE (10) ---
  {
    sampleId: "DE-LEGIT-001",
    label: "legitimate",
    language: "german",
    domain: "Bank transaction confirmations",
    message: "Sparkasse: Kartenzahlung über 34,90 EUR bei REWE BERLIN am 24.02.2026. Verfügbarer Betrag: 1.842,50 EUR. Kartensperre im Notfall unter 116 116.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Sparkasse debit card transaction in German."
  },
  {
    sampleId: "DE-LEGIT-002",
    label: "legitimate",
    language: "german",
    domain: "Delivery updates",
    message: "DHL Paket: Ihre Sendung 003489201948 wird voraussichtlich heute zwischen 13:30 und 15:00 Uhr zugestellt. Verfolgung unter dhl.de.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "DHL parcel delivery in German."
  },
  {
    sampleId: "DE-LEGIT-003",
    label: "legitimate",
    language: "german",
    domain: "Train/flight confirmations",
    message: "Deutsche Bahn: Buchungsbestätigung für ICE 594 (München Hbf -> Frankfurt(Main)Hbf) am 28.02.2026. Wagen 7, Sitzplatz 42. Gute Fahrt.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Deutsche Bahn ticket confirmation in German."
  },
  {
    sampleId: "DE-LEGIT-004",
    label: "legitimate",
    language: "german",
    domain: "Appointment confirmations",
    message: "Termin-Erinnerung: Ihr Arzttermin bei Dr. Weber (Allgemeinmedizin) ist bestätigt für morgen 25.02.2026 um 10:15 Uhr. Praxis am Markt.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Doctor appointment in German."
  },
  {
    sampleId: "DE-LEGIT-005",
    label: "legitimate",
    language: "german",
    domain: "Login notifications",
    message: "Ihr photoTAN-Freigabecode für die Überweisung von 120,00 EUR an Müller ist: 892014. Geben Sie diese TAN niemals an Dritte weiter.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "photoTAN 2FA code in German."
  },
  {
    sampleId: "DE-LEGIT-006",
    label: "legitimate",
    language: "german",
    domain: "Electricity bills",
    message: "E.ON Energie: Ihre Jahresabrechnung für Strom liegt in Ihrem Kundenportal bereit. Guthaben von 84,20 EUR wird zum 01.03.2026 erstattet.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "E.ON utility billing in German."
  },
  {
    sampleId: "DE-LEGIT-007",
    label: "legitimate",
    language: "german",
    domain: "Telecom service notice",
    message: "Telekom: Ihr Datenvolumen (15 GB) wurde zum Monatsanfang wie gewohnt zurückgesetzt. Status und Optionen unter pass.telekom.de.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Telekom data volume reset in German."
  },
  {
    sampleId: "DE-LEGIT-008",
    label: "legitimate",
    language: "german",
    domain: "Account security notifications",
    message: "Apple-ID Mitteilung: Ihr Passwort wurde am 24. Februar 2026 um 18:32 Uhr geändert. Falls Sie das waren, ignorieren Sie diese E-Mail.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "medium",
    notes: "Apple ID password change alert in German."
  },
  {
    sampleId: "DE-LEGIT-009",
    label: "legitimate",
    language: "german",
    domain: "Bank account/KYC",
    message: "Sicherheitshinweis Commerzbank: Unsere Mitarbeiter fordern Sie niemals zur telefonischen Weitergabe von TANs oder Passwörtern auf.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "hard",
    notes: "Commerzbank anti-phishing notice in German."
  },
  {
    sampleId: "DE-LEGIT-010",
    label: "legitimate",
    language: "german",
    domain: "Restaurant orders",
    message: "Lieferando: Ihre Bestellung bei 'Pizzeria Napoli' wurde erfolgreich aufgegeben und befindet sich in der Zubereitung. Lieferzeit ca. 30 Min.",
    expectedRiskBand: "0-20",
    expectedMajorSignals: [],
    difficulty: "easy",
    notes: "Lieferando food delivery confirmation in German."
  }
];

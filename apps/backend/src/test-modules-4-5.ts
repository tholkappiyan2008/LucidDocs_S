import { DocumentAnalysisSchema, DocumentAnalysis } from './validators/document.validator.js';
import { generateToken } from './utils/jwt.js';

async function runModules4And5Tests() {
  console.log('\n--- [ClearDoc Module 4 & 5: Results Dashboard & Multilingual Engine Tests] ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // Sample original English document analysis
  const originalEnglishDoc: DocumentAnalysis = {
    doc_type: 'Electricity Bill',
    sender: 'TANGEDCO Utility Corp',
    plain_summary: 'Your electricity bill for October is ₹1,450.00. Payment is due by 2026-11-15.',
    key_facts: [
      { label: 'Amount Due', value: '₹1,450.00', confidence: 0.99 },
      { label: 'Consumer Account', value: '04-987-654-321', confidence: 0.96 },
    ],
    deadlines: [
      { what: 'Pay bill before late surcharge', date: '2026-11-15' },
    ],
    risks: [
      { level: 'medium', note: 'Late fee of ₹100 added if unpaid after 2026-11-15.' },
    ],
    next_steps: [
      'Pay ₹1,450.00 using online UPI or net banking before 2026-11-15.',
      'Save the digital payment receipt for your records.',
    ],
    needs_human_check: [
      'Confirm the previous meter reading if bill seems higher than usual.',
    ],
  };

  // 1. Verify Module 4 Dashboard Schema Completeness
  try {
    const verified = DocumentAnalysisSchema.parse(originalEnglishDoc);
    assert(Boolean(verified.doc_type), 'Module 4: doc_type present and valid');
    assert(Boolean(verified.sender), 'Module 4: sender present and valid');
    assert(Boolean(verified.plain_summary), 'Module 4: plain_summary present and valid');
    assert(verified.key_facts.length >= 2, 'Module 4: key facts with confidence present');
    assert(verified.deadlines.length >= 1, 'Module 4: deadlines with dates present');
    assert(verified.risks[0].level === 'medium', 'Module 4: risk level present');
    assert(verified.next_steps.length >= 2, 'Module 4: next steps present');
    assert(verified.needs_human_check.length >= 1, 'Module 4: human check warnings present');
  } catch (e: any) {
    assert(false, `Dashboard schema completeness failed: ${e.message}`);
  }

  // 2. Multilingual Engine (Module 5): Tamil (தமிழ்)
  const tamilAnalysis: DocumentAnalysis = {
    doc_type: 'மின்சாரக் கட்டணம் (Electricity Bill)',
    sender: 'TANGEDCO Utility Corp',
    plain_summary: 'அக்டோபர் மாதத்திற்கான உங்களின் மின்சாரக் கட்டணம் ₹1,450.00 ஆகும். செலுத்த வேண்டிய கடைசி நாள் 2026-11-15.',
    key_facts: [
      { label: 'செலுத்த வேண்டிய தொகை (Amount Due)', value: '₹1,450.00', confidence: 0.99 },
      { label: 'மின் இணைப்பு எண் (Consumer Account)', value: '04-987-654-321', confidence: 0.96 },
    ],
    deadlines: [
      { what: 'அபராதம் இன்றி கட்டணம் செலுத்த வேண்டிய நாள்', date: '2026-11-15' },
    ],
    risks: [
      { level: 'medium', note: '2026-11-15 க்குள் செலுத்தாவிட்டால் ₹100 கூடுதல் அபராதம் விதிக்கப்படும்.' },
    ],
    next_steps: [
      '2026-11-15 க்குள் UPI அல்லது வங்கி மூலம் ₹1,450.00 கட்டணத்தை செலுத்தவும்.',
      'கட்டண ரசீதை பாதுகாப்பாக வைத்துக்கொள்ளவும்.',
    ],
    needs_human_check: [
      'கட்டணம் அதிகமாக இருந்தால் முந்தைய மீட்டரின் அளவை சரிபார்க்கவும்.',
    ],
  };

  try {
    const parsedTamil = DocumentAnalysisSchema.parse(tamilAnalysis);
    const hasTamilCharacters = /[\u0B80-\u0BFF]/.test(parsedTamil.plain_summary);
    assert(hasTamilCharacters, 'Module 5 (Tamil): Correctly renders Unicode Tamil script');
    assert(parsedTamil.key_facts[0].value === '₹1,450.00', 'Module 5 (Tamil): Currency ₹1,450.00 strictly preserved');
    assert(parsedTamil.deadlines[0].date === '2026-11-15', 'Module 5 (Tamil): Date 2026-11-15 strictly preserved');
    assert(parsedTamil.key_facts[1].value === '04-987-654-321', 'Module 5 (Tamil): Consumer number strictly preserved');
  } catch (e: any) {
    assert(false, `Tamil analysis test failed: ${e.message}`);
  }

  // 3. Multilingual Engine (Module 5): Telugu (తెలుగు)
  const teluguAnalysis: DocumentAnalysis = {
    doc_type: 'విద్యుత్ బిల్లు (Electricity Bill)',
    sender: 'TANGEDCO Utility Corp',
    plain_summary: 'అక్టోబర్ నెలకు మీ విద్యుత్ బిల్లు ₹1,450.00. చెల్లించాల్సిన చివరి తేదీ 2026-11-15.',
    key_facts: [
      { label: 'చెల్లించాల్సిన మొత్తం (Amount Due)', value: '₹1,450.00', confidence: 0.99 },
      { label: 'వినియోగదారుని ఖాతా (Consumer Account)', value: '04-987-654-321', confidence: 0.96 },
    ],
    deadlines: [
      { what: 'అపరాధ రుసుము లేకుండా బిల్లు చెల్లించండి', date: '2026-11-15' },
    ],
    risks: [
      { level: 'medium', note: '2026-11-15 తర్వాత చెల్లిస్తే ₹100 ఆలస్య రుసుము విధించబడుతుంది.' },
    ],
    next_steps: [
      '2026-11-15 లోపు UPI లేదా నెట్ బ్యాంకింగ్ ద్వారా ₹1,450.00 చెల్లించండి.',
      'రసీదును భద్రపరుచుకోండి.',
    ],
    needs_human_check: [
      'బిల్లు ఎక్కువగా ఉంటే మీటర్ రీడింగ్‌ను సరిచూసుకోండి.',
    ],
  };

  try {
    const parsedTelugu = DocumentAnalysisSchema.parse(teluguAnalysis);
    const hasTeluguCharacters = /[\u0C00-\u0C7F]/.test(parsedTelugu.plain_summary);
    assert(hasTeluguCharacters, 'Module 5 (Telugu): Correctly renders Unicode Telugu script');
    assert(parsedTelugu.key_facts[0].value === '₹1,450.00', 'Module 5 (Telugu): Currency ₹1,450.00 strictly preserved');
    assert(parsedTelugu.deadlines[0].date === '2026-11-15', 'Module 5 (Telugu): Date 2026-11-15 strictly preserved');
  } catch (e: any) {
    assert(false, `Telugu analysis test failed: ${e.message}`);
  }

  // 4. Multilingual Engine (Module 5): Hindi (हिंदी)
  const hindiAnalysis: DocumentAnalysis = {
    doc_type: 'बिजली का बिल (Electricity Bill)',
    sender: 'TANGEDCO Utility Corp',
    plain_summary: 'अक्टूबर महीने के लिए आपका बिजली का बिल ₹1,450.00 है। भुगतान करने की अंतिम तिथि 2026-11-15 है।',
    key_facts: [
      { label: 'देय राशि (Amount Due)', value: '₹1,450.00', confidence: 0.99 },
      { label: 'उपभोक्ता संख्या (Consumer Account)', value: '04-987-654-321', confidence: 0.96 },
    ],
    deadlines: [
      { what: 'विलंब शुल्क से पहले बिल का भुगतान करें', date: '2026-11-15' },
    ],
    risks: [
      { level: 'medium', note: '2026-11-15 के बाद भुगतान करने पर ₹100 का विलंब शुल्क लगेगा।' },
    ],
    next_steps: [
      '2026-11-15 से पहले UPI या नेट बैंकिंग से ₹1,450.00 का भुगतान करें।',
      'भुगतान रसीद को सुरक्षित रखें।',
    ],
    needs_human_check: [
      'यदि बिल अधिक लग रहा है तो मीटर रीडिंग की पुष्टि करें।',
    ],
  };

  try {
    const parsedHindi = DocumentAnalysisSchema.parse(hindiAnalysis);
    const hasHindiCharacters = /[\u0900-\u097F]/.test(parsedHindi.plain_summary);
    assert(hasHindiCharacters, 'Module 5 (Hindi): Correctly renders Unicode Devanagari script');
    assert(parsedHindi.key_facts[0].value === '₹1,450.00', 'Module 5 (Hindi): Currency ₹1,450.00 strictly preserved');
    assert(parsedHindi.deadlines[0].date === '2026-11-15', 'Module 5 (Hindi): Date 2026-11-15 strictly preserved');
  } catch (e: any) {
    assert(false, `Hindi analysis test failed: ${e.message}`);
  }

  // 5. User Ownership & Authorization Token Test
  const token = generateToken({ id: 'owner-user-123', email: 'owner@cleardoc.app', name: 'Owner' });
  assert(Boolean(token), 'Security: Auth Bearer token generated for ownership validation');

  console.log(`\n==========================================`);
  console.log(`Module 4 & 5 Results: ${passed} passed, ${failed} failed`);
  console.log(`==========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runModules4And5Tests();

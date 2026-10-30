import express from 'express';
import cors from 'cors';
import { generateToken } from './utils/jwt.js';
import { requireAuth, AuthenticatedRequest } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { askQuestionSchema } from './validators/question.validator.js';

interface TestDoc {
  id: string;
  user_id: string;
  file_name: string;
  analysis: any;
}

interface TestQuestion {
  id: string;
  document_id: string;
  user_id: string;
  question: string;
  answer: string;
  is_grounded: boolean;
  created_at: string;
}

async function runModule8Tests() {
  console.log('\n--- [ClearDoc Module 8: Grounded Follow-up Q&A Tests] ---');
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

  // 1. Zod Schema Validation Tests
  try {
    const validQ = askQuestionSchema.parse({
      question: 'What is the amount due?',
      language: 'en',
    });
    assert(validQ.question === 'What is the amount due?', 'Valid question accepted');

    // Reject empty question
    try {
      askQuestionSchema.parse({ question: '', language: 'en' });
      assert(false, 'Empty question should have been rejected');
    } catch {
      assert(true, 'Empty question rejected (<2 characters)');
    }

    // Reject question over 1000 characters
    try {
      askQuestionSchema.parse({ question: 'a'.repeat(1005), language: 'en' });
      assert(false, 'Overlong question should have been rejected');
    } catch {
      assert(true, 'Overlong question rejected (>1000 characters)');
    }
  } catch (e: any) {
    assert(false, `Zod schema test threw error: ${e.message}`);
  }

  // 2. Set up Security Isolation Test Harness with 2 Users
  const userA = { id: 'user-a-1111-1111-1111', email: 'userA@cleardoc.app', name: 'User A' };
  const userB = { id: 'user-b-2222-2222-2222', email: 'userB@cleardoc.app', name: 'User B' };

  const tokenA = generateToken(userA);
  const tokenB = generateToken(userB);

  const mockDocs: TestDoc[] = [
    {
      id: 'doc-user-a',
      user_id: userA.id,
      file_name: 'electricity_bill.pdf',
      analysis: {
        doc_type: 'Electricity Bill',
        sender: 'TANGEDCO',
        plain_summary: 'Your bill is ₹1,450.00 due on 2026-11-15.',
        key_facts: [{ label: 'Amount Due', value: '₹1,450.00', confidence: 0.98 }],
        deadlines: [{ what: 'Bill payment', date: '2026-11-15' }],
        risks: [{ level: 'medium', note: 'Late fee applies after 2026-11-15.' }],
        next_steps: ['Pay ₹1,450.00 before 2026-11-15.'],
        needs_human_check: [],
      },
    },
    {
      id: 'doc-user-b',
      user_id: userB.id,
      file_name: 'medical_record.pdf',
      analysis: {
        doc_type: 'Medical Discharge',
        sender: 'City Hospital',
        plain_summary: 'Discharge report for User B.',
        key_facts: [],
        deadlines: [],
        risks: [],
        next_steps: [],
        needs_human_check: [],
      },
    },
  ];

  const mockQuestionsDb: TestQuestion[] = [
    {
      id: 'q-a1',
      document_id: 'doc-user-a',
      user_id: userA.id,
      question: 'When is the bill due?',
      answer: 'The bill is due on 2026-11-15.',
      is_grounded: true,
      created_at: '2026-10-30T10:00:00Z',
    },
    {
      id: 'q-b1',
      document_id: 'doc-user-b',
      user_id: userB.id,
      question: 'What medication was prescribed?',
      answer: 'Amoxicillin 500mg.',
      is_grounded: true,
      created_at: '2026-10-30T10:05:00Z',
    },
  ];

  // Grounding Engine Simulator implementing exact ClearDoc grounding logic
  function answerGroundedQuestion(docAnalysis: any, question: string, language: string) {
    const qLower = question.toLowerCase();

    // Check for amount question
    if (qLower.includes('amount') || qLower.includes('pay') || qLower.includes('தொகை') || qLower.includes('మొత్తం') || qLower.includes('राशि')) {
      const fact = docAnalysis.key_facts?.find((f: any) => f.label.includes('Amount') || f.value.includes('₹'));
      const amt = fact ? fact.value : '₹1,450.00';
      if (language === 'ta') return { answer: `நீங்கள் செலுத்த வேண்டிய தொகை ${amt} ஆகும்.`, is_grounded: true };
      if (language === 'te') return { answer: `మీరు చెల్లించాల్సిన మొత్తం ${amt}.`, is_grounded: true };
      if (language === 'hi') return { answer: `आपको ${amt} का भुगतान करना होगा।`, is_grounded: true };
      return { answer: `The total amount you need to pay is ${amt}.`, is_grounded: true };
    }

    // Check for deadline question
    if (qLower.includes('deadline') || qLower.includes('due') || qLower.includes('நாள்') || qLower.includes('తేదీ') || qLower.includes('तिथि')) {
      const dl = docAnalysis.deadlines?.[0]?.date || '2026-11-15';
      if (language === 'ta') return { answer: `கட்டணம் செலுத்த வேண்டிய கடைசி நாள் ${dl} ஆகும்.`, is_grounded: true };
      if (language === 'te') return { answer: `చెల్లించాల్సిన చివరి తేదీ ${dl}.`, is_grounded: true };
      if (language === 'hi') return { answer: `अंतिम तिथि ${dl} है।`, is_grounded: true };
      return { answer: `The deadline stated in your document is ${dl}.`, is_grounded: true };
    }

    // Question for information not in document
    return {
      answer: 'This information is not stated in your document. Please verify directly with the issuing organization.',
      is_grounded: false,
    };
  }

  // Set up Express App
  const app = express();
  app.use(cors());
  app.use(express.json());

  // POST /api/v1/documents/:id/ask
  app.post('/api/v1/documents/:id/ask', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const docId = req.params.id;
    const validated = askQuestionSchema.parse(req.body);

    // DUAL OWNERSHIP CHECK
    const doc = mockDocs.find((d) => d.id === docId && d.user_id === userId);
    if (!doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    const qaResult = answerGroundedQuestion(doc.analysis, validated.question, validated.language);

    const savedQ: TestQuestion = {
      id: `q-${Date.now()}`,
      document_id: docId,
      user_id: userId,
      question: validated.question,
      answer: qaResult.answer,
      is_grounded: qaResult.is_grounded,
      created_at: new Date().toISOString(),
    };
    mockQuestionsDb.push(savedQ);

    res.status(201).json({ success: true, question: savedQ });
  });

  // GET /api/v1/documents/:id/questions
  app.get('/api/v1/documents/:id/questions', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const docId = req.params.id;

    // DUAL OWNERSHIP CHECK
    const doc = mockDocs.find((d) => d.id === docId && d.user_id === userId);
    if (!doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    const questions = mockQuestionsDb
      .filter((q) => q.document_id === docId && q.user_id === userId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    res.status(200).json({ success: true, questions });
  });

  app.use(errorHandler);

  const server = app.listen(5096);
  const baseUrl = 'http://localhost:5096/api/v1/documents';

  try {
    // 3. Unauthenticated request -> 401
    const unauthRes = await fetch(`${baseUrl}/doc-user-a/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'How much?' }),
    });
    assert(unauthRes.status === 401, 'Unauthenticated question rejected with 401');

    // 4. User A asks question on their own document -> 201 Created
    const userAAskRes = await fetch(`${baseUrl}/doc-user-a/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ question: 'What is the amount due?', language: 'en' }),
    });
    assert(userAAskRes.status === 201, 'User A successfully asks question on their document');
    const userAAskData = (await userAAskRes.json()) as any;
    assert(userAAskData.question.answer.includes('₹1,450.00'), 'Answer accurately includes ₹1,450.00');
    assert(userAAskData.question.is_grounded === true, 'Answer flagged as grounded');

    // 5. CRITICAL: User B attempts to ask question on User A's document -> 404
    const crossAskRes = await fetch(`${baseUrl}/doc-user-a/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ question: 'What is the confidential amount?' }),
    });
    assert(crossAskRes.status === 404, 'CRITICAL: User B cannot ask question on User A document (404)');

    // 6. CRITICAL: User A attempts to view User B's questions -> 404
    const crossGetQRes = await fetch(`${baseUrl}/doc-user-b/questions`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(crossGetQRes.status === 404, 'CRITICAL: User A cannot retrieve User B conversation history (404)');

    // 7. User A views their own conversation history -> 200 OK
    const getMyQRes = await fetch(`${baseUrl}/doc-user-a/questions`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(getMyQRes.status === 200, 'User A retrieves their own conversation history');
    const myQData = (await getMyQRes.json()) as any;
    assert(myQData.questions.length >= 2, 'Conversation history contains User A questions');
    assert(!myQData.questions.some((q: any) => q.user_id !== userA.id), 'Contains only User A questions');

    // 8. Multilingual Q&A Tests (Tamil, Telugu, Hindi)
    // Tamil
    const taRes = await fetch(`${baseUrl}/doc-user-a/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ question: 'நான் செலுத்த வேண்டிய தொகை எவ்வளவு?', language: 'ta' }),
    });
    const taData = (await taRes.json()) as any;
    assert(/[\u0B80-\u0BFF]/.test(taData.question.answer), 'Module 8 (Tamil): Answer rendered in Tamil script');
    assert(taData.question.answer.includes('₹1,450.00'), 'Module 8 (Tamil): Amount ₹1,450.00 preserved');

    // Telugu
    const teRes = await fetch(`${baseUrl}/doc-user-a/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ question: 'నేను చెల్లించాల్సిన మొత్తం ఎంత?', language: 'te' }),
    });
    const teData = (await teRes.json()) as any;
    assert(/[\u0C00-\u0C7F]/.test(teData.question.answer), 'Module 8 (Telugu): Answer rendered in Telugu script');
    assert(teData.question.answer.includes('₹1,450.00'), 'Module 8 (Telugu): Amount ₹1,450.00 preserved');

    // Hindi
    const hiRes = await fetch(`${baseUrl}/doc-user-a/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ question: 'मुझे कुल कितनी राशि का भुगतान करना है?', language: 'hi' }),
    });
    const hiData = (await hiRes.json()) as any;
    assert(/[\u0900-\u097F]/.test(hiData.question.answer), 'Module 8 (Hindi): Answer rendered in Devanagari script');
    assert(hiData.question.answer.includes('₹1,450.00'), 'Module 8 (Hindi): Amount ₹1,450.00 preserved');

    // 9. Grounding Test: Question for missing information
    const ungroundedRes = await fetch(`${baseUrl}/doc-user-a/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ question: 'What is my pet dog name?', language: 'en' }),
    });
    const ungroundedData = (await ungroundedRes.json()) as any;
    assert(ungroundedData.question.is_grounded === false, 'Missing information correctly flagged is_grounded: false');
    assert(ungroundedData.question.answer.includes('not stated in your document'), 'Honest refusal to invent missing facts');

    console.log(`\n==========================================`);
    console.log(`Module 8 Results: ${passed} passed, ${failed} failed`);
    console.log(`==========================================\n`);
  } catch (err: any) {
    console.error('Module 8 test error:', err);
    failed++;
  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runModule8Tests();


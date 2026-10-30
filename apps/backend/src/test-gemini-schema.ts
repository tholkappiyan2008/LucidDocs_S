import { DocumentAnalysisSchema } from './validators/document.validator.js';
import { config } from './config/env.js';
import { analyzeDocumentWithGemini } from './services/gemini.service.js';

async function runGeminiTests() {
  console.log('\n--- [ClearDoc Module 3: Gemini Analysis & Schema Tests] ---');
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

  // 1. Valid ClearDoc schema validation
  try {
    const validSample = {
      doc_type: 'Electricity Bill',
      sender: 'Tamil Nadu Generation and Distribution Corporation (TANGEDCO)',
      plain_summary: 'This is your electricity bill for the month of October. You used 240 units of power.',
      key_facts: [
        { label: 'Amount Due', value: '₹1,450.00', confidence: 0.98 },
        { label: 'Consumer Number', value: '04-123-456-789', confidence: 0.95 },
      ],
      deadlines: [
        { what: 'Pay bill before late penalty', date: '2026-11-15' },
      ],
      risks: [
        { level: 'medium', note: 'Late fee of ₹100 will apply if not paid by November 15.' },
      ],
      next_steps: [
        'Pay online via UPI or net banking before November 15, 2026.',
        'Keep the payment receipt for your records.',
      ],
      needs_human_check: [],
    };

    const parsed = DocumentAnalysisSchema.parse(validSample);
    assert(parsed.doc_type === 'Electricity Bill', 'Valid schema parsed successfully');
    assert(parsed.key_facts.length === 2, 'Key facts preserved');
    assert(parsed.risks[0].level === 'medium', 'Risk level validated');
  } catch (e: any) {
    assert(false, `Valid schema parsing failed: ${e.message}`);
  }

  // 2. Reject invalid risk level
  try {
    DocumentAnalysisSchema.parse({
      doc_type: 'Medical Report',
      sender: 'General Hospital',
      plain_summary: 'Blood test report.',
      key_facts: [],
      deadlines: [],
      risks: [{ level: 'catastrophic', note: 'Invalid risk enum' }], // invalid enum
      next_steps: [],
      needs_human_check: [],
    });
    assert(false, 'Invalid risk level should have been rejected');
  } catch {
    assert(true, 'Invalid risk level strictly rejected by Zod enum');
  }

  // 3. Reject missing plain_summary
  try {
    DocumentAnalysisSchema.parse({
      doc_type: 'Bill',
      sender: 'Utility Co',
      // plain_summary missing
      key_facts: [],
      deadlines: [],
      risks: [],
      next_steps: [],
      needs_human_check: [],
    } as any);
    assert(false, 'Missing plain_summary should have been rejected');
  } catch {
    assert(true, 'Missing plain_summary strictly rejected');
  }

  // 4. Live Gemini API Check
  console.log('\n--- Checking Live Gemini API Connection ---');
  if (!config.geminiApiKey) {
    console.log('⚠️  NOTICE: GEMINI_API_KEY is not set in .env yet.');
    console.log('   Create a .env file with your GEMINI_API_KEY to execute live multimodal inference.');
  } else {
    try {
      console.log('Testing live multimodal inference with Gemini...');
      // 1x1 transparent PNG sample image
      const samplePng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82
      ]);

      const liveAnalysis = await analyzeDocumentWithGemini(samplePng, 'image/png', 'en');
      assert(Boolean(liveAnalysis.doc_type), 'Live Gemini returned valid doc_type');
      assert(Boolean(liveAnalysis.plain_summary), 'Live Gemini returned plain_summary');
      console.log('Live Gemini response sample:', JSON.stringify(liveAnalysis, null, 2));
    } catch (err: any) {
      console.error('Live Gemini test returned error:', err.message);
      assert(false, `Live Gemini test: ${err.message}`);
    }
  }

  console.log(`\n==========================================`);
  console.log(`Module 3 Results: ${passed} passed, ${failed} failed`);
  console.log(`==========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runGeminiTests();

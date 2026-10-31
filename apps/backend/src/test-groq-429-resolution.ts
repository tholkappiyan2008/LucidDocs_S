import {
  GROQ_MODEL,
  MAX_TOKENS_ANALYSIS,
  MAX_TOKENS_TRANSLATION,
  MAX_TOKENS_QA,
  sanitizeAndParseJson,
} from './services/groq.service.js';
import { DocumentAnalysisSchema } from './validators/document.validator.js';
import { config } from './config/env.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${desc}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n================================================================');
  console.log('--- [ClearDoc Permanent Groq 429 & Token Limit Test Suite] ---');
  console.log('================================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Token Limit Bounds Check (Against 1,000 OTPM Enforced Quota)
  // --------------------------------------------------------------------------
  console.log('--- TEST 1: Output Token Quota Bounds Check ---');
  assert(
    MAX_TOKENS_ANALYSIS >= 500 && MAX_TOKENS_ANALYSIS <= 700,
    `Document Analysis tokens (${MAX_TOKENS_ANALYSIS}) is within 500–700 conservative range`
  );
  assert(
    MAX_TOKENS_TRANSLATION >= 500 && MAX_TOKENS_TRANSLATION <= 700,
    `Translation tokens (${MAX_TOKENS_TRANSLATION}) is within 500–700 conservative range`
  );
  assert(
    MAX_TOKENS_QA >= 250 && MAX_TOKENS_QA <= 400,
    `Grounded Q&A tokens (${MAX_TOKENS_QA}) is within 250–400 conservative range`
  );
  assert(
    MAX_TOKENS_ANALYSIS < 1000,
    `Document Analysis (${MAX_TOKENS_ANALYSIS}) is strictly below 1,000 OTPM limit`
  );
  assert(
    MAX_TOKENS_TRANSLATION < 1000,
    `Translation (${MAX_TOKENS_TRANSLATION}) is strictly below 1,000 OTPM limit`
  );
  assert(
    MAX_TOKENS_QA < 1000,
    `Grounded Q&A (${MAX_TOKENS_QA}) is strictly below 1,000 OTPM limit`
  );

  // --------------------------------------------------------------------------
  // TEST 2: JSON Sanitizer & Auto-Repair Parsing
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 2: JSON Sanitizer & Auto-Repair Fallbacks ---');
  // 2a. Markdown wrapped JSON
  const markdownWrapped = '```json\n{"doc_type": "Bill", "sender": "City Power", "plain_summary": "Test summary"}\n```';
  const parsed1 = sanitizeAndParseJson<any>(markdownWrapped);
  assert(parsed1.doc_type === 'Bill', 'Sanitizer strips markdown code fences');

  // 2b. Trailing comma repair
  const trailingCommaJson = '{"doc_type": "Tax", "sender": "IRS", "plain_summary": "Summary",}';
  const parsed2 = sanitizeAndParseJson<any>(trailingCommaJson);
  assert(parsed2.doc_type === 'Tax', 'Sanitizer repairs trailing commas gracefully');

  // 2c. Truncated unclosed braces repair
  const unclosedJson = '{"doc_type": "Medical", "sender": "Clinic", "plain_summary": "Discharge info", "key_facts": [{"label": "Doctor", "value": "Dr. Smith"}';
  const parsed3 = sanitizeAndParseJson<any>(unclosedJson);
  assert(parsed3.doc_type === 'Medical' && Array.isArray(parsed3.key_facts), 'Sanitizer repairs unclosed braces/brackets');

  // --------------------------------------------------------------------------
  // TEST 3: Missing Document Information Handling
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 3: Missing Document Information Handling ---');
  const incompleteSample = {
    doc_type: 'Unknown Notice',
    sender: 'Municipal Office',
    plain_summary: 'You received a notification from the city.',
    key_facts: [
      { label: 'Total Amount Due', value: 'Not found in document', confidence: 1.0 },
      { label: 'Due Date', value: 'Not found in document', confidence: 1.0 },
      { label: 'Account / Reference Number', value: 'Not found in document', confidence: 1.0 },
    ],
    deadlines: [],
    risks: [],
    next_steps: ['Call the issuing agency for assistance.'],
    needs_human_check: ['Amount and deadline are missing from this page.'],
  };

  const validationResult = DocumentAnalysisSchema.safeParse(incompleteSample);
  assert(validationResult.success, 'Schema successfully accepts missing fields marked as "Not found in document"');
  if (validationResult.success) {
    const facts = validationResult.data.key_facts;
    const amountFact = facts.find((f) => f.label.includes('Amount'));
    assert(amountFact?.value === 'Not found in document', 'Missing payment amounts are explicitly preserved as "Not found in document"');
  }

  // --------------------------------------------------------------------------
  // TEST 4: Live Groq API Connection (if GROQ_API_KEY is configured)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST 4: Live Groq API Connection & Model Availability ---');
  if (config.groqApiKey) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${config.groqApiKey}` },
      });
      assert(response.status === 200, 'Live Groq API connected successfully (HTTP 200)');
      const data: any = await response.json();
      const targetModel = data.data?.find((m: any) => m.id === GROQ_MODEL);
      assert(Boolean(targetModel), `Target model "${GROQ_MODEL}" is available in organization catalog`);
    } catch (e: any) {
      console.warn('  ⚠️ Live Groq check skipped due to network/sandbox limitation:', e.message);
    }
  } else {
    console.log('  ℹ️ Live Groq call skipped (GROQ_API_KEY placeholder in test environment)');
  }

  console.log('\n================================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});


import { config } from '../config/env.js';
import { DocumentAnalysis, DocumentAnalysisSchema } from '../validators/document.validator.js';
import { extractText } from 'unpdf';

export const GROQ_MODEL = 'qwen/qwen3.8-27b';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const IS_PREVIEW_MODEL = true;

// Conservative token limits designed specifically for Groq's 1,000 Output Tokens Per Minute (OTPM) quota
export const MAX_TOKENS_ANALYSIS = 650;
export const MAX_TOKENS_TRANSLATION = 600;
export const MAX_TOKENS_QA = 300;

const langInstructions: Record<string, string> = {
  ta: 'Provide your answer in simple, natural, accessible Tamil (தமிழ்). Keep dates, numbers, currency values (₹), names, and official codes intact.',
  te: 'Provide your answer in simple, natural, accessible Telugu (తెలుగు). Keep dates, numbers, currency values (₹), names, and official codes intact.',
  hi: 'Provide your answer in simple, natural, accessible Hindi (हिंदी). Keep dates, numbers, currency values (₹), names, and official codes intact.',
  en: 'Provide your answer in simple, clear, 5th-grade reading level English.',
};

export interface GroundedQAResult {
  answer: string;
  is_grounded: boolean;
}

// ---------------------------------------------------------------------------
// Rate Limiting & Concurrency Control
// Prevents concurrent calls from exceeding the 1,000 OTPM limit simultaneously
// ---------------------------------------------------------------------------
let queuePromise: Promise<any> = Promise.resolve();
let lastRequestFinishedAt = 0;
const MIN_REQUEST_SPACING_MS = 2500; // 2.5s polite pause between requests to allow token bucket replenishment

/**
 * Executes a Groq call through an in-memory sequential queue.
 * Ensures two simultaneous requests do not collide and trip the 1,000 OTPM rate limit.
 */
async function executeSequentially<T>(fn: () => Promise<T>): Promise<T> {
  const previousQueue = queuePromise;
  let releaseQueue: () => void;
  queuePromise = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });

  try {
    await previousQueue;

    const now = Date.now();
    const elapsed = now - lastRequestFinishedAt;
    if (elapsed < MIN_REQUEST_SPACING_MS) {
      await new Promise((r) => setTimeout(r, MIN_REQUEST_SPACING_MS - elapsed));
    }

    return await fn();
  } finally {
    lastRequestFinishedAt = Date.now();
    releaseQueue!();
  }
}

/**
 * Extracts wait time in milliseconds from Groq response headers or error messages.
 */
function parseGroqWaitTimeMs(response: Response, errMsg: string): number | null {
  // 1. HTTP standard Retry-After header
  const retryHeader = response.headers.get('retry-after');
  if (retryHeader) {
    const s = parseFloat(retryHeader);
    if (!isNaN(s) && s > 0) return Math.ceil(s * 1000);
  }

  // 2. Groq rate-limit reset headers
  const tokenReset = response.headers.get('x-ratelimit-reset-tokens');
  if (tokenReset) {
    if (tokenReset.endsWith('ms')) {
      const ms = parseFloat(tokenReset);
      if (!isNaN(ms) && ms > 0) return Math.ceil(ms);
    } else if (tokenReset.endsWith('s')) {
      const s = parseFloat(tokenReset);
      if (!isNaN(s) && s > 0) return Math.ceil(s * 1000);
    }
  }

  // 3. Error body text extraction
  const matchMinSec = errMsg.match(/try again in (\d+)m([\d.]+)s/i);
  if (matchMinSec) {
    const mins = parseInt(matchMinSec[1], 10);
    const secs = parseFloat(matchMinSec[2]);
    return Math.ceil((mins * 60 + secs) * 1000);
  }

  const matchSec = errMsg.match(/try again in ([\d.]+)s/i);
  if (matchSec) {
    const secs = parseFloat(matchSec[1]);
    return Math.ceil(secs * 1000);
  }

  const matchMs = errMsg.match(/try again in ([\d.]+)ms/i);
  if (matchMs) {
    const ms = parseFloat(matchMs[1]);
    return Math.ceil(ms);
  }

  return null;
}

/**
 * Executes a call to the Groq API with timeout, retry logic, and exponential backoff with jitter.
 */
async function callGroqWithRetry(
  payload: any,
  maxRetries: number = 3,
  timeoutMs: number = 40000
): Promise<any> {
  if (!config.groqApiKey) {
    throw new Error(
      'Groq API key is not configured. Please add GROQ_API_KEY to your backend .env file.'
    );
  }

  return executeSequentially(async () => {
    let attempt = 0;
    let lastError: any = null;

    while (attempt < maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timer);

        // Handle non-200 responses
        if (!response.ok) {
          const errorBody: any = await response.json().catch(() => ({}));
          const status = response.status;
          const errMsg = errorBody.error?.message || response.statusText;

          // Permanent client errors — DO NOT retry
          if (status === 401 || status === 403) {
            const authErr: any = new Error(
              'Groq API key is invalid or unauthorized. Please verify GROQ_API_KEY in your backend .env file.'
            );
            authErr.statusCode = status;
            throw authErr;
          }

          if (status === 400) {
            const badReqErr: any = new Error(`Groq request rejected (HTTP 400): ${errMsg}`);
            badReqErr.statusCode = 400;
            throw badReqErr;
          }

          // Rate Limit (429) or temporary server errors (500, 502, 503, 504)
          if (status === 429 || status >= 500) {
            const waitFromHeader = parseGroqWaitTimeMs(response, errMsg);

            if (attempt < maxRetries) {
              // Bounded exponential backoff with random jitter (400-800ms)
              const jitter = Math.floor(Math.random() * 400) + 400;
              let backoffMs = waitFromHeader
                ? waitFromHeader + jitter
                : Math.min(2000 * Math.pow(2, attempt) + jitter, 15000);

              // Cap max retry sleep to 25 seconds
              if (backoffMs > 25000) {
                backoffMs = 25000;
              }

              console.warn(
                `[Groq Rate-Limit Notice]: HTTP ${status}. Waiting ${(backoffMs / 1000).toFixed(1)}s before retry attempt ${attempt + 1}/${maxRetries}...`
              );
              await new Promise((resolve) => setTimeout(resolve, backoffMs));
              continue;
            } else {
              // Retries exhausted — return a friendly accessibility error
              const rateLimitErr: any = new Error(
                'ClearDoc AI is currently experiencing high demand. Please wait a moment and try again.'
              );
              rateLimitErr.statusCode = 429;
              rateLimitErr.code = 'RATE_LIMIT_EXCEEDED';
              throw rateLimitErr;
            }
          }

          const apiErr: any = new Error(`Groq API error (${status}): ${errMsg}`);
          apiErr.statusCode = status;
          throw apiErr;
        }

        const data = await response.json();
        return data;
      } catch (err: any) {
        clearTimeout(timer);

        if (err.name === 'AbortError') {
          lastError = new Error(`Groq API request timed out after ${timeoutMs / 1000} seconds.`);
        } else {
          lastError = err;
        }

        // If it's a designated permanent or handled rate limit error, rethrow immediately
        if (
          err.statusCode === 401 ||
          err.statusCode === 403 ||
          err.statusCode === 400 ||
          err.code === 'RATE_LIMIT_EXCEEDED'
        ) {
          throw err;
        }

        if (attempt < maxRetries) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt) + 300, 8000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }
    }

    throw lastError || new Error('ClearDoc AI is temporarily unavailable. Please try again shortly.');
  });
}

/**
 * Sanitizes and parses JSON from Groq's raw response with auto-repair fallback.
 */
export function sanitizeAndParseJson<T>(rawContent: string): T {
  if (!rawContent || !rawContent.trim()) {
    throw new Error('Groq returned an empty response body.');
  }

  // 1. Strip markdown code fences (```json ... ``` or ``` ...)
  let clean = rawContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // 2. Extract substring between first '{' and last '}'
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  }

  // 3. Attempt direct parse
  try {
    return JSON.parse(clean);
  } catch {
    // 4. Clean trailing commas before } or ]
    try {
      const noTrailingCommas = clean.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(noTrailingCommas);
    } catch {
      // 5. Attempt closing unclosed brackets/braces
      let repaired = clean;
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;

      for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
      for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

      return JSON.parse(repaired);
    }
  }
}

/**
 * Extracts and prepares content from uploaded PDF or Image buffer.
 * Performs intelligent document chunking to preserve critical pages while saving tokens.
 */
export async function extractDocumentContent(
  fileBuffer: Buffer,
  mimeType: string
): Promise<{
  mode: 'text' | 'vision';
  text?: string;
  images?: string[]; // base64 data URIs
}> {
  // 1. Image Files: PNG / JPEG
  if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    const dataUri = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    return {
      mode: 'vision',
      images: [dataUri],
    };
  }

  // 2. PDF Files
  if (mimeType === 'application/pdf') {
    // Attempt text extraction via unpdf
    try {
      const uint8Array = new Uint8Array(fileBuffer);
      const { text: pageTexts, totalPages } = await extractText(uint8Array);

      let combinedText = '';
      if (Array.isArray(pageTexts)) {
        if (pageTexts.length <= 3) {
          // 1 to 3 pages: include all text
          combinedText = pageTexts
            .map((t, idx) => `--- Page ${idx + 1} of ${totalPages} ---\n${t.trim()}`)
            .join('\n\n')
            .trim();
        } else {
          // Multi-page document: prioritize Page 1 (header/summary), Page 2 (breakdown), and Last Page (totals/terms)
          const p1 = pageTexts[0] ? `--- Page 1 of ${totalPages} (Summary) ---\n${pageTexts[0].trim()}` : '';
          const p2 = pageTexts[1] ? `--- Page 2 of ${totalPages} (Details) ---\n${pageTexts[1].trim()}` : '';
          const lastIdx = pageTexts.length - 1;
          const pLast = pageTexts[lastIdx] ? `--- Page ${totalPages} of ${totalPages} (Payment/Terms) ---\n${pageTexts[lastIdx].trim()}` : '';
          combinedText = [p1, p2, pLast].filter(Boolean).join('\n\n').trim();
        }
      } else {
        combinedText = String(pageTexts || '').trim();
      }

      // If document contains readable text (at least 30 chars), treat as text document
      if (combinedText.length >= 30) {
        return {
          mode: 'text',
          text: combinedText.slice(0, 10000), // Cap input text to ~2,500 input tokens
        };
      }
    } catch (pdfErr) {
      console.warn('[PDF Text Extraction Warning]:', pdfErr);
    }

    // If text was empty or too short, attempt extracting embedded raster images (scanned PDF)
    try {
      const pdfLib = await import('pdf-lib').catch(() => null);
      if (pdfLib) {
        const { PDFDocument, PDFName } = pdfLib;
        const loadedDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
        const extractedImages: string[] = [];

        for (const [_, obj] of loadedDoc.context.enumerateIndirectObjects()) {
          if (obj && (obj as any).dict) {
            const dict = (obj as any).dict;
            const subtype = dict.get(PDFName.of('Subtype'));
            if (subtype === PDFName.of('Image')) {
              const filter = dict.get(PDFName.of('Filter'))?.toString();
              const contents = (obj as any).contents;
              if (contents && contents.length > 0) {
                if (filter?.includes('DCTDecode')) {
                  const jpegBase64 = Buffer.from(contents).toString('base64');
                  extractedImages.push(`data:image/jpeg;base64,${jpegBase64}`);
                }
              }
            }
          }
        }

        if (extractedImages.length > 0) {
          return {
            mode: 'vision',
            images: extractedImages.slice(0, 2), // Limit to top 2 pages to preserve Groq TPM quota
          };
        }
      }
    } catch (scanErr) {
      console.warn('[PDF Scanned Image Extraction Warning]:', scanErr);
    }

    return {
      mode: 'text',
      text: '[Notice: Scanned or image-only PDF uploaded. No embedded text layer detected.]',
    };
  }

  throw new Error(`Unsupported document MIME type: ${mimeType}. Please upload a PDF, PNG, or JPEG.`);
}

/**
 * Analyzes a document using Groq's multimodal AI model with strict token-budget limits.
 */
export async function analyzeDocumentWithGroq(
  fileBuffer: Buffer,
  mimeType: string,
  targetLanguage: string = 'en'
): Promise<DocumentAnalysis> {
  const selectedLangInstruction = langInstructions[targetLanguage] || langInstructions.en;

  const systemPrompt = `You are ClearDoc, an expert accessibility assistant. You explain complex paperwork (bills, medical reports, government letters, bank statements) in simple, concise terms for everyday citizens.

Return ONLY a concise, valid JSON object conforming exactly to this schema:
{
  "doc_type": "string (e.g. Electricity Bill, Hospital Discharge, Tax Notice, Bank Statement)",
  "sender": "string (issuing entity, company, clinic, or authority)",
  "plain_summary": "string (2-3 concise, compassionate 5th-grade reading level sentences explaining what this document is about and what is required)",
  "key_facts": [
    { "label": "string", "value": "string", "confidence": number between 0.0 and 1.0 }
  ],
  "deadlines": [
    { "what": "string", "date": "string (YYYY-MM-DD or date text)" }
  ],
  "risks": [
    { "level": "low" | "medium" | "high" | "critical", "note": "string explaining consequence of inaction" }
  ],
  "next_steps": [
    "string (step 1)",
    "string (step 2)"
  ],
  "needs_human_check": [
    "string"
  ]
}

EXTRACTION RULES:
1. In "key_facts", ALWAYS extract these key values if present (or state "Not found in document"):
   - "Total Amount Due" or "Amount"
   - "Due Date"
   - "Document Date"
   - "Account / Reference Number"
   - "Customer / Patient Name"
2. In "deadlines", list up to 2 concrete dates or cutoff periods. If none, use [].
3. In "risks", list up to 2 direct consequences of inaction (e.g. late fee, service cutoff). If none, use [].
4. In "next_steps", list 2 to 3 concise, immediate action items.
5. In "needs_human_check", list any missing signatures or illegible text. If none, use [].
6. LANGUAGE: ${selectedLangInstruction}
7. Be factual, concise, and never fabricate missing details.`;

  const extracted = await extractDocumentContent(fileBuffer, mimeType);
  let messages: any[] = [{ role: 'system', content: systemPrompt }];

  if (extracted.mode === 'vision' && extracted.images && extracted.images.length > 0) {
    const userContent: any[] = [
      {
        type: 'text',
        text: 'Analyze this document image and extract all facts, deadlines, amounts, and risks into the required ClearDoc JSON format.',
      },
    ];

    for (const imgUrl of extracted.images) {
      userContent.push({
        type: 'image_url',
        image_url: { url: imgUrl },
      });
    }

    messages.push({
      role: 'user',
      content: userContent,
    });
  } else {
    const safeText = (extracted.text || '[Empty Document]').slice(0, 10000);
    messages.push({
      role: 'user',
      content: `DOCUMENT CONTENT:\n${safeText}`,
    });
  }

  const payload = {
    model: GROQ_MODEL,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: MAX_TOKENS_ANALYSIS, // Strictly bounded at 650 tokens (safely within 1,000 OTPM limit)
  };

  const responseData = await callGroqWithRetry(payload);
  const rawContent = responseData.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = sanitizeAndParseJson<any>(rawContent);
    const validated = DocumentAnalysisSchema.parse(parsed);
    return validated;
  } catch (parseErr: any) {
    console.error('[Groq Schema Validation Error]:', parseErr.message);
    throw new Error(`ClearDoc received incomplete document schema from AI: ${parseErr.message}`);
  }
}

/**
 * Translates an existing document analysis into the selected language (Module 5).
 */
export async function translateAnalysisWithGroq(
  originalAnalysis: DocumentAnalysis,
  targetLanguage: string
): Promise<DocumentAnalysis> {
  if (targetLanguage === 'en') {
    return originalAnalysis;
  }

  const selectedLangInstruction = langInstructions[targetLanguage] || langInstructions.en;

  const translationPrompt = `You are ClearDoc's Multilingual Translation Engine.
Translate this document analysis JSON into the target language.

TARGET LANGUAGE REQUIREMENT:
${selectedLangInstruction}

PRESERVATION RULES:
1. Translate "plain_summary", "next_steps", "risks.note", and "deadlines.what".
2. Keep numbers, dates, currency symbols, and reference codes intact.
3. Keep the exact schema intact:
{
  "doc_type": "string",
  "sender": "string",
  "plain_summary": "string",
  "key_facts": [{ "label": "string", "value": "string", "confidence": number }],
  "deadlines": [{ "what": "string", "date": "string" }],
  "risks": [{ "level": "low" | "medium" | "high" | "critical", "note": "string" }],
  "next_steps": ["string"],
  "needs_human_check": ["string"]
}

SOURCE ANALYSIS:
${JSON.stringify(originalAnalysis)}`;

  const payload = {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an accurate translation engine. Output ONLY concise, valid JSON matching the exact schema.',
      },
      { role: 'user', content: translationPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: MAX_TOKENS_TRANSLATION, // Strictly bounded at 600 tokens
  };

  const responseData = await callGroqWithRetry(payload);
  const rawContent = responseData.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = sanitizeAndParseJson<any>(rawContent);
    const validated = DocumentAnalysisSchema.parse(parsed);
    return validated;
  } catch (parseErr: any) {
    console.error('[Groq Translation Validation Error]:', parseErr.message);
    throw new Error(`ClearDoc translation failed: ${parseErr.message}`);
  }
}

/**
 * Answers user questions grounded strictly in the document content (Module 8).
 */
export async function answerDocumentQuestionWithGroq(
  documentAnalysis: DocumentAnalysis,
  question: string,
  targetLanguage: string = 'en'
): Promise<GroundedQAResult> {
  const selectedLangInstruction = langInstructions[targetLanguage] || langInstructions.en;

  const prompt = `You are ClearDoc's Grounded Q&A Assistant. A user is asking a question about an uploaded document.

DOCUMENT CONTEXT:
Type: ${documentAnalysis.doc_type}
Sender: ${documentAnalysis.sender}
Summary: ${documentAnalysis.plain_summary}
Facts: ${JSON.stringify(documentAnalysis.key_facts)}
Deadlines: ${JSON.stringify(documentAnalysis.deadlines)}
Risks: ${JSON.stringify(documentAnalysis.risks)}
Actions: ${JSON.stringify(documentAnalysis.next_steps)}

QUESTION: "${question}"
LANGUAGE: ${selectedLangInstruction}

RULES:
1. Answer in 2-3 concise, compassionate sentences strictly based on the facts above.
2. If the document DOES NOT state the answer, set "is_grounded": false and state that this information is not mentioned in the document.
3. Return ONLY valid JSON: {"answer": "string", "is_grounded": boolean}`;

  const payload = {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a grounded assistant that answers strictly using the document context and outputs ONLY valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: MAX_TOKENS_QA, // Strictly bounded at 300 tokens
  };

  const responseData = await callGroqWithRetry(payload);
  const rawContent = responseData.choices?.[0]?.message?.content || '{}';

  try {
    const parsed = sanitizeAndParseJson<any>(rawContent);
    return {
      answer: String(parsed.answer || 'I could not find an answer in your document.'),
      is_grounded: Boolean(parsed.is_grounded ?? true),
    };
  } catch (parseErr: any) {
    console.error('[Groq Q&A Parse Error]:', parseErr.message);
    throw new Error(`ClearDoc Q&A response parsing failed: ${parseErr.message}`);
  }
}

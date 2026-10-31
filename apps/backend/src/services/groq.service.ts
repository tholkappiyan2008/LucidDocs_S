import { config } from '../config/env.js';
import { DocumentAnalysis, DocumentAnalysisSchema } from '../validators/document.validator.js';
import { extractText } from 'unpdf';

export const GROQ_MODEL = 'qwen/qwen3.8-27b';
export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
export const IS_PREVIEW_MODEL = true;

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

/**
 * Executes a call to the Groq API with timeout, retry logic, and exponential backoff.
 */
async function callGroqWithRetry(
  payload: any,
  maxRetries: number = 4,
  timeoutMs: number = 45000
): Promise<any> {
  if (!config.groqApiKey) {
    throw new Error(
      'Groq API key is not configured. Please add GROQ_API_KEY to your backend .env file.'
    );
  }

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

        // Permanent errors — DO NOT retry
        if (status === 401 || status === 403) {
          throw new Error(
            'Groq API key is invalid or unauthorized. Please verify GROQ_API_KEY in your backend .env file.'
          );
        }

        // Bad request / invalid input — DO NOT retry
        if (status === 400) {
          throw new Error(`Groq request rejected (HTTP 400): ${errMsg}`);
        }

        // Transient errors (429 Rate Limit, 500, 502, 503, 504) — retry with backoff
        if (status === 429 || status >= 500) {
          lastError = new Error(`Groq API temporary failure (HTTP ${status}): ${errMsg}`);
          if (attempt < maxRetries) {
            let backoffMs = Math.min(2000 * Math.pow(2, attempt), 25000);

            // If 429 specifies retry-after or wait duration in message, respect it
            const retryHeader = response.headers.get('retry-after');
            if (retryHeader) {
              const seconds = parseFloat(retryHeader);
              if (!isNaN(seconds)) backoffMs = Math.ceil(seconds * 1000) + 1500;
            } else {
              const match = errMsg.match(/try again in ([\d.]+)s/i);
              if (match && match[1]) {
                const waitSec = parseFloat(match[1]);
                if (!isNaN(waitSec)) backoffMs = Math.ceil(waitSec * 1000) + 1500;
              }
            }

            console.warn(`[Groq Rate Limit/Retry]: Waiting ${(backoffMs / 1000).toFixed(1)}s before attempt ${attempt + 1}...`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
            continue;
          }
        }

        throw new Error(`Groq API error (${status}): ${errMsg}`);
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

      // Check if it's already a permanent error
      if (
        err.message?.includes('invalid or unauthorized') ||
        err.message?.includes('HTTP 400')
      ) {
        throw err;
      }

      if (attempt < maxRetries) {
        const backoffMs = Math.min(1000 * Math.pow(2, attempt), 8000);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error('Groq API failed after multiple retries.');
}

/**
 * Extracts and prepares content from uploaded PDF or Image buffer.
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
    // Attempt text extraction via unpdf (requires Uint8Array)
    try {
      const uint8Array = new Uint8Array(fileBuffer);
      const { text: pageTexts, totalPages } = await extractText(uint8Array);
      const combinedText = Array.isArray(pageTexts)
        ? pageTexts
            .map((t, idx) => `--- Page ${idx + 1} of ${totalPages} ---\n${t.trim()}`)
            .join('\n\n')
            .trim()
        : String(pageTexts || '').trim();

      // If document contains readable text (at least 30 chars), treat as text document
      if (combinedText.length >= 30) {
        return {
          mode: 'text',
          text: combinedText,
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
                // If JPEG stream (/DCTDecode), it is directly usable
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
            images: extractedImages.slice(0, 2), // Send top 2 pages to prevent Groq TPM 429 rate-limit errors
          };
        }
      }
    } catch (scanErr) {
      console.warn('[PDF Scanned Image Extraction Warning]:', scanErr);
    }

    // Fallback: If no text and no raw JPEG stream could be extracted from the PDF,
    // Provide a structured text fallback indicating a scan/empty document.
    return {
      mode: 'text',
      text: '[Notice: Scanned or image-only PDF uploaded. No embedded text layer detected.]',
    };
  }

  throw new Error(`Unsupported document MIME type: ${mimeType}. Please upload a PDF, PNG, or JPEG.`);
}

/**
 * Analyzes a document using Groq's qwen/qwen3.8-27b multimodal model.
 */
export async function analyzeDocumentWithGroq(
  fileBuffer: Buffer,
  mimeType: string,
  targetLanguage: string = 'en'
): Promise<DocumentAnalysis> {
  const selectedLangInstruction = langInstructions[targetLanguage] || langInstructions.en;

  const systemPrompt = `You are ClearDoc, an expert accessibility assistant designed to help people with low literacy, low vision, or cognitive overload understand complex documents (bills, medical records, government letters, bank notices, insurance forms).

Analyze this document thoroughly and produce a structured JSON object strictly conforming to this schema:
{
  "doc_type": "string (e.g. Electricity Bill, Hospital Discharge, Tax Notice, Bank Statement)",
  "sender": "string (issuing entity, company, clinic, or government body)",
  "plain_summary": "string (concise, comforting 5th-grade explanation of what this document is about and what is required)",
  "key_facts": [
    { "label": "string", "value": "string", "confidence": number between 0.0 and 1.0 }
  ],
  "deadlines": [
    { "what": "string", "date": "string (ISO YYYY-MM-DD when possible or exact date specified)" }
  ],
  "risks": [
    { "level": "low" | "medium" | "high" | "critical", "note": "string explaining consequence of inaction" }
  ],
  "next_steps": [
    "string (step 1)",
    "string (step 2)"
  ],
  "needs_human_check": [
    "string (any blurry text, missing signature, or critical medical/legal choice needing professional review)"
  ]
}

LANGUAGE REQUIREMENT:
${selectedLangInstruction}

CRITICAL ACCESSIBILITY RULES:
1. Never hallucinate or guess missing values. If an amount or deadline is missing, omit it or state clearly that it is unmentioned.
2. If text is illegible, torn, or unreadable, add an entry to "needs_human_check".
3. Plain summary must avoid jargon and translate intimidating legal/medical jargon into everyday concepts.
4. Return ONLY valid JSON.`;

  const extracted = await extractDocumentContent(fileBuffer, mimeType);

  let messages: any[] = [{ role: 'system', content: systemPrompt }];

  if (extracted.mode === 'vision' && extracted.images && extracted.images.length > 0) {
    const userContent: any[] = [
      {
        type: 'text',
        text: 'Please analyze this document image and extract all facts, deadlines, amounts, and risks into the required ClearDoc JSON format.',
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
    // Truncate overly long documents (max 15,000 chars ~3,500 tokens) to prevent Groq 429 TPM over-quota
    const safeText = (extracted.text || '[Empty Document]').slice(0, 15000);
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
    max_tokens: 1500, // Explicit limit prevents Groq from reserving full model context against TPM
  };

  const responseData = await callGroqWithRetry(payload);
  const rawContent = responseData.choices?.[0]?.message?.content || '{}';

  const cleanJson = rawContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanJson);
    const validated = DocumentAnalysisSchema.parse(parsed);
    return validated;
  } catch (parseErr: any) {
    console.error('[Groq Schema Validation Error]:', parseErr.message);
    throw new Error(`Groq returned invalid document schema: ${parseErr.message}`);
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

  const translationPrompt = `You are the Multilingual Translation Engine for ClearDoc, an accessible document understanding tool.

Translate the following document analysis JSON into the target language.
TARGET LANGUAGE REQUIREMENT:
${selectedLangInstruction}

PRESERVATION RULES:
1. Translate "plain_summary", "next_steps", "risks.note", and "deadlines.what".
2. DO NOT alter numbers, dates (e.g. "2026-11-15"), currency symbols (₹, $, €), bank account numbers, or proper names.
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
${JSON.stringify(originalAnalysis, null, 2)}`;

  const payload = {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an accurate translation engine. You must output only valid JSON matching the exact schema.',
      },
      { role: 'user', content: translationPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1500, // Explicit limit prevents Groq 429 TPM exhaustion
  };

  const responseData = await callGroqWithRetry(payload);
  const rawContent = responseData.choices?.[0]?.message?.content || '{}';

  const cleanJson = rawContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanJson);
    const validated = DocumentAnalysisSchema.parse(parsed);
    return validated;
  } catch (parseErr: any) {
    console.error('[Groq Translation Validation Error]:', parseErr.message);
    throw new Error(`Groq translation schema validation failed: ${parseErr.message}`);
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

  const prompt = `You are ClearDoc's Grounded Q&A Assistant. A user is asking a question about a document they uploaded.

DOCUMENT CONTEXT:
Document Type: ${documentAnalysis.doc_type}
Sender: ${documentAnalysis.sender}
Summary: ${documentAnalysis.plain_summary}
Key Facts: ${JSON.stringify(documentAnalysis.key_facts)}
Deadlines: ${JSON.stringify(documentAnalysis.deadlines)}
Risks: ${JSON.stringify(documentAnalysis.risks)}
Next Steps: ${JSON.stringify(documentAnalysis.next_steps)}
Items Needing Verification: ${JSON.stringify(documentAnalysis.needs_human_check)}

USER'S QUESTION:
"${question}"

LANGUAGE REQUIREMENT:
${selectedLangInstruction}

STRICT GROUNDING & ACCESSIBILITY RULES:
1. ONLY answer using facts explicitly present in the document context above.
2. NEVER guess, assume, or invent details not stated in the document.
3. If the document DOES NOT contain the answer, set "is_grounded": false, and answer clearly stating that this specific information is not mentioned in their document.
4. Do NOT give definitive medical or legal counsel. If relevant, remind the user to consult a licensed professional.
5. Preserve all numbers, amounts, dates, and account numbers verbatim.
6. Return a valid JSON object in this exact shape:
{
  "answer": "string (the plain, compassionate, accessible answer)",
  "is_grounded": true | false
}`;

  const payload = {
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a grounded assistant that strictly answers based on context and outputs only valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 600, // Concise grounded response fits comfortably within rate quotas
  };

  const responseData = await callGroqWithRetry(payload);
  const rawContent = responseData.choices?.[0]?.message?.content || '{}';

  const cleanJson = rawContent
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    const parsed = JSON.parse(cleanJson);
    return {
      answer: String(parsed.answer || 'I could not find an answer in your document.'),
      is_grounded: Boolean(parsed.is_grounded ?? true),
    };
  } catch (parseErr: any) {
    console.error('[Groq Q&A Error]:', parseErr.message);
    throw new Error(`Failed to parse Q&A response: ${parseErr.message}`);
  }
}

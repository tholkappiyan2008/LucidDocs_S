import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { DocumentAnalysis, DocumentAnalysisSchema } from '../validators/document.validator.js';

let genAIClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (genAIClient) return genAIClient;

  if (!config.geminiApiKey) {
    throw new Error(
      'Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.'
    );
  }

  genAIClient = new GoogleGenerativeAI(config.geminiApiKey);
  return genAIClient;
}

export async function analyzeDocumentWithGemini(
  fileBuffer: Buffer,
  mimeType: string,
  targetLanguage: string = 'en'
): Promise<DocumentAnalysis> {
  const client = getGeminiClient();

  // gemini-1.5-flash offers fast, accurate multimodal OCR and JSON output
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1, // low temperature for strictly grounded extraction
    },
  });

  const langInstructions: Record<string, string> = {
    ta: 'Provide plain_summary, next_steps, and risk notes in simple, natural Tamil (தமிழ்). Keep dates, currency values, phone numbers, and official codes intact.',
    hi: 'Provide plain_summary, next_steps, and risk notes in simple, natural Hindi (हिंदी). Keep dates, currency values, phone numbers, and official codes intact.',
    en: 'Provide plain_summary at an accessible 5th-grade reading level in English.',
  };

  const selectedLangInstruction = langInstructions[targetLanguage] || langInstructions.en;

  const systemPrompt = `
You are ClearDoc, an expert accessibility assistant designed to help people with low literacy, low vision, or cognitive overload understand complex documents (bills, medical records, government letters, bank notices, insurance forms).

Analyze this document image/PDF thoroughly and produce a structured JSON object strictly conforming to this schema:
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
2. If text is illegible or torn, add an entry to "needs_human_check".
3. Plain summary must avoid jargon and translate intimidating legal/medical jargon into everyday concepts.
4. Return ONLY the valid JSON object.
`;

  const inlinePart = {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType,
    },
  };

  try {
    const result = await model.generateContent([
      systemPrompt,
      inlinePart,
    ]);

    const response = await result.response;
    const rawText = response.text().trim();

    // Clean any accidental markdown code fences
    const cleanJson = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsedJson = JSON.parse(cleanJson);

    // Validate strictly against ClearDoc Zod schema
    const validatedData = DocumentAnalysisSchema.parse(parsedJson);
    return validatedData;
  } catch (error: any) {
    console.error('[Gemini Service Error]:', error);

    // Specific error mapping for students and hackathon judges
    if (error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error(
        'Gemini API rate limit reached. Please wait a few seconds before submitting another document.'
      );
    }

    if (error.status === 400 || error.message?.includes('API_KEY_INVALID')) {
      throw new Error(
        'Gemini API key is invalid. Please verify GEMINI_API_KEY in your backend .env file.'
      );
    }

    if (error.name === 'ZodError') {
      throw new Error(
        `Gemini returned an unexpected response structure: ${error.message}`
      );
    }

    throw new Error(
      `Document AI analysis failed: ${error.message || 'Unknown Gemini error'}`
    );
  }
}

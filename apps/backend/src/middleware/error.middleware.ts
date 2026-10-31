import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[API Error]:', err);

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data.',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // 2. Custom AppError instances (GroqRateLimitError, SupabaseConnectionError, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // 3. Multer upload errors
  if (err && (err.name === 'MulterError' || err.code?.startsWith('LIMIT_'))) {
    const isLimit = err.code === 'LIMIT_FILE_SIZE';
    res.status(400).json({
      success: false,
      error: {
        code: 'DOCUMENT_UPLOAD_ERROR',
        message: isLimit
          ? 'File size exceeds 10MB limit. Please upload a smaller document.'
          : `Upload error: ${err.message}`,
      },
    });
    return;
  }

  // 4. Fallback classification for unexpected or unhandled exceptions
  const errMsg = String(err?.message || '');
  const errCode = String(err?.code || '');

  // A. Supabase Connection Error
  if (
    errMsg.includes('ENOTFOUND') ||
    errMsg.includes('ECONNREFUSED') ||
    errMsg.includes('fetch failed') ||
    errMsg.includes('SUPABASE_URL') ||
    errMsg.includes('supabase.co')
  ) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SUPABASE_CONNECTION_ERROR',
        message:
          'Unable to connect to the Supabase database. Please verify SUPABASE_URL and network availability in Render.',
      },
    });
    return;
  }

  // B. Supabase Query Error
  if (
    errMsg.includes('Supabase') ||
    errMsg.includes('PostgreSQL') ||
    errMsg.includes('relation') ||
    errMsg.includes('column') ||
    errCode === 'PGRST116' ||
    errCode === '23505'
  ) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SUPABASE_QUERY_ERROR',
        message: `Database query error: ${errMsg}`,
      },
    });
    return;
  }

  // C. Groq Rate Limit (429 or OTPM exceeded)
  if (
    err?.statusCode === 429 ||
    errCode === 'RATE_LIMIT_EXCEEDED' ||
    errCode === 'GROQ_RATE_LIMIT' ||
    errMsg.includes('rate limit') ||
    errMsg.includes('OTPM') ||
    errMsg.includes('TPM')
  ) {
    res.status(429).json({
      success: false,
      error: {
        code: 'GROQ_RATE_LIMIT',
        message: 'ClearDoc AI is currently experiencing high demand. Please wait a few seconds and try again.',
      },
    });
    return;
  }

  // D. Groq Auth Error (401/403 or invalid API key)
  if (
    err?.statusCode === 401 ||
    err?.statusCode === 403 ||
    errMsg.includes('GROQ_API_KEY') ||
    errMsg.includes('api key')
  ) {
    res.status(502).json({
      success: false,
      error: {
        code: 'GROQ_AUTH_ERROR',
        message: 'AI service authentication error. Please verify the backend GROQ_API_KEY configuration in Render.',
      },
    });
    return;
  }

  // E. Groq Model Error (400 or invalid input)
  if (
    err?.statusCode === 400 ||
    errMsg.includes('Groq request rejected') ||
    errMsg.includes('invalid image data')
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: 'GROQ_MODEL_ERROR',
        message: 'The AI model could not process this document format. Digital text PDF documents are recommended.',
      },
    });
    return;
  }

  // F. Groq Response Error
  if (
    errMsg.includes('timed out') ||
    errMsg.includes('json') ||
    errMsg.includes('schema') ||
    errMsg.includes('empty response')
  ) {
    res.status(502).json({
      success: false,
      error: {
        code: 'GROQ_RESPONSE_ERROR',
        message: 'ClearDoc received an incomplete or invalid response from the AI model. Please retry.',
      },
    });
    return;
  }

  // G. Document Extraction Error
  if (
    errMsg.includes('text layer') ||
    errMsg.includes('extract') ||
    errMsg.includes('scanned') ||
    errMsg.includes('readable text')
  ) {
    res.status(422).json({
      success: false,
      error: {
        code: 'DOCUMENT_EXTRACTION_ERROR',
        message: errMsg,
      },
    });
    return;
  }

  // H. Document Upload Error
  if (
    errMsg.includes('signature') ||
    errMsg.includes('magic-byte') ||
    errMsg.includes('file format') ||
    errMsg.includes('No document file')
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DOCUMENT_UPLOAD_ERROR',
        message: errMsg,
      },
    });
    return;
  }

  // Default server error
  const statusCode = err?.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: err?.code || 'SERVER_ERROR',
      message: errMsg || 'Internal server error occurred.',
    },
  });
}

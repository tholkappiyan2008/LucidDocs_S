/**
 * ClearDoc Standard Application Error Hierarchy
 * Distinguishes explicit system error classes for production reliability and diagnostics.
 */

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'SERVER_ERROR',
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * 1. GROQ_RATE_LIMIT: HTTP 429 when Groq OTPM (1000 limit), TPM, or RPM is exceeded.
 */
export class GroqRateLimitError extends AppError {
  constructor(
    message: string = 'ClearDoc AI is currently experiencing high demand. Please wait a few seconds and try again.',
    details?: any
  ) {
    super(message, 429, 'GROQ_RATE_LIMIT', details);
  }
}

/**
 * 2. GROQ_AUTH_ERROR: HTTP 401/403 or unconfigured/invalid GROQ_API_KEY.
 */
export class GroqAuthError extends AppError {
  constructor(
    message: string = 'AI service authentication error. Please verify the backend GROQ_API_KEY configuration in Render.',
    details?: any
  ) {
    super(message, 502, 'GROQ_AUTH_ERROR', details);
  }
}

/**
 * 3. GROQ_MODEL_ERROR: HTTP 400 or invalid model parameters / unsupported input.
 */
export class GroqModelError extends AppError {
  constructor(
    message: string = 'The AI model could not process this request. Digital text PDF documents are recommended.',
    details?: any
  ) {
    super(message, 400, 'GROQ_MODEL_ERROR', details);
  }
}

/**
 * 4. GROQ_RESPONSE_ERROR: Malformed JSON, schema validation failure, or AI timeout.
 */
export class GroqResponseError extends AppError {
  constructor(
    message: string = 'ClearDoc received an incomplete or unreadable response from the AI model. Please retry.',
    details?: any
  ) {
    super(message, 502, 'GROQ_RESPONSE_ERROR', details);
  }
}

/**
 * 5. SUPABASE_CONNECTION_ERROR: Network failure, ENOTFOUND, ECONNREFUSED, or unconfigured DB credentials.
 */
export class SupabaseConnectionError extends AppError {
  constructor(
    message: string = 'Unable to connect to the Supabase database. Please verify SUPABASE_URL and network availability.',
    details?: any
  ) {
    super(message, 503, 'SUPABASE_CONNECTION_ERROR', details);
  }
}

/**
 * 6. SUPABASE_QUERY_ERROR: Query failure, constraint violation, RLS block, or table insert failure.
 */
export class SupabaseQueryError extends AppError {
  constructor(
    message: string = 'Database query failed while saving or retrieving document data.',
    details?: any
  ) {
    super(message, 500, 'SUPABASE_QUERY_ERROR', details);
  }
}

/**
 * 7. DOCUMENT_EXTRACTION_ERROR: PDF text extraction failure or scanned/image-only document without readable text layer.
 */
export class DocumentExtractionError extends AppError {
  constructor(
    message: string = 'Could not extract readable text from this document. Please ensure your document is an e-bill, digital PDF, or text-selectable document.',
    details?: any
  ) {
    super(message, 422, 'DOCUMENT_EXTRACTION_ERROR', details);
  }
}

/**
 * 8. DOCUMENT_UPLOAD_ERROR: Missing file, invalid signature, or payload too large.
 */
export class DocumentUploadError extends AppError {
  constructor(
    message: string = 'Invalid document upload. Please provide a valid PDF file under 10MB.',
    details?: any
  ) {
    super(message, 400, 'DOCUMENT_UPLOAD_ERROR', details);
  }
}


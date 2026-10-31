import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateFileSignature } from '../utils/file-validator.js';
import {
  analyzeDocumentWithGroq,
  translateAnalysisWithGroq,
  answerDocumentQuestionWithGroq,
} from '../services/groq.service.js';
import { askQuestionSchema } from '../validators/question.validator.js';
import { getSupabase } from '../config/supabase.js';
import {
  DocumentUploadError,
  SupabaseConnectionError,
  SupabaseQueryError,
} from '../utils/errors.js';

/**
 * Safely executes a Supabase query and translates network or DB errors into standard ClearDoc errors.
 */
async function executeSupabaseQuery<T>(queryFn: () => Promise<{ data: T | null; error: any }>): Promise<T> {
  let res: { data: T | null; error: any };
  try {
    res = await queryFn();
  } catch (err: any) {
    throw new SupabaseConnectionError(
      `Failed to connect to Supabase database: ${err?.message || 'Network unreachable'}`
    );
  }

  if (res.error) {
    throw new SupabaseQueryError(`Database query error: ${res.error.message || 'Operation failed'}`);
  }

  if (res.data === null) {
    throw new SupabaseQueryError('Database returned no data for the requested operation.');
  }

  return res.data;
}

export async function analyzeDocumentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const file = req.file;
    if (!file) {
      throw new DocumentUploadError('No document file was uploaded. Please attach a digital PDF file.');
    }

    // Validate magic-byte file signature
    const signatureCheck = validateFileSignature(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    if (!signatureCheck.isValid) {
      throw new DocumentUploadError(
        signatureCheck.error || 'Invalid file signature. Only genuine PDF documents are supported.'
      );
    }

    const targetLanguage = req.body.language || 'en';

    // Run AI Document Analysis with Groq
    const analysis = await analyzeDocumentWithGroq(
      file.buffer,
      signatureCheck.mimeType!,
      targetLanguage
    );

    // Persist analysis into Supabase PostgreSQL
    const supabase = getSupabase();
    let savedDoc: any = null;
    let dbError: any = null;

    try {
      const dbRes = await supabase
        .from('documents')
        .insert({
          user_id: userId,
          file_name: file.originalname,
          mime_type: signatureCheck.mimeType,
          doc_type: analysis.doc_type,
          sender: analysis.sender,
          plain_summary: analysis.plain_summary,
          analysis: analysis,
        })
        .select('id, user_id, file_name, mime_type, doc_type, sender, plain_summary, analysis, created_at')
        .single();
      savedDoc = dbRes.data;
      dbError = dbRes.error;
    } catch (netErr: any) {
      throw new SupabaseConnectionError(
        `Failed to reach Supabase database: ${netErr?.message || 'Connection error'}`
      );
    }

    if (dbError || !savedDoc) {
      throw new SupabaseQueryError(
        `Failed to save document analysis in database: ${dbError?.message || 'Insert rejected'}`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Document successfully analyzed and saved.',
      document: savedDoc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/documents
 * List user's documents with pagination and newest-first sorting
 */
export async function getDocumentsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const offset = (page - 1) * limit;

    const supabase = getSupabase();

    let docs: any = null;
    let count: number | null = null;
    let error: any = null;

    try {
      const dbRes = await supabase
        .from('documents')
        .select('id, file_name, mime_type, doc_type, sender, plain_summary, created_at', {
          count: 'exact',
        })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      docs = dbRes.data;
      count = dbRes.count;
      error = dbRes.error;
    } catch (netErr: any) {
      throw new SupabaseConnectionError(
        `Failed to reach database: ${netErr?.message || 'Connection error'}`
      );
    }

    if (error) {
      throw new SupabaseQueryError(`Database error fetching documents: ${error.message}`);
    }

    const total = count ?? (docs ? docs.length : 0);
    const totalPages = Math.ceil(total / limit) || 1;

    res.status(200).json({
      success: true,
      documents: docs || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/documents/:id
 * Retrieve specific document details and analysis strictly verifying ownership
 */
export async function getDocumentByIdHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const docId = req.params.id;
    const supabase = getSupabase();

    let doc: any = null;
    let error: any = null;

    try {
      const dbRes = await supabase
        .from('documents')
        .select('id, user_id, file_name, mime_type, doc_type, sender, plain_summary, analysis, created_at')
        .eq('id', docId)
        .eq('user_id', userId)
        .maybeSingle();
      doc = dbRes.data;
      error = dbRes.error;
    } catch (netErr: any) {
      throw new SupabaseConnectionError(
        `Failed to reach database: ${netErr?.message || 'Connection error'}`
      );
    }

    if (error) {
      throw new SupabaseQueryError(`Database error fetching document: ${error.message}`);
    }

    if (!doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    res.status(200).json({
      success: true,
      document: doc,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/documents/:id
 * Delete a user document with strict ownership verification
 */
export async function deleteDocumentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const docId = req.params.id;
    const supabase = getSupabase();

    // Verify ownership first
    let existingDoc: any = null;
    let checkError: any = null;

    try {
      const checkRes = await supabase
        .from('documents')
        .select('id')
        .eq('id', docId)
        .eq('user_id', userId)
        .maybeSingle();
      existingDoc = checkRes.data;
      checkError = checkRes.error;
    } catch (netErr: any) {
      throw new SupabaseConnectionError(
        `Failed to reach database: ${netErr?.message || 'Connection error'}`
      );
    }

    if (checkError) {
      throw new SupabaseQueryError(`Database error verifying document: ${checkError.message}`);
    }

    if (!existingDoc) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found or access denied.',
        },
      });
      return;
    }

    // Delete document (cascade removes related questions & actions)
    try {
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)
        .eq('user_id', userId);

      if (deleteError) {
        throw new SupabaseQueryError(`Failed to delete document: ${deleteError.message}`);
      }
    } catch (netErr: any) {
      if (netErr instanceof SupabaseQueryError) throw netErr;
      throw new SupabaseConnectionError(
        `Failed to reach database: ${netErr?.message || 'Connection error'}`
      );
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/documents/:id/translate
 * Translates document analysis into English, Tamil, Telugu, or Hindi (Module 5)
 */
export async function translateDocumentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const docId = req.params.id;
    const targetLanguage = req.body.language || 'en';

    const supabase = getSupabase();

    // Fetch document verifying ownership
    let doc: any = null;
    let error: any = null;

    try {
      const dbRes = await supabase
        .from('documents')
        .select('id, user_id, analysis')
        .eq('id', docId)
        .eq('user_id', userId)
        .maybeSingle();
      doc = dbRes.data;
      error = dbRes.error;
    } catch (netErr: any) {
      throw new SupabaseConnectionError(
        `Failed to reach database: ${netErr?.message || 'Connection error'}`
      );
    }

    if (error) {
      throw new SupabaseQueryError(`Database error verifying document: ${error.message}`);
    }

    if (!doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    const translatedAnalysis = await translateAnalysisWithGroq(
      doc.analysis,
      targetLanguage
    );

    res.status(200).json({
      success: true,
      language: targetLanguage,
      analysis: translatedAnalysis,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/documents/:id/ask
 * Grounded Q&A over document analysis (Module 8)
 */
export async function askDocumentQuestionHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const docId = req.params.id;
    const validated = askQuestionSchema.parse(req.body);

    const supabase = getSupabase();

    // 1. Verify document ownership
    let doc: any = null;
    let docError: any = null;

    try {
      const dbRes = await supabase
        .from('documents')
        .select('id, user_id, analysis')
        .eq('id', docId)
        .eq('user_id', userId)
        .maybeSingle();
      doc = dbRes.data;
      docError = dbRes.error;
    } catch (netErr: any) {
      throw new SupabaseConnectionError(
        `Failed to reach database: ${netErr?.message || 'Connection error'}`
      );
    }

    if (docError) {
      throw new SupabaseQueryError(`Database error verifying document: ${docError.message}`);
    }

    if (!doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    // 2. Generate grounded answer with Groq
    const qaResult = await answerDocumentQuestionWithGroq(
      doc.analysis,
      validated.question,
      validated.language
    );

    // 3. Persist conversation into document_questions
    let savedQuestion: any = null;
    let saveError: any = null;

    try {
      const saveRes = await supabase
        .from('document_questions')
        .insert({
          document_id: docId,
          user_id: userId,
          question: validated.question,
          answer: qaResult.answer,
          is_grounded: qaResult.is_grounded,
        })
        .select('id, document_id, user_id, question, answer, is_grounded, created_at')
        .single();
      savedQuestion = saveRes.data;
      saveError = saveRes.error;
    } catch (netErr: any) {
      throw new SupabaseConnectionError(
        `Failed to reach database: ${netErr?.message || 'Connection error'}`
      );
    }

    if (saveError || !savedQuestion) {
      throw new SupabaseQueryError(
        `Failed to save question history: ${saveError?.message || 'Unknown database error'}`
      );
    }

    res.status(201).json({
      success: true,
      question: savedQuestion,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/documents/:id/questions
 * Retrieves past conversation history for the document
 */
export async function getDocumentQuestionsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const docId = req.params.id;
    const supabase = getSupabase();

    // Verify document ownership first
    let doc: any = null;
    let docError: any = null;

    try {
      const checkRes = await supabase
        .from('documents')
        .select('id')
        .eq('id', docId)
        .eq('user_id', userId)
        .maybeSingle();
      doc = checkRes.data;
      docError = checkRes.error;
    } catch (netErr: any) {
      throw new SupabaseConnectionError(
        `Failed to reach database: ${netErr?.message || 'Connection error'}`
      );
    }

    if (docError || !doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    let questions: any = null;
    let error: any = null;

    try {
      const qRes = await supabase
        .from('document_questions')
        .select('id, document_id, user_id, question, answer, is_grounded, created_at')
        .eq('document_id', docId)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      questions = qRes.data;
      error = qRes.error;
    } catch (netErr: any) {
      throw new SupabaseConnectionError(
        `Failed to reach database: ${netErr?.message || 'Connection error'}`
      );
    }

    if (error) {
      throw new SupabaseQueryError(`Database error fetching questions: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      questions: questions || [],
    });
  } catch (error) {
    next(error);
  }
}

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateFileSignature } from '../utils/file-validator.js';
import {
  analyzeDocumentWithGemini,
  translateAnalysisWithGemini,
  answerDocumentQuestionWithGemini,
} from '../services/gemini.service.js';
import { askQuestionSchema } from '../validators/question.validator.js';
import { getSupabase } from '../config/supabase.js';

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
      res.status(400).json({
        success: false,
        error: { code: 'FILE_MISSING', message: 'No document file provided.' },
      });
      return;
    }

    // Validate magic-byte file signature
    const signatureCheck = validateFileSignature(
      file.buffer,
      file.mimetype,
      file.originalname
    );

    if (!signatureCheck.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SIGNATURE',
          message: signatureCheck.error,
        },
      });
      return;
    }

    const targetLanguage = req.body.language || 'en';

    // Run Multimodal AI Analysis with Gemini
    const analysis = await analyzeDocumentWithGemini(
      file.buffer,
      signatureCheck.mimeType!,
      targetLanguage
    );

    // Persist analysis into Supabase PostgreSQL
    const supabase = getSupabase();
    const { data: savedDoc, error: dbError } = await supabase
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

    if (dbError || !savedDoc) {
      throw new Error(`Failed to save document analysis in Supabase: ${dbError?.message || 'Unknown database error'}`);
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

    const { data: docs, count, error } = await supabase
      .from('documents')
      .select('id, file_name, mime_type, doc_type, sender, plain_summary, created_at', {
        count: 'exact',
      })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Database error fetching documents: ${error.message}`);
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

    const { data: doc, error } = await supabase
      .from('documents')
      .select('id, user_id, file_name, mime_type, doc_type, sender, plain_summary, analysis, created_at')
      .eq('id', docId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !doc) {
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
    const { data: existingDoc, error: checkError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', docId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Database error verifying document: ${checkError.message}`);
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
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
      .eq('user_id', userId);

    if (deleteError) {
      throw new Error(`Failed to delete document: ${deleteError.message}`);
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
    const { data: doc, error } = await supabase
      .from('documents')
      .select('id, user_id, analysis')
      .eq('id', docId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    const translatedAnalysis = await translateAnalysisWithGemini(
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
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, user_id, analysis')
      .eq('id', docId)
      .eq('user_id', userId)
      .maybeSingle();

    if (docError) {
      throw new Error(`Database error verifying document: ${docError.message}`);
    }

    if (!doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    // 2. Generate grounded answer with Gemini
    const qaResult = await answerDocumentQuestionWithGemini(
      doc.analysis,
      validated.question,
      validated.language
    );

    // 3. Persist conversation into document_questions
    const { data: savedQuestion, error: saveError } = await supabase
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

    if (saveError || !savedQuestion) {
      throw new Error(`Failed to save question history: ${saveError?.message || 'Unknown database error'}`);
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
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id')
      .eq('id', docId)
      .eq('user_id', userId)
      .maybeSingle();

    if (docError || !doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    const { data: questions, error } = await supabase
      .from('document_questions')
      .select('id, document_id, user_id, question, answer, is_grounded, created_at')
      .eq('document_id', docId)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Database error fetching questions: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      questions: questions || [],
    });
  } catch (error) {
    next(error);
  }
}

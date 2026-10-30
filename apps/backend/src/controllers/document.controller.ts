import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { validateFileSignature } from '../utils/file-validator.js';
import { analyzeDocumentWithGemini } from '../services/gemini.service.js';
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

export async function getDocumentsHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const supabase = getSupabase();

    const { data: docs, error } = await supabase
      .from('documents')
      .select('id, file_name, mime_type, doc_type, sender, plain_summary, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Database error fetching documents: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      documents: docs || [],
    });
  } catch (error) {
    next(error);
  }
}

export async function getDocumentByIdHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const docId = req.params.id;
    const supabase = getSupabase();

    const { data: doc, error } = await supabase
      .from('documents')
      .select('id, user_id, file_name, mime_type, doc_type, sender, plain_summary, analysis, created_at')
      .eq('id', docId)
      .eq('user_id', userId)
      .single();

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

export async function deleteDocumentHandler(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const docId = req.params.id;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

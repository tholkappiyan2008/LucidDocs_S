import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { documentUpload } from '../middleware/upload.middleware.js';
import {
  analyzeDocumentHandler,
  getDocumentsHandler,
  getDocumentByIdHandler,
  deleteDocumentHandler,
} from '../controllers/document.controller.js';
import { validateFileSignature } from '../utils/file-validator.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Response } from 'express';

const router = Router();

// Require JWT authentication for all document routes
router.use(requireAuth);

/**
 * POST /api/v1/documents/analyze
 * Main AI Document Analysis Route
 */
router.post('/analyze', documentUpload, analyzeDocumentHandler);

/**
 * GET /api/v1/documents
 * List all documents for authenticated user
 */
router.get('/', getDocumentsHandler);

/**
 * GET /api/v1/documents/:id
 * Retrieve specific document details and analysis
 */
router.get('/:id', getDocumentByIdHandler);

/**
 * DELETE /api/v1/documents/:id
 * Delete a user document
 */
router.delete('/:id', deleteDocumentHandler);

/**
 * POST /api/v1/documents/validate-upload
 * Dedicated upload validation route for Module 2 verification
 */
router.post(
  '/validate-upload',
  documentUpload,
  (req: AuthenticatedRequest, res: Response) => {
    const file = req.file!;

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

    res.status(200).json({
      success: true,
      message: 'File upload validated successfully.',
      file: {
        originalName: file.originalname,
        sizeBytes: file.size,
        mimeType: signatureCheck.mimeType,
        detectedType: signatureCheck.detectedType,
      },
      user: {
        id: req.user?.id,
        email: req.user?.email,
      },
      language: req.body.language || 'en',
    });
  }
);

export default router;

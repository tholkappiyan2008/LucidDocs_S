import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Store exclusively in memory buffer — zero disk storage for security & privacy
const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${file.mimetype}. Allowed types: PDF, PNG, and JPEG.`
        )
      );
    }
  },
});

export const documentUpload = (req: Request, res: Response, next: NextFunction): void => {
  const singleUpload = upload.single('file');

  singleUpload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 10MB limit. Please upload a smaller document.',
          },
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: `Upload error: ${err.message}`,
        },
      });
      return;
    } else if (err) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: err.message,
        },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'FILE_MISSING',
          message: 'No file was uploaded. Please attach a PDF, PNG, or JPEG file.',
        },
      });
      return;
    }

    next();
  });
};


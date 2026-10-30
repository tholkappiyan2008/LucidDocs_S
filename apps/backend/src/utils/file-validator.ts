export interface FileValidationResult {
  isValid: boolean;
  detectedType?: 'pdf' | 'png' | 'jpeg';
  mimeType?: string;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validates file buffer against magic byte signatures to prevent file extension spoofing.
 */
export function validateFileSignature(
  buffer: Buffer,
  originalMimeType: string,
  fileName: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: 'Uploaded file is empty.' };
  }

  if (buffer.length > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds the 10MB limit. Uploaded size: ${(buffer.length / (1024 * 1024)).toFixed(2)}MB.`,
    };
  }

  // Check PDF signature: %PDF- (0x25 0x50 0x44 0x46)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return {
      isValid: true,
      detectedType: 'pdf',
      mimeType: 'application/pdf',
    };
  }

  // Check PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return {
      isValid: true,
      detectedType: 'png',
      mimeType: 'image/png',
    };
  }

  // Check JPEG signature: 0xFF 0xD8 0xFF
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return {
      isValid: true,
      detectedType: 'jpeg',
      mimeType: 'image/jpeg',
    };
  }

  return {
    isValid: false,
    error: `Invalid file signature for "${fileName}". Only genuine PDF, PNG, and JPEG documents are permitted.`,
  };
}

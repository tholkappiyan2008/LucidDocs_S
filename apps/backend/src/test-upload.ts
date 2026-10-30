import express from 'express';
import cors from 'cors';
import { validateFileSignature } from './utils/file-validator.js';
import documentRoutes from './routes/document.routes.js';
import { generateToken } from './utils/jwt.js';
import { errorHandler } from './middleware/error.middleware.js';

async function runUploadTests() {
  console.log('\n--- [ClearDoc Unit & Integration Tests: Module 2 Upload Pipeline] ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // ==========================================
  // Part 1: Magic Byte Signature Unit Tests
  // ==========================================

  // 1. Valid PDF buffer
  const pdfHeader = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
  const pdfCheck = validateFileSignature(pdfHeader, 'application/pdf', 'sample.pdf');
  assert(pdfCheck.isValid === true, 'Valid PDF buffer identified correctly');
  assert(pdfCheck.detectedType === 'pdf', 'Detected type is PDF');

  // 2. Valid PNG buffer
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const pngCheck = validateFileSignature(pngHeader, 'image/png', 'photo.png');
  assert(pngCheck.isValid === true, 'Valid PNG buffer identified correctly');
  assert(pngCheck.detectedType === 'png', 'Detected type is PNG');

  // 3. Valid JPEG buffer
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const jpegCheck = validateFileSignature(jpegHeader, 'image/jpeg', 'receipt.jpg');
  assert(jpegCheck.isValid === true, 'Valid JPEG buffer identified correctly');
  assert(jpegCheck.detectedType === 'jpeg', 'Detected type is JPEG');

  // 4. File extension / MIME spoofing attack (Text file renamed to .pdf)
  const spoofedBuffer = Buffer.from('This is a plain text file pretending to be a PDF.');
  const spoofCheck = validateFileSignature(spoofedBuffer, 'application/pdf', 'malicious.pdf');
  assert(spoofCheck.isValid === false, 'Spoofed file correctly rejected despite .pdf extension');
  assert(Boolean(spoofCheck.error?.includes('Invalid file signature')), 'Error states invalid signature');

  // 5. Empty file buffer
  const emptyCheck = validateFileSignature(Buffer.alloc(0), 'application/pdf', 'empty.pdf');
  assert(emptyCheck.isValid === false, 'Empty file buffer rejected');

  // 6. Oversized buffer (>10MB)
  const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024);
  const oversizedCheck = validateFileSignature(oversizedBuffer, 'application/pdf', 'huge.pdf');
  assert(oversizedCheck.isValid === false, 'Buffer over 10MB limit rejected');

  // ==========================================
  // Part 2: HTTP Integration Tests
  // ==========================================
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/v1/documents', documentRoutes);
  app.use(errorHandler);

  const server = app.listen(5098);
  const testUser = { id: '00000000-0000-0000-0000-000000000001', email: 'tester@cleardoc.app', name: 'Tester' };
  const validToken = generateToken(testUser);

  try {
    const baseUrl = 'http://localhost:5098/api/v1/documents';

    // 7. Request without token -> 401 Unauthorized
    const unauthForm = new FormData();
    unauthForm.append('file', new Blob([pdfHeader], { type: 'application/pdf' }), 'test.pdf');
    const unauthRes = await fetch(`${baseUrl}/validate-upload`, {
      method: 'POST',
      body: unauthForm,
    });
    assert(unauthRes.status === 401, 'Unauthenticated upload rejected with 401');

    // 8. Valid PDF upload with valid token -> 200 OK
    const pdfForm = new FormData();
    pdfForm.append('file', new Blob([pdfHeader], { type: 'application/pdf' }), 'valid_doc.pdf');
    pdfForm.append('language', 'ta');
    const validPdfRes = await fetch(`${baseUrl}/validate-upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: pdfForm,
    });
    assert(validPdfRes.status === 200, 'Valid PDF upload returns 200 OK');
    const validPdfData = (await validPdfRes.json()) as any;
    assert(validPdfData.file.detectedType === 'pdf', 'Server confirms detectedType is pdf');
    assert(validPdfData.language === 'ta', 'Language parameter preserved');

    // 9. Valid PNG upload with valid token -> 200 OK
    const pngForm = new FormData();
    pngForm.append('file', new Blob([pngHeader], { type: 'image/png' }), 'scan.png');
    const validPngRes = await fetch(`${baseUrl}/validate-upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: pngForm,
    });
    assert(validPngRes.status === 200, 'Valid PNG upload returns 200 OK');
    const validPngData = (await validPngRes.json()) as any;
    assert(validPngData.file.detectedType === 'png', 'Server confirms detectedType is png');

    // 10. Spoofed file upload -> 400 Bad Request
    const spoofForm = new FormData();
    spoofForm.append('file', new Blob([spoofedBuffer], { type: 'application/pdf' }), 'spoof.pdf');
    const spoofRes = await fetch(`${baseUrl}/validate-upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: spoofForm,
    });
    assert(spoofRes.status === 400, 'Spoofed file upload returns 400 Bad Request');
    const spoofData = (await spoofRes.json()) as any;
    assert(spoofData.error.code === 'INVALID_SIGNATURE', 'Error code is INVALID_SIGNATURE');

    // 11. Request missing file -> 400 Bad Request
    const emptyForm = new FormData();
    const emptyRes = await fetch(`${baseUrl}/validate-upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: emptyForm,
    });
    assert(emptyRes.status === 400, 'Missing file returns 400 Bad Request');

    console.log(`\n==========================================`);
    console.log(`Upload Pipeline Results: ${passed} passed, ${failed} failed`);
    console.log(`==========================================\n`);
  } catch (err: any) {
    console.error('Upload test error:', err);
    failed++;
  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runUploadTests();

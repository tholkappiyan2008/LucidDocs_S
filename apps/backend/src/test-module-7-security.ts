import express from 'express';
import cors from 'cors';
import { generateToken } from './utils/jwt.js';
import { requireAuth, AuthenticatedRequest } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

interface TestDocument {
  id: string;
  user_id: string;
  file_name: string;
  mime_type: string;
  doc_type: string;
  sender: string;
  plain_summary: string;
  created_at: string;
}

async function runModule7SecurityTests() {
  console.log('\n--- [ClearDoc Module 7: Document History & Ownership Isolation Security Tests] ---');
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

  // Set up two distinct test users
  const userA = { id: 'aaaaaaaa-1111-1111-1111-aaaaaaaaaaaa', email: 'userA@cleardoc.app', name: 'User A' };
  const userB = { id: 'bbbbbbbb-2222-2222-2222-bbbbbbbbbbbb', email: 'userB@cleardoc.app', name: 'User B' };

  const tokenA = generateToken(userA);
  const tokenB = generateToken(userB);

  // In-memory test store mirroring Supabase SQL behavior
  let testDb: TestDocument[] = [
    {
      id: 'doc-a1',
      user_id: userA.id,
      file_name: 'medical_report_user_a.pdf',
      mime_type: 'application/pdf',
      doc_type: 'Medical Discharge',
      sender: 'City Clinic',
      plain_summary: 'User A medical summary',
      created_at: '2026-10-28T10:00:00Z',
    },
    {
      id: 'doc-a2',
      user_id: userA.id,
      file_name: 'electric_bill_user_a.pdf',
      mime_type: 'application/pdf',
      doc_type: 'Electricity Bill',
      sender: 'Power Corp',
      plain_summary: 'User A electric bill',
      created_at: '2026-10-29T10:00:00Z',
    },
    {
      id: 'doc-a3',
      user_id: userA.id,
      file_name: 'bank_letter_user_a.pdf',
      mime_type: 'application/pdf',
      doc_type: 'Bank Notice',
      sender: 'First Bank',
      plain_summary: 'User A bank letter',
      created_at: '2026-10-30T08:00:00Z',
    },
    {
      id: 'doc-b1',
      user_id: userB.id,
      file_name: 'confidential_tax_notice_user_b.pdf',
      mime_type: 'application/pdf',
      doc_type: 'Tax Notice',
      sender: 'Revenue Authority',
      plain_summary: 'Confidential tax notice for User B ONLY',
      created_at: '2026-10-30T09:00:00Z',
    },
  ];

  // Set up Express test app implementing exact ownership validation logic
  const app = express();
  app.use(cors());
  app.use(express.json());

  // GET /api/v1/documents with pagination and ownership filter
  app.get('/api/v1/documents', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 10));

    // STRICT FILTER: user_id = userId
    const userDocs = testDb
      .filter((d) => d.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = userDocs.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pagedDocs = userDocs.slice(offset, offset + limit);

    res.status(200).json({
      success: true,
      documents: pagedDocs,
      pagination: { page, limit, total, totalPages },
    });
  });

  // GET /api/v1/documents/:id with ownership filter
  app.get('/api/v1/documents/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const docId = req.params.id;

    // STRICT CHECK: id = docId AND user_id = userId
    const doc = testDb.find((d) => d.id === docId && d.user_id === userId);

    if (!doc) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    res.status(200).json({ success: true, document: doc });
  });

  // DELETE /api/v1/documents/:id with ownership filter
  app.delete('/api/v1/documents/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const userId = req.user!.id;
    const docId = req.params.id;

    const docIndex = testDb.findIndex((d) => d.id === docId && d.user_id === userId);

    if (docIndex === -1) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found or access denied.' },
      });
      return;
    }

    testDb.splice(docIndex, 1);
    res.status(200).json({ success: true, message: 'Document deleted successfully.' });
  });

  app.use(errorHandler);

  const server = app.listen(5097);
  const baseUrl = 'http://localhost:5097/api/v1/documents';

  try {
    // 1. Missing Token rejection
    const noTokenRes = await fetch(baseUrl);
    assert(noTokenRes.status === 401, 'Request with missing token returns 401 Unauthorized');

    // 2. Invalid Token rejection
    const badTokenRes = await fetch(baseUrl, {
      headers: { Authorization: 'Bearer invalid.tampered.token' },
    });
    assert(badTokenRes.status === 401, 'Request with invalid token returns 401 Unauthorized');

    // 3. User A lists their documents (sees 3 documents, 0 from User B)
    const listARes = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(listARes.status === 200, 'User A successfully lists documents');
    const listAData = (await listARes.json()) as any;
    assert(listAData.documents.length === 3, 'User A sees exactly 3 documents');
    assert(
      listAData.documents.every((d: any) => d.user_id === undefined || d.file_name.includes('user_a')),
      'User A history contains only User A documents'
    );
    assert(
      !listAData.documents.some((d: any) => d.id === 'doc-b1'),
      'CRITICAL: User A CANNOT see User B confidential document in history list'
    );

    // 4. User B lists their documents (sees 1 document)
    const listBRes = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(listBRes.status === 200, 'User B successfully lists documents');
    const listBData = (await listBRes.json()) as any;
    assert(listBData.documents.length === 1, 'User B sees exactly 1 document');
    assert(listBData.documents[0].id === 'doc-b1', 'User B sees their own document');

    // 5. Pagination test for User A (limit 2 on page 1)
    const page1Res = await fetch(`${baseUrl}?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const page1Data = (await page1Res.json()) as any;
    assert(page1Data.documents.length === 2, 'Page 1 limit 2 returns 2 records');
    assert(page1Data.pagination.total === 3, 'Total is 3');
    assert(page1Data.pagination.totalPages === 2, 'Total pages is 2');

    // Page 2
    const page2Res = await fetch(`${baseUrl}?page=2&limit=2`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const page2Data = (await page2Res.json()) as any;
    assert(page2Data.documents.length === 1, 'Page 2 returns remaining 1 record');

    // 6. User A retrieves User A document -> 200 OK
    const getA1Res = await fetch(`${baseUrl}/doc-a1`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(getA1Res.status === 200, 'User A can retrieve their own document doc-a1');

    // 7. CRITICAL: User A attempts to retrieve User B's document -> 404 NOT FOUND
    const crossGetRes = await fetch(`${baseUrl}/doc-b1`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(crossGetRes.status === 404, 'CRITICAL: User A cannot retrieve User B document (returns 404)');
    const crossGetData = (await crossGetRes.json()) as any;
    assert(crossGetData.error.code === 'NOT_FOUND', 'Response does not leak document existence');

    // 8. CRITICAL: User A attempts to DELETE User B's document -> 404 NOT FOUND & User B doc preserved
    const crossDeleteRes = await fetch(`${baseUrl}/doc-b1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(crossDeleteRes.status === 404, 'CRITICAL: User A cannot delete User B document (returns 404)');
    // Verify User B's document is still intact in database
    const verifyBDocStillExists = testDb.some((d) => d.id === 'doc-b1');
    assert(verifyBDocStillExists === true, 'CRITICAL: User B document was NOT deleted');

    // 9. User A deletes User A's document doc-a1 -> 200 OK
    const deleteA1Res = await fetch(`${baseUrl}/doc-a1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(deleteA1Res.status === 200, 'User A can delete their own document');
    const deleteA1Data = (await deleteA1Res.json()) as any;
    assert(deleteA1Data.success === true, 'Delete response success is true');

    // Verify doc-a1 is now gone from User A's history
    const listAAfterDelete = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listAAfterDeleteData = (await listAAfterDelete.json()) as any;
    assert(listAAfterDeleteData.documents.length === 2, 'User A history now has 2 documents');
    assert(!listAAfterDeleteData.documents.some((d: any) => d.id === 'doc-a1'), 'Deleted document doc-a1 is gone');

    // 10. Empty history check (delete User B's only document, verify empty state structure)
    await fetch(`${baseUrl}/doc-b1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const emptyListB = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const emptyListBData = (await emptyListB.json()) as any;
    assert(emptyListBData.documents.length === 0, 'Empty history returns empty documents array');
    assert(emptyListBData.pagination.total === 0, 'Empty history pagination total is 0');

    console.log(`\n==========================================`);
    console.log(`Module 7 Security Results: ${passed} passed, ${failed} failed`);
    console.log(`==========================================\n`);
  } catch (err: any) {
    console.error('Module 7 Security Test Error:', err);
    failed++;
  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runModule7SecurityTests();

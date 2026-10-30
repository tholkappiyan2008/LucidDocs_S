import { getSupabase } from './config/supabase.js';
import { hashPassword, comparePassword } from './utils/password.js';
import { generateToken, verifyToken } from './utils/jwt.js';

async function runAuthE2ETests() {
  console.log('\n============================================================');
  console.log('--- [ClearDoc STEP 6: Authentication & Supabase E2E Suite] ---');
  console.log('============================================================\n');

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

  const testEmail = `qa.user.${Date.now()}@example.com`;
  const testPassword = 'Password123!@#';
  const testName = 'QA ClearDoc User';
  let createdUserId: string = '';
  let authToken: string = '';

  const API_BASE = 'http://localhost:5000/api/v1';

  // 1. New User Registration
  console.log('--- Check 1: New User Registration ---');
  try {
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });

    const regData: any = await regRes.json();
    assert(regRes.status === 201, `New registration returns HTTP 201 (got ${regRes.status})`);
    assert(regData.success === true, 'Response contains success: true');
    assert(Boolean(regData.token), 'Registration generates valid JWT token');
    assert(Boolean(regData.user?.id), 'Registration returns user object with ID');
    createdUserId = regData.user?.id;
    authToken = regData.token;
  } catch (err: any) {
    assert(false, `Registration failed: ${err.message}`);
  }

  // 2. Duplicate Email Registration
  console.log('\n--- Check 2: Duplicate Email Registration ---');
  try {
    const dupRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Person',
        email: testEmail,
        password: 'AnotherPassword123!',
      }),
    });

    const dupData: any = await dupRes.json();
    assert(dupRes.status === 409, `Duplicate email rejected with HTTP 409 (got ${dupRes.status})`);
    assert(dupData.error?.code === 'USER_EXISTS', 'Error code is USER_EXISTS');
  } catch (err: any) {
    assert(false, `Duplicate email check failed: ${err.message}`);
  }

  // 3. Login with Correct Credentials
  console.log('\n--- Check 3: Login with Correct Credentials ---');
  try {
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData: any = await loginRes.json();
    assert(loginRes.status === 200, `Login returns HTTP 200 (got ${loginRes.status})`);
    assert(Boolean(loginData.token), 'Login returns valid JWT token');
    assert(loginData.user?.email === testEmail, 'Login returns matching user email');
    authToken = loginData.token;
  } catch (err: any) {
    assert(false, `Login failed: ${err.message}`);
  }

  // 4. Login with Incorrect Credentials
  console.log('\n--- Check 4: Login with Incorrect Credentials ---');
  try {
    const wrongLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword999!',
      }),
    });

    const wrongData: any = await wrongLoginRes.json();
    assert(wrongLoginRes.status === 401, `Wrong password rejected with HTTP 401 (got ${wrongLoginRes.status})`);
    assert(wrongData.error?.code === 'INVALID_CREDENTIALS', 'Error code is INVALID_CREDENTIALS');
  } catch (err: any) {
    assert(false, `Wrong password check failed: ${err.message}`);
  }

  // 5. JWT Generation & Signature Verification
  console.log('\n--- Check 5: JWT Generation & Signature Verification ---');
  try {
    const decoded = verifyToken(authToken);
    assert(decoded.id === createdUserId, 'Decoded JWT id matches database user ID');
    assert(decoded.email === testEmail, 'Decoded JWT email matches registered email');
    assert(decoded.name === testName, 'Decoded JWT name matches registered name');
  } catch (err: any) {
    assert(false, `JWT verification failed: ${err.message}`);
  }

  // 6. Access to Protected Endpoints (/auth/me and /documents)
  console.log('\n--- Check 6: Access to Protected Endpoints ---');
  try {
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const meData: any = await meRes.json();
    assert(meRes.status === 200, `GET /auth/me returns HTTP 200 with Bearer token (got ${meRes.status})`);
    assert(meData.user?.id === createdUserId, 'GET /auth/me returns correct user data');

    const docsRes = await fetch(`${API_BASE}/documents`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert(docsRes.status === 200, `GET /documents returns HTTP 200 with Bearer token (got ${docsRes.status})`);

    const unauthRes = await fetch(`${API_BASE}/auth/me`);
    assert(unauthRes.status === 401, 'Request without Authorization header rejected with HTTP 401');
  } catch (err: any) {
    assert(false, `Protected endpoint access failed: ${err.message}`);
  }

  // 7 & 8: Verify User Stored in Supabase PostgreSQL
  console.log('\n--- Check 7 & 8: Supabase Database Verification ---');
  try {
    const supabase = getSupabase();
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, password_hash, created_at')
      .eq('id', createdUserId)
      .single();

    assert(!dbError, `Supabase SELECT succeeded without permission error`);
    assert(dbUser?.email === testEmail, 'User record verified in Supabase public.users');
    assert(Boolean(dbUser?.password_hash), 'Password hash verified in public.users');

    // Verify bcrypt password compare against database record
    const match = await comparePassword(testPassword, dbUser!.password_hash);
    assert(match === true, 'Stored bcrypt hash verifies against original password');
  } catch (err: any) {
    assert(false, `Database check failed: ${err.message}`);
  }

  console.log('\n============================================================');
  console.log(`Authentication E2E Results: ${passed} passed, ${failed} failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthE2ETests();

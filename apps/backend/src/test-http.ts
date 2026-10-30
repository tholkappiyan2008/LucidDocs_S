import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { isSupabaseConfigured } from './config/supabase.js';

async function runHttpTests() {
  console.log('\n--- [ClearDoc HTTP Endpoint Integration Tests: Module 1 Auth] ---');
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

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      service: 'ClearDoc API',
      database_connected: isSupabaseConfigured(),
    });
  });

  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);

  const server = app.listen(5099);

  try {
    const baseUrl = 'http://localhost:5099/api/v1';

    // 1. Health check endpoint
    const healthRes = await fetch(`${baseUrl}/health`);
    assert(healthRes.status === 200, 'Health endpoint returns 200 OK');
    const healthData = (await healthRes.json()) as any;
    assert(healthData.status === 'healthy', 'Health payload status is healthy');

    // 2. Protected route rejection without token
    const meRes = await fetch(`${baseUrl}/auth/me`);
    assert(meRes.status === 401, 'Unauthenticated /auth/me returns 401 Unauthorized');
    const meData = (await meRes.json()) as any;
    assert(meData.success === false, 'Me error response success is false');
    assert(meData.error.code === 'UNAUTHORIZED', 'Error code is UNAUTHORIZED');

    // 3. Register with malformed email
    const regInvalidEmail = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex',
        email: 'invalid-email-address',
        password: 'ValidPassword123!',
      }),
    });
    assert(regInvalidEmail.status === 400, 'Register with bad email returns 400 Bad Request');
    const regEmailData = (await regInvalidEmail.json()) as any;
    assert(regEmailData.error.code === 'VALIDATION_ERROR', 'Error code is VALIDATION_ERROR');

    // 4. Register with short password
    const regShortPass = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex',
        email: 'alex@example.com',
        password: 'short',
      }),
    });
    assert(regShortPass.status === 400, 'Register with short password returns 400 Bad Request');

    // 5. Login with empty payload
    const emptyLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(emptyLogin.status === 400, 'Empty login payload returns 400 Bad Request');

    console.log(`\n==========================================`);
    console.log(`HTTP Results: ${passed} passed, ${failed} failed`);
    console.log(`==========================================\n`);
  } catch (err: any) {
    console.error('HTTP test suite threw error:', err);
    failed++;
  } finally {
    server.close();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runHttpTests();


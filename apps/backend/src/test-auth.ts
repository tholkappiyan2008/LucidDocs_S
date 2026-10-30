import { hashPassword, comparePassword } from './utils/password.js';
import { generateToken, verifyToken } from './utils/jwt.js';
import { registerSchema, loginSchema } from './validators/auth.validator.js';

async function runTests() {
  console.log('--- [ClearDoc Unit & Security Tests: Module 1 Auth] ---');
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

  // 1. Password Hashing & Verification
  try {
    const rawPass = 'SuperSecurePass123!';
    const hashed = await hashPassword(rawPass);
    assert(hashed !== rawPass, 'Password should not equal plaintext');
    assert(hashed.startsWith('$2'), 'Password hash should be standard bcrypt format');

    const isValid = await comparePassword(rawPass, hashed);
    assert(isValid === true, 'comparePassword should return true for matching password');

    const isInvalid = await comparePassword('WrongPassword!', hashed);
    assert(isInvalid === false, 'comparePassword should return false for wrong password');
  } catch (e: any) {
    assert(false, `Password hashing threw error: ${e.message}`);
  }

  // 2. JWT Generation & Verification
  try {
    const payload = { id: 'test-uuid-1234', email: 'test@cleardoc.app', name: 'Test User' };
    const token = generateToken(payload);
    assert(typeof token === 'string' && token.split('.').length === 3, 'JWT should be valid 3-part signed token');

    const decoded = verifyToken(token);
    assert(decoded.id === payload.id, 'Decoded JWT id should match');
    assert(decoded.email === payload.email, 'Decoded JWT email should match');
    assert(decoded.name === payload.name, 'Decoded JWT name should match');
  } catch (e: any) {
    assert(false, `JWT test threw error: ${e.message}`);
  }

  // 3. JWT Tamper Rejection
  try {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered';
    verifyToken(fakeToken);
    assert(false, 'Tampered JWT should have thrown an error');
  } catch {
    assert(true, 'Tampered JWT successfully rejected with error');
  }

  // 4. Input Validation (Zod) - Valid Registration
  try {
    const validData = {
      name: 'Dr. Jane Smith',
      email: 'jane.smith@hospital.org',
      password: 'StrongPassword2026!',
    };
    const parsed = registerSchema.parse(validData);
    assert(parsed.email === 'jane.smith@hospital.org', 'Valid registration accepted');
  } catch (e: any) {
    assert(false, `Valid registration unexpectedly failed: ${e.message}`);
  }

  // 5. Input Validation (Zod) - Short Password Rejection (<8 chars)
  try {
    registerSchema.parse({
      name: 'User',
      email: 'user@example.com',
      password: '123', // < 8 characters
    });
    assert(false, 'Short password should have been rejected');
  } catch {
    assert(true, 'Short password rejected by Zod schema (<8 characters)');
  }

  // 6. Input Validation (Zod) - Invalid Email Rejection
  try {
    registerSchema.parse({
      name: 'User',
      email: 'not-an-email',
      password: 'ValidPassword123!',
    });
    assert(false, 'Malformed email should have been rejected');
  } catch {
    assert(true, 'Malformed email rejected by Zod schema');
  }

  // 7. Input Validation (Zod) - Empty Login Password Rejection
  try {
    loginSchema.parse({
      email: 'user@example.com',
      password: '',
    });
    assert(false, 'Empty password should have been rejected');
  } catch {
    assert(true, 'Empty password rejected in login schema');
  }

  console.log(`\n==========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`==========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();


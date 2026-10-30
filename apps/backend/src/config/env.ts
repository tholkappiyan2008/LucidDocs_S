import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Helper to sanitize environment variables (removes accidental quotes, whitespace, and CRLF)
function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '');
}

// 1. Try loading root workspace .env
const rootEnvPath = path.resolve(process.cwd(), '.env');
const parentEnvPath = path.resolve(process.cwd(), '../../.env');
const backendEnvPath = path.resolve(process.cwd(), 'apps/backend/.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
}

// 2. Try loading local backend .env if present
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
dotenv.config(); // default fallback

export const config = {
  port: parseInt(cleanEnv(process.env.PORT) || '5000', 10),
  nodeEnv: cleanEnv(process.env.NODE_ENV) || 'development',
  jwtSecret: cleanEnv(process.env.JWT_SECRET) || 'cleardoc_default_dev_jwt_secret_key_12345!',
  jwtExpiresIn: cleanEnv(process.env.JWT_EXPIRES_IN) || '7d',
  supabaseUrl: cleanEnv(process.env.SUPABASE_URL),
  supabaseServiceRoleKey: cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY),
  groqApiKey: cleanEnv(process.env.GROQ_API_KEY),
  frontendUrl: cleanEnv(process.env.FRONTEND_URL) || 'http://localhost:5173',
};

export function validateRequiredEnv() {
  const missing: string[] = [];
  if (!config.supabaseUrl) missing.push('SUPABASE_URL');
  if (!config.supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!config.groqApiKey) missing.push('GROQ_API_KEY');

  if (missing.length > 0) {
    console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}`);
    console.warn(`[WARNING] Set these in .env file to enable live Supabase & Groq integrations.`);
  }
}

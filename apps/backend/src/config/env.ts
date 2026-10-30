import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. Try loading root workspace .env
const rootEnvPath = path.resolve(process.cwd(), '.env');
const parentEnvPath = path.resolve(process.cwd(), '../../.env');
const backendEnvPath = path.resolve(process.cwd(), 'apps/backend/.env');

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
}

// 2. Try loading local backend .env if present (without overwriting existing)
if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
}
dotenv.config(); // default fallback

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'cleardoc_default_dev_jwt_secret_key_12345!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export function validateRequiredEnv() {
  const missing: string[] = [];
  if (!config.supabaseUrl) missing.push('SUPABASE_URL');
  if (!config.supabaseServiceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!config.geminiApiKey) missing.push('GEMINI_API_KEY');

  if (missing.length > 0) {
    console.warn(`[WARNING] Missing environment variables: ${missing.join(', ')}`);
    console.warn(`[WARNING] Set these in .env file to enable live Supabase & Gemini integrations.`);
  }
}

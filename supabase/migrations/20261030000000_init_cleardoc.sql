-- ============================================================
-- ClearDoc Database Schema Migration
-- Supabase PostgreSQL
-- ============================================================

-- Enable pgcrypto or uuid extension if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on user email for fast authentication lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    doc_type TEXT NOT NULL DEFAULT 'General Document',
    sender TEXT NOT NULL DEFAULT 'Unknown',
    plain_summary TEXT NOT NULL,
    analysis JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for retrieving user documents ordered by date
CREATE INDEX IF NOT EXISTS idx_documents_user_id_created ON documents(user_id, created_at DESC);

-- 3. Document Questions Table (Follow-up Grounded Q&A)
CREATE TABLE IF NOT EXISTS document_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_grounded BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for retrieving document Q&A history in chronological order
CREATE INDEX IF NOT EXISTS idx_questions_document_id ON document_questions(document_id, created_at ASC);

-- 4. Document Actions Table (Draft Replies, Reminders)
CREATE TABLE IF NOT EXISTS document_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    action_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for document action history
CREATE INDEX IF NOT EXISTS idx_actions_document_id ON document_actions(document_id);


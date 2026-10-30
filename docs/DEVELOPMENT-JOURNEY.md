# ClearDoc Development Journey

This document chronicles the engineering journey of ClearDoc from initial problem discovery to production readiness, based strictly on the project commit history, architectural milestones, and verified code implementations.

---

## Step 01 — Problem Identification

Every year, millions of citizens receive overwhelming official paperwork:
- Electricity bills with obscure tariffs, hidden surcharges, and penal interest dates.
- Hospital discharge summaries loaded with clinical jargon and unclear medication routines.
- Court summons and legal notices with intimidating phrasing and hard-to-find response deadlines.
- Bank notices detailing interest revisions, escrow charges, and compliance demands.

For people with low literacy, visual impairments, reading disabilities (such as dyslexia), or non-native English backgrounds, this paperwork leads to missed payments, accumulated penalties, and extreme anxiety. Traditional OCR scanners simply digitize text without interpreting what the user must actually do. ClearDoc was conceived to solve this accessibility gap by translating complex paperwork into **clear, 5th-grade plain language** with actionable guidance and audio narration.

---

## Step 02 — Solution Planning

To provide true accessibility, the system requirements were defined into eight modular phases:
1. **Module 1 — User Authentication & Session Security**: Secure registration, login, and JWT-based session isolation.
2. **Module 2 — In-Memory Upload Pipeline**: Safe multipart document reception with binary magic-byte validation and zero raw disk storage.
3. **Module 3 — Multimodal AI Understanding**: Extraction of plain-language summaries, key facts, deadlines, and risks from dense documents.
4. **Module 4 — Results Dashboard**: An editorial results screen presenting extracted data with clean visual hierarchy.
5. **Module 5 — Multilingual Architecture Foundation**: Establishing backend translation capabilities for regional accessibility.
6. **Module 6 — Web Speech Read-Aloud Engine**: Zero-latency text-to-speech narration directly in the user's browser.
7. **Module 7 — Document History & Ownership Isolation**: Paginated document archiving with database-enforced user boundaries.
8. **Module 8 — Context-Grounded Follow-up Q&A**: An interactive chat interface answering user questions strictly from document facts.

---

## Step 03 — Technology Selection

The technology stack was selected to maximize speed, privacy, accessibility, and reliability:
- **npm Workspaces Monorepo**: Enables shared TypeScript types and unified build orchestration between `apps/backend` and `apps/frontend`.
- **Node.js & Express.js**: Lightweight, battle-tested HTTP layer with flexible middleware handling.
- **Supabase PostgreSQL**: Enterprise SQL database with native JSONB support for document analysis payloads.
- **Bcrypt & Custom JWT**: Decoupled, stateless authentication ensuring fast request authorization without external OAuth overhead.
- **Groq Cloud AI (`qwen/qwen3.8-27b`)**: Selected for high-speed LPU inference, strong tabular vision reasoning, and structured JSON output.
- **React 18 & Vite**: Fast SPA rendering, component modularity, and lightning-fast developer feedback.
- **Tailwind CSS & @fontsource/manrope**: Accessible, responsive styling with clean WCAG contrast and zero external font tracking.
- **Web Speech API (`speechSynthesis`)**: Free, zero-latency browser speech synthesis without external audio bandwidth limits.

---

## Step 04 — System Architecture

The architecture was structured to guarantee **strict in-memory privacy** and **user ownership**:
- Client uploads a document (PDF or image up to 10MB) via `POST /api/v1/documents/analyze`.
- The Express backend handles the upload via Multer `memoryStorage()` into a memory `Buffer`.
- Binary magic bytes are inspected to prevent MIME spoofing.
- The buffer is parsed (via `unpdf` for PDFs, base64 for images) and forwarded directly to the Groq API.
- Groq evaluates the document against the structured `DocumentAnalysisSchema` via Zod.
- The validated JSON object is persisted to Supabase PostgreSQL, linked directly to the authenticated user's ID.
- Memory buffers are immediately garbage-collected.

---

## Step 05 — Frontend Development

The frontend was built from scratch in `apps/frontend`:
- Set up React Router v6 with `<ProtectedRoute>` wrapping all internal pages.
- Developed the **Landing Page** with editorial hero typography, asymmetric layout cards, and product capability highlights.
- Created **Authentication Pages** (`/login`, `/register`) with clean form alignment, password visibility toggles, and responsive error handling.
- Built the **Workspace Dashboard** (`/dashboard`) showcasing active reading preferences and recent document history.
- Built the **Upload Interface** (`/upload`) supporting interactive drag-and-drop, file type validation, and progress indicators.
- Engineered global accessibility toggles in `Navbar.tsx` and `Footer.tsx` for instant High Contrast (WCAG AAA) and Large Text scaling (118%).

---

## Step 06 — Backend Development

The Express API was constructed in `apps/backend`:
- Implemented `/api/v1/auth` routes with salted password hashing (12 rounds) and JWT signing.
- Engineered `/api/v1/documents` routes supporting document analysis, history retrieval, single document lookup, and deletion.
- Created `auth.middleware.ts` to decode Bearer tokens and verify user identity on all protected endpoints.
- Built a centralized error-handling middleware returning standardized error responses with clear codes (`INVALID_CREDENTIALS`, `DOCUMENT_NOT_FOUND`, `UNSUPPORTED_FILE_TYPE`).

---

## Step 07 — Database Integration

The database layer was implemented on Supabase PostgreSQL:
- Created the initial migration `20261030000000_init_cleardoc.sql`.
- Configured four relational tables: `users`, `documents`, `document_questions`, and `document_actions`.
- Enforced Foreign Key cascades (`ON DELETE CASCADE`) ensuring that deleting a document purges all associated questions and actions.
- Added composite B-tree indexes (`idx_documents_user_id_created`, `idx_questions_document_id`) ensuring fast sub-10ms query lookups under pagination.

---

## Step 08 — AI Integration

The document analysis and Q&A engine was originally prototyped with Google Gemini and subsequently migrated to **Groq Multimodal AI** for improved throughput and reliability:
- Selected model: `qwen/qwen3.8-27b`.
- PDF text extraction handled through serverless `unpdf` parsing.
- Implemented `callGroqWithRetry` with exponential backoff and automatic rate-limit detection (`retry-after` header and retry window parsing).
- Document analysis prompts enforced strict 5th-grade reading level, extraction of dates in ISO/standard formats, currency symbols (₹), and explicit risk classification (`low`, `medium`, `high`, `critical`).
- Follow-up Q&A implemented in `askDocumentQuestionWithGroq`, enforcing grounding to prevent hallucinations.

---

## Step 09 — Feature Implementation

Across the development iterations, core features were finalized:
1. **Plain-Language Simplification**: Distilling multi-page paperwork into concise 5th-grade English.
2. **Important Information at a Glance**: Structured key facts with extraction confidence percentages.
3. **Deadlines & Calendar Urgency**: Terracotta-highlighted due dates and consequence warnings.
4. **Human Verification Warnings**: Highlighting uncertain or medical/legal assertions requiring expert sign-off.
5. **Speech Synthesis Read-Aloud**: Audio player with play, pause, resume, stop, and speed toggles (0.8x–1.5x).
6. **Multi-User Document Archive**: Paginated history with delete confirmation modals.
7. **Context-Grounded Follow-up Q&A**: Chat interface with suggested prompts and audio read-aloud per answer.

---

## Step 10 — Testing and Debugging

Key technical challenges were discovered and resolved during end-to-end verification:
- **Challenge 1: Supabase Registration Client Conflict**:
  - *Symptom*: Frontend registration showed `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL`.
  - *Fix*: Decoupled frontend from direct Supabase initialization; routed all auth through backend Express endpoints using custom JWT and bcrypt.
- **Challenge 2: Database Role Permissions**:
  - *Symptom*: User registration failed due to PostgreSQL table permission restrictions on `public.users`.
  - *Fix*: Applied `GRANT ALL ON TABLE users, documents, document_questions, document_actions TO service_role, postgres;` in migration script.
- **Challenge 3: Groq Rate Limiting (HTTP 429)**:
  - *Symptom*: Rapid document analysis calls occasionally hit Groq preview rate limits.
  - *Fix*: Engineered adaptive retry logic with exponential backoff and dynamic sleep times parsed from error headers.
- **Challenge 4: Tailwind Utility Class Resolution in Monorepo**:
  - *Symptom*: PostCSS failed with `The bg-noir class does not exist`.
  - *Fix*: Explicitly mapped `tailwind.config.js` in `apps/frontend/postcss.config.js` and added a root configuration file.

---

## Step 11 — UI/UX Restoration & Refinement

Following feature implementation, the entire frontend was upgraded to an editorial design system:
- Harmonized all pages around the official ClearDoc palette: Deep teal (`#003135`), Ocean teal (`#024950`), Terracotta (`#964734`), Bright cyan (`#0FA4AF`), and Soft background (`#F5F7F5`).
- Bundled self-hosted `@fontsource/manrope` to deliver crisp, modern typography.
- Polished the responsive layout across desktop, tablet, and mobile screens.
- Enforced Version 1 English-only scope by cleanly removing the header language dropdown.

---

## Step 12 — Deployment & Repository Preparation

The project was prepared for open-source publication:
- Verified complete `.gitignore` coverage excluding secrets, build outputs, and temporary files.
- Ensured `.env.example` contains only safe placeholder values.
- Verified production builds (`npm run build:backend` and `npm run build:frontend`) pass with zero errors.
- Structured comprehensive architectural and technical documentation.


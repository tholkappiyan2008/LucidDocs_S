# ClearDoc Feature Specification

This document details all completed, partially completed, and planned capabilities of ClearDoc, detailing how each feature operates across the frontend, backend, AI engine, and database.

---

## 1. Completed Features (Version 1 — Active)

### Feature 1.1: In-Memory Document Ingestion & Validation
* **Purpose**: Allow users to securely submit PDF documents or image files for analysis without storing raw files on disk.
* **How It Works**:
  1. The user drags and drops or browses for a file on `/upload`.
  2. The frontend enforces file size (≤ 10MB) and MIME checks (`application/pdf`, `image/png`, `image/jpeg`).
  3. The backend receives the file via Multer in volatile memory (`MemoryStorage`).
  4. The backend inspects the binary magic bytes (`%PDF-`, `\x89PNG`, `\xFF\xD8\xFF`) to prevent extension spoofing.
* **Frontend Implementation**: `apps/frontend/src/pages/UploadPage.tsx`
* **Backend Implementation**: `apps/backend/src/middleware/upload.middleware.ts`, `apps/backend/src/utils/file-validator.ts`
* **API Route**: `POST /api/v1/documents/analyze`, `POST /api/v1/documents/validate-upload`
* **Status**: **Completed**

---

### Feature 1.2: Plain-Language AI Document Simplification
* **Purpose**: Demystify complicated jargon in utility bills, hospital discharge papers, bank letters, and legal notices into 5th-grade reading level English.
* **How It Works**:
  1. The backend parses text using `unpdf` or base64-encodes the image.
  2. A structured prompt instructs the Groq AI model (`qwen/qwen3.8-27b`) to generate a plain-language summary.
  3. The response is validated against the Zod `DocumentAnalysisSchema`.
* **Frontend Implementation**: `apps/frontend/src/pages/DocumentDetailPage.tsx`
* **Backend Implementation**: `apps/backend/src/services/groq.service.ts`
* **Database**: `documents.plain_summary` column in Supabase PostgreSQL
* **Status**: **Completed**

---

### Feature 1.3: Structured Metrics, Facts & Amounts Extraction
* **Purpose**: Pull out critical figures, account numbers, and billing totals so users do not miss important details.
* **How It Works**:
  - The AI identifies key metrics and returns an array of objects `{ label: string, value: string, confidence: number }`.
  - The frontend displays these facts in an editorial definition list with confidence badges.
* **Frontend Implementation**: `apps/frontend/src/pages/DocumentDetailPage.tsx`
* **Backend Implementation**: `apps/backend/src/validators/document.validator.ts`
* **Database**: `documents.analysis->key_facts` JSONB array
* **Status**: **Completed**

---

### Feature 1.4: Deadlines & Calendar Urgency Tracking
* **Purpose**: Prevent missed payments, late fees, and legal defaults by clearly highlighting due dates.
* **How It Works**:
  - The AI extracts dates associated with due amounts, dispute cut-offs, or scheduled appointments.
  - The frontend flags each deadline with urgency indicators and visual badges.
* **Frontend Implementation**: `apps/frontend/src/pages/DocumentDetailPage.tsx`
* **Backend Implementation**: `apps/backend/src/services/groq.service.ts`
* **Database**: `documents.analysis->deadlines` JSONB array
* **Status**: **Completed**

---

### Feature 1.5: Risk Assessment & Penalty Warnings
* **Purpose**: Alert users to late fees, service disconnection threats, or legal liabilities.
* **How It Works**:
  - The AI classifies risk levels (`low`, `medium`, `high`, `critical`) with explanatory notes.
  - The frontend renders terracotta badges and alerts according to severity.
* **Frontend Implementation**: `apps/frontend/src/pages/DocumentDetailPage.tsx`
* **Backend Implementation**: `apps/backend/src/validators/document.validator.ts`
* **Database**: `documents.analysis->risks` JSONB array
* **Status**: **Completed**

---

### Feature 1.6: Human Verification Alerts
* **Purpose**: Ensure safety by identifying clinical prescriptions, legal liabilities, or blurry figures that require human expert verification.
* **How It Works**:
  - The AI generates a `needs_human_check` list of uncertain items.
  - The frontend displays an alert box urging the user to consult a professional before acting.
* **Frontend Implementation**: `apps/frontend/src/pages/DocumentDetailPage.tsx`
* **Backend Implementation**: `apps/backend/src/validators/document.validator.ts`
* **Database**: `documents.analysis->needs_human_check` JSONB array
* **Status**: **Completed**

---

### Feature 1.7: Web Speech API Voice Read-Aloud
* **Purpose**: Assist users with visual impairments, dyslexia, or low literacy by narrating the analysis aloud.
* **How It Works**:
  - Uses the browser's native `window.speechSynthesis` and `SpeechSynthesisUtterance`.
  - Provides controls for Play, Pause, Resume, Stop, and Playback Speed (0.8x, 1.0x, 1.25x, 1.5x).
  - Automatically compiles the summary, key facts, deadlines, and next steps into a spoken script.
* **Frontend Implementation**: `apps/frontend/src/components/AudioPlayer.tsx`, `apps/frontend/src/hooks/useSpeechSynthesis.ts`
* **Backend Implementation**: Client-side execution (zero backend latency)
* **Status**: **Completed**

---

### Feature 1.8: Context-Grounded Follow-up Q&A
* **Purpose**: Enable users to ask specific questions about their document (e.g., *"What happens if I miss the due date?"*) without AI hallucinations.
* **How It Works**:
  1. The user enters a question or clicks a suggested prompt in `DocumentQA.tsx`.
  2. The question is sent to `POST /api/v1/documents/:id/ask`.
  3. The backend retrieves the document analysis and constructs a grounded prompt instructing Groq to answer strictly using documented facts.
  4. The answer and question are persisted in `document_questions`.
* **Frontend Implementation**: `apps/frontend/src/components/DocumentQA.tsx`
* **Backend Implementation**: `apps/backend/src/controllers/document.controller.ts`
* **Database**: `document_questions` table with user and document foreign keys
* **API Route**: `POST /api/v1/documents/:id/ask`, `GET /api/v1/documents/:id/questions`
* **Status**: **Completed**

---

### Feature 1.9: Document History & Ownership Isolation
* **Purpose**: Provide a private, paginated document archive that users can revisit, inspect, or delete.
* **How It Works**:
  - The dashboard and history pages fetch user-specific records via `GET /api/v1/documents`.
  - Every SQL query verifies `WHERE user_id = req.user.id`.
  - Deleting a document executes a permanent cascade deletion in PostgreSQL.
* **Frontend Implementation**: `apps/frontend/src/pages/HistoryPage.tsx`, `apps/frontend/src/pages/DashboardPage.tsx`
* **Backend Implementation**: `apps/backend/src/controllers/document.controller.ts`
* **Database**: `documents` table with user index
* **API Route**: `GET /api/v1/documents`, `DELETE /api/v1/documents/:id`
* **Status**: **Completed**

---

### Feature 1.10: Accessibility Suite (WCAG AAA Contrast & Typography Scaling)
* **Purpose**: Empower elderly users, low-vision users, and individuals with color sensitivity.
* **How It Works**:
  - **High Contrast Toggle**: Replaces page styles with yellow `#FFFF00` on black `#000000` with 2px borders.
  - **Large Text Toggle**: Scales the HTML root font size to 118% with proportionate line heights.
  - **Keyboard Navigation**: Skip-to-content links and high-visibility cyan focus rings (`--focus-ring: #0FA4AF`).
  - **Reduced Motion**: Automatically disables animations when `prefers-reduced-motion: reduce` is detected.
* **Frontend Implementation**: `apps/frontend/src/context/A11yContext.tsx`, `apps/frontend/src/index.css`
* **Status**: **Completed**

---

## 2. Partially Completed Features

### Feature 2.1: Multilingual Document Translation Engine
* **Purpose**: Translate document explanations into regional Indic languages (Tamil, Telugu, Hindi).
* **Current Status**:
  - **Backend**: Implemented in `apps/backend/src/services/groq.service.ts` (`translateAnalysisWithGroq`) and route `POST /api/v1/documents/:id/translate`.
  - **Frontend**: Scoped to Version 1 English-only presentation. The global language selector has been removed from the header to maintain a clean, uncluttered interface. Full multi-language UI integration is scheduled for Version 2.
* **Status**: **Partially Completed (Backend Ready, UI Planned for V2)**

---

## 3. Planned Features (Version 2 Roadmap)

| Feature | Description | Target Version |
|---|---|---|
| **Regional Language UI (Tamil, Telugu, Hindi)** | Full multi-language UI localization and Indic voice synthesis. | Version 2.0 |
| **One-Click Calendar Sync (.ics export)** | Direct export of deadline reminders into Google Calendar, Apple, and Outlook. | Version 2.1 |
| **Automated Dispute & Inquiry Drafter** | Generation of pre-filled dispute letters for erroneous charges or billing issues. | Version 2.2 |
| **Multi-Page PDF Chunking & OCR Stitching** | Support for enterprise documents exceeding 15 pages with parallel analysis. | Version 2.3 |

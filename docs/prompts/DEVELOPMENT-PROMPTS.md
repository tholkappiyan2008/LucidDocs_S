# AI Prompt Archive: Full-Stack Development & AI Integration

This document archives the technical prompts, prompts for API and service engineering, and LLM system prompt specifications used during the development of ClearDoc.

---

## 1. Backend Architecture & Security Pipelines

### Prompt: Express.js Monorepo Backend with In-Memory File Processing
```text
Act as a Principal Backend Engineer.

Build a hardened Node.js + Express.js + TypeScript service for ClearDoc:
1. File Ingestion Pipeline:
   - Configure Multer with MemoryStorage (buffer-only, 10MB limit). Under no circumstances should user documents be written to the server's local disk.
   - Enforce magic-byte validation using file-type/buffer signatures to verify true MIME types (reject spoofed extensions for application/pdf, image/png, image/jpeg, image/webp).
2. Custom JWT Authentication:
   - Create registration and login endpoints under `/api/v1/auth`.
   - Hash passwords using bcrypt with 12 salt rounds.
   - Issue signed JSON Web Tokens (7-day validity) and verify via an Express Bearer authentication middleware.
   - Persist user accounts in Supabase PostgreSQL `public.users` table using `@supabase/supabase-js` service-role client.
3. Health Check:
   - Provide `/api/v1/health` returning server status, uptime, and database connectivity.
```

---

## 2. Groq AI Multimodal Engine Migration

### Prompt: Migrating from Gemini to Groq Qwen 2.5 72B / Qwen 3.8 27B
```text
Act as a Senior AI Backend Engineer.

Migrate ClearDoc's core document analysis engine from Google Gemini to the Groq Cloud API using the `qwen/qwen3.8-27b` multimodal model.

Requirements:
1. Groq Client Integration:
   - Use the official `groq-sdk` or OpenAI-compatible endpoint at `https://api.groq.com/openai/v1`.
   - Maintain authentication via `GROQ_API_KEY`.
2. Multimodal Payload Assembly:
   - For image files (JPEG, PNG, WebP): Format the buffer as a base64 Data URL (`data:${mimeType};base64,${base64String}`) and include it in the user message content array.
   - For PDF documents: Extract raw text using `pdf-parse` in memory. If text extraction succeeds, send the text payload. If scanned/empty, convert or fallback to image processing.
3. Strictly Typed JSON Schema Output:
   - Instruct the model to return valid JSON matching the ClearDoc schema:
     - `summary`: Plain-language explanation in 2-3 sentences.
     - `documentType`: Detected document classification (e.g., Medical, Utility, Legal, Financial).
     - `keyInformation`: Array of key-value pairs (Account numbers, provider, dates).
     - `deadlines`: Array of deadline objects with date, description, and urgency (high, medium, low).
     - `actionItems`: Array of action objects with step, description, and urgency.
     - `potentialRisks`: Array of consequences if no action is taken (penalties, service disconnection).
     - `simplifiedTerms`: Glossary of complicated jargon mapped to plain-English definitions.
4. Resilience:
   - Handle rate limits (HTTP 429) and network timeouts with exponential backoff (up to 3 retries).
```

---

## 3. Grounded Follow-Up Q&A Engine

### Prompt: Zero-Hallucination Document Q&A Service
```text
Act as an AI Safety and Prompt Engineer.

Design the system prompt and inference pipeline for ClearDoc's follow-up Q&A feature (`POST /api/v1/documents/:id/question`):

Constraints:
1. Grounding Mandate:
   - The model must answer user questions EXCLUSIVELY using the extracted text and structured analysis of the specific document uploaded by the user.
2. Anti-Hallucination Guardrail:
   - If the answer cannot be found directly in or inferred with 100% certainty from the document, the model must explicitly respond:
     "I cannot find this information in your uploaded document. Please check the physical document or contact the issuing authority directly."
   - Under no circumstances should the model invent phone numbers, account balances, or dates.
3. Accessibility Tone:
   - Answers must be written in Grade 6 reading level English: clear, concise, direct, and free of legalistic jargon.
4. Parameter Optimization:
   - Set temperature to 0.2 to prioritize deterministic factual extraction over creativity.
   - Set max_tokens to 500 for fast, digestible answers.
```

---

## 4. Frontend State & Document Workflow

### Prompt: Document Upload, Analysis State Machine, and Web Speech Integration
```text
Act as a Senior React Engineer.

Build the interactive document processing frontend in React + TypeScript:
1. Upload & Drag-and-Drop Zone:
   - Implement visual dropzone accepting PDF, PNG, JPEG, WebP up to 10MB.
   - Display real-time upload progress, file validation errors, and loading state transitions.
2. Analysis Lifecycle Management:
   - Provide step-by-step progress indicators during processing:
     "Uploading file..." -> "Extracting content..." -> "AI simplifying language..." -> "Ready!"
3. Speech Synthesis Integration:
   - Implement `useSpeechSynthesis` hook leveraging the browser's native `window.speechSynthesis`.
   - Support play, pause, resume, and cancel.
   - Provide speed adjustment slider (0.75x to 1.5x) and highlight the current sentence as speech progresses.
4. Document History & Filtering:
   - Fetch historical documents from `GET /api/v1/documents`.
   - Provide search by filename, filter by document category, and quick delete with optimistic UI updates.
```

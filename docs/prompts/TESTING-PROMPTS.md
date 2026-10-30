# AI Prompt Archive: Testing, Debugging & Quality Verification

This document archives the diagnostic prompts, debugging protocols, and end-to-end verification suites used to test, fix, and validate ClearDoc.

---

## 1. Authentication & Database Diagnostics

### Prompt: Debugging Supabase Client Initialization & Environment Leaks
```text
Act as a Senior Authentication Debugging Specialist.

Users are encountering an error during registration:
"Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL."

Perform a root-cause investigation:
1. Search the entire codebase for `createClient(`, `SUPABASE_URL`, and `VITE_SUPABASE_URL`.
2. Verify why the frontend is attempting to initialize a Supabase client directly when our architecture uses an Express JWT backend.
3. Check whether frontend registration was accidentally coupled to `@supabase/supabase-js`.
4. Decouple the frontend from direct Supabase SDK calls: ensure all user auth flows route strictly through Axios calls to `http://localhost:5000/api/v1/auth/*`.
5. Verify that the backend loads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` securely from the root or backend `.env`, confirming that sensitive service keys are never bundled into the frontend browser distribution.
```

---

## 2. Model Verification & API Error Handling

### Prompt: Groq Model Availability & Rate-Limit Handling Verification
```text
Act as an AI Infrastructure Specialist.

We are migrating our document processing service to Groq `qwen/qwen3.8-27b`.

Write an automated verification script:
1. Ping Groq's Models API (`GET https://api.groq.com/openai/v1/models`) with the provided `GROQ_API_KEY`.
2. Confirm whether `qwen/qwen3.8-27b` (or active preview aliases) is active and available for inference.
3. Test a multimodal completion using a small base64 test image and verify that the response returns valid JSON adhering to our TypeScript interface.
4. Simulate a 429 Rate Limit response and verify that our retry middleware backs off exponentially (1s -> 2s -> 4s) before rejecting.
5. If the model returns markdown code fences (````json ... ````), ensure the JSON sanitization parser extracts the raw JSON cleanly without parse errors.
```

---

## 3. Build & Style Diagnostics

### Prompt: PostCSS & Tailwind Compilation Resolution
```text
Act as a Senior Frontend Build Specialist.

The Vite build fails with the error:
"The `bg-noir` class does not exist. If `bg-noir` is a custom class, make sure it is defined within a `@layer` directive."

Investigate and fix:
1. Inspect `apps/frontend/src/index.css`, `tailwind.config.js`, and `postcss.config.js`.
2. Search the entire `apps/frontend/src` directory for occurrences of `bg-noir`.
3. Check all `@apply` directives inside `index.css`. Ensure no component classes reference undefined Tailwind utility tokens.
4. Replace legacy dark-theme artifact classes with official design tokens:
   - Replace `bg-noir` with `bg-brand-deep-teal` or `bg-slate-900`.
   - Ensure `@layer utilities` and `@layer components` are correctly ordered.
5. Execute `npx tsc -b apps/frontend` and `npm run build:frontend` to verify clean compilation with 0 errors.
```

---

## 4. End-to-End User Journey Validation

### Prompt: Full-Stack Smoke & Functional Testing Checklist
```text
Act as a QA Lead and Full-Stack Test Engineer.

Execute a comprehensive manual and automated smoke test for ClearDoc across the entire user lifecycle:

Test Suite:
1. User Registration:
   - Register a new account (`testuser@cleardoc.local`).
   - Verify password is encrypted with bcrypt (12 rounds) in Supabase `public.users`.
   - Verify JWT token is returned and stored securely in local storage.
2. User Login & Session Persistence:
   - Login with valid credentials; verify redirected to `/dashboard`.
   - Attempt login with invalid credentials; verify proper HTTP 401 error toast.
   - Refresh browser; verify JWT authentication persists and protected routes remain accessible.
3. Document Upload Pipeline:
   - Upload sample utility bill (PDF) and medical report (PNG).
   - Verify magic-byte validation accepts genuine files and rejects corrupted or renamed executable binaries.
   - Verify Multer processes the file in memory without saving to disk.
4. AI Multimodal Processing:
   - Verify Groq extracts summary, key deadlines, financial totals, and action items.
   - Verify response rendering in the frontend dashboard within 3-5 seconds.
5. Accessibility Controls:
   - Toggle High-Contrast mode; verify color contrast shifts to black/white/deep navy.
   - Switch font size to "Large" and "Extra Large"; verify UI layout remains stable without clipped text.
   - Click "Read Aloud"; verify Web Speech synthesizes the summary aloud.
6. Grounded Q&A:
   - Ask "What is the penalty if I pay late?" -> Verify answer matches the document's late fee terms.
   - Ask "What is the capital of France?" -> Verify anti-hallucination guardrail triggers:
     "I cannot find this information in your uploaded document."
7. Document Management & History:
   - Verify uploaded document appears in `GET /api/v1/documents`.
   - Delete document; verify CASCADE removes related Q&A and actions from database.
```


# ClearDoc Technology Stack

This document catalogs every technology, framework, library, and development tool actively used in ClearDoc, detailing its purpose, implementation location, and architectural rationale.

---

## 1. Frontend Technologies

| Technology | Purpose | Implementation Location | Architectural Rationale |
|---|---|---|---|
| **React 18** | UI component architecture & declarative rendering | `apps/frontend/src/` | Provides a robust component lifecycle, virtual DOM reconciliation, and seamless hook-based state management. |
| **Vite 6** | Frontend build tool & HMR dev server | `apps/frontend/vite.config.ts` | Sub-second cold starts, fast Hot Module Replacement (HMR), and optimized production Rollup bundling. |
| **TypeScript 5** | Strict static type checking | `apps/frontend/tsconfig.json` | Eliminates runtime type errors, guarantees API response contract safety, and enhances developer productivity. |
| **Tailwind CSS 3** | Utility-first styling & design tokens | `apps/frontend/tailwind.config.js` | Enforces the ClearDoc brand palette (`#003135`, `#024950`, `#964734`, `#0FA4AF`, `#F5F7F5`) with minimal CSS footprint. |
| **React Router v6** | Client-side routing & page navigation | `apps/frontend/src/App.tsx` | Provides route guarding via `<ProtectedRoute>`, programmatic navigation, and route transition management. |
| **Axios** | HTTP client for backend communication | `apps/frontend/src/services/api.ts` | Supports request/response interceptors for automatic JWT Bearer token injection and centralized 401 handling. |
| **Motion (`motion/react`)** | Declarative UI animations & page transitions | `apps/frontend/src/components/Reveal.tsx` | Enables subtle, performant staggered entry transitions while natively respecting `prefers-reduced-motion`. |
| **Lenis** | Smooth inertial scroll engine | `apps/frontend/src/lib/scroll.ts` | Delivers a unified, fluid scrolling feel on desktop browsers while gracefully disabling on reduced-motion devices. |
| **Lucide React** | Consistent, accessible iconography | Throughout `apps/frontend/src/components/` | Lightweight, scalable SVG icon set ensuring crisp rendering across high-DPI displays. |
| **@fontsource/manrope** | Self-hosted typography (400–800 weights) | `apps/frontend/src/index.css` | Metric-compatible fallback for Aeonik; guarantees zero layout shifts and offline font availability without Google CDN calls. |
| **Web Speech API** | Native browser text-to-speech synthesis | `apps/frontend/src/hooks/useSpeechSynthesis.ts` | Allows users with visual impairments or reading difficulties to listen to summaries without costly external TTS API latency. |

---

## 2. Backend Technologies

| Technology | Purpose | Implementation Location | Architectural Rationale |
|---|---|---|---|
| **Node.js (v18+)** | JavaScript runtime environment | `apps/backend/` | Non-blocking, event-driven I/O ideal for handling concurrent multipart uploads and streaming API calls. |
| **Express.js 4** | Web server & RESTful API framework | `apps/backend/src/server.ts` | Mature, lightweight HTTP server with flexible middleware routing for auth, upload, and error handling. |
| **TypeScript 5** | Backend static typing & contract enforcement | `apps/backend/tsconfig.json` | Guarantees end-to-end type safety between controllers, validators, database records, and AI prompts. |
| **Multer (MemoryStorage)** | Multipart form-data handling | `apps/backend/src/middleware/upload.middleware.js` | Parses uploaded documents directly into memory `Buffer` objects without writing raw files to host disk, preserving user privacy. |
| **Zod** | Runtime schema validation | `apps/backend/src/validators/` | Validates API request bodies and strictly parses JSON completions returned by the Groq AI model. |
| **unpdf** | In-memory PDF text & structure extraction | `apps/backend/src/services/groq.service.ts` | Serverless-ready PDF parsing that runs purely on buffers without external binaries or C++ dependencies. |
| **Bcryptjs** | Salted password hashing (12 rounds) | `apps/backend/src/controllers/auth.controller.ts` | Industry-standard password security resistant to rainbow-table and brute-force attacks. |
| **JSON Web Token (jsonwebtoken)**| Stateless user session management | `apps/backend/src/middleware/auth.middleware.ts` | Enables secure, scalable authentication with a 7-day expiration window and zero session-state overhead on the database. |
| **CORS** | Cross-Origin Resource Sharing control | `apps/backend/src/server.ts` | Restricts API access to authorized frontend origins (`FRONTEND_URL`), preventing unauthorized cross-site requests. |
| **tsx / ts-node-dev** | TypeScript execution & live reload | `apps/backend/package.json` | Fast compilation and live restart during backend development. |

---

## 3. Database & Cloud Infrastructure

| Technology | Purpose | Implementation Location | Architectural Rationale |
|---|---|---|---|
| **Supabase PostgreSQL** | Cloud relational database | `apps/backend/src/config/supabase.ts` | Enterprise-grade PostgreSQL with JSONB document analysis storage, ACID compliance, and Foreign Key constraints. |
| **@supabase/supabase-js** | PostgreSQL API client (Service Role) | `apps/backend/src/config/supabase.ts` | Provides typed SQL queries, parameterized statements, and reliable connection pooling. |

---

## 4. Artificial Intelligence & Vision Engine

| Technology | Purpose | Implementation Location | Architectural Rationale |
|---|---|---|---|
| **Groq Cloud API** | Fast LLM inference engine | `https://api.groq.com/openai/v1` | Delivers sub-second token generation latency via LPU (Language Processing Unit) architecture. |
| **`qwen/qwen3.8-27b`** | Multimodal document analysis & grounded Q&A | `apps/backend/src/services/groq.service.ts` | High-accuracy vision and text reasoning model capable of reading dense tabular bills, legal letters, and medical charts. |

---

## 5. Development & Workspace Tools

| Tool | Purpose | Location |
|---|---|---|
| **npm Workspaces** | Monorepo package orchestration | Root `package.json` |
| **PostCSS & Autoprefixer** | Vendor prefixing and CSS transformation | `apps/frontend/postcss.config.js` |
| **Git & GitHub** | Version control and collaborative development | `.git/` |
| **Dotenv** | Secure local environment loading | `apps/backend/src/config/env.ts` |


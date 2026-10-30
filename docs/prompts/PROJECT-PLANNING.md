# AI Prompt Archive: Project Planning & Architecture Design

This document records the foundational prompts and specifications utilized during the initial planning, architecture formulation, and technical scoping of ClearDoc.

---

## 1. Project Conception & Problem Definition

### Prompt: Problem Discovery & Accessibility Core
```text
Act as a Principal Product Architect and Accessibility Specialist.

I want to build ClearDoc — an AI-powered accessibility platform designed to explain complicated paperwork in simple language.

Users receive overwhelming documents:
- Electricity and water bills with hidden penalty dates.
- Hospital discharge summaries with clinical jargon.
- Government notices, tax letters, and court summons.
- Bank statements with confusing interest and fee calculations.

Define the system requirements:
1. What core features are required to make documents understandable to people with low literacy, visual impairments, or reading difficulties?
2. How can we ensure 100% in-memory document privacy so sensitive bills and records are never stored raw on disk?
3. Design a modular roadmap (Modules 1 through 8) covering authentication, upload pipeline, AI processing, results dashboard, speech read-aloud, document history, and follow-up Q&A.
```

---

## 2. Technical Stack Selection & Architectural Blueprint

### Prompt: Decoupled Monorepo Architecture
```text
Act as a Senior Software Architect.

Design an end-to-end architecture for ClearDoc with the following constraints:
- Monorepo using npm workspaces (apps/backend and apps/frontend).
- Frontend: React 18, Vite, TypeScript, Tailwind CSS.
- Backend: Node.js, Express.js, TypeScript.
- Database: Supabase PostgreSQL with relational ownership and foreign key cascades.
- AI Provider: Groq Cloud API using qwen/qwen3.8-27b for high-speed multimodal inference.
- Authentication: Decoupled custom Express JWT with bcrypt password hashing (12 rounds) on public.users.
- Privacy: Multer MemoryStorage to guarantee zero raw disk persistence.

Deliverables:
1. Mermaid diagram showing frontend-to-backend communication.
2. Database schema with users, documents, document_questions, and document_actions.
3. Magic-byte file validation strategy to prevent MIME spoofing.
```

---

## 3. Data Flow & Security Modeling

### Prompt: Strict Ownership & Security Isolation
```text
Act as a Cybersecurity Engineer and Database Architect.

Define the security and privacy model for ClearDoc:
1. How should document ownership isolation be enforced so User A can never query, inspect, or delete User B's documents?
2. How should environment variables be segregated so the Supabase Service Role Key and Groq API Key never leak to the client bundle?
3. Define the cascading deletion behavior in PostgreSQL when a user purges a document.
```

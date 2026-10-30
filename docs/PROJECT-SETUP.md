# ClearDoc Local Setup & Installation Guide

This guide provides step-by-step instructions to set up, configure, and run ClearDoc on Windows and UNIX-like environments (macOS, Linux).

---

## 1. Prerequisites

Before starting, ensure your system has the following tools installed:

- **Node.js**: Version `18.18.0` or higher (Node `20.x` LTS recommended).
- **npm**: Version `9.x` or higher (bundled with Node.js).
- **Git**: Version `2.x` or higher.
- **Supabase Account**: A free project on [Supabase](https://supabase.com).
- **Groq Cloud Account**: A free API key from [Groq Console](https://console.groq.com).

To verify your Node.js and npm versions:

```bash
node -v
npm -v
```

---

## 2. Clone the Repository

```bash
git clone https://github.com/tholkappiyan2008/LucidDocs_S.git
cd LucidDocs_S
```

---

## 3. Install Monorepo Dependencies

ClearDoc uses **npm workspaces** to manage both the frontend and backend in a single root repository:

```bash
npm install
```

This single command installs all dependencies across the root, `apps/backend`, and `apps/frontend`.

---

## 4. Database Setup (Supabase PostgreSQL)

1. Log into your [Supabase Dashboard](https://app.supabase.com) and create a new project.
2. Navigate to the **SQL Editor** in the left navigation sidebar.
3. Open the migration script located at:
   ```
   supabase/migrations/20261030000000_init_cleardoc.sql
   ```
4. Copy the entire contents of the SQL file, paste it into the Supabase SQL Editor, and click **Run**.
5. Verify that four tables were created:
   - `users`
   - `documents`
   - `document_questions`
   - `document_actions`

---

## 5. Environment Configuration

ClearDoc reads its backend environment configuration from a `.env` file located in the project root (or `apps/backend/.env`).

Create your `.env` file from the provided template:

```bash
cp .env.example .env
```

### Environment Variables Template

```env
# ============================================================
# ClearDoc Environment Configuration (.env)
# ============================================================

# 1. Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# 2. JWT Authentication (Express Backend)
# Generate a secure 32+ character string for token signing
JWT_SECRET=your_jwt_secret_min_32_characters_long
JWT_EXPIRES_IN=7d

# 3. Supabase PostgreSQL Configuration
# Found in: Supabase Project Settings -> API
SUPABASE_URL=https://your-project-id.supabase.co
# IMPORTANT: Use the "service_role" secret key on the backend (NOT the anon key)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_secret_key

# 4. Groq Multimodal AI API Key
# Found in: Groq Console (https://console.groq.com)
GROQ_API_KEY=your_groq_api_key
```

> **SECURITY NOTICE**: Never commit your `.env` file to version control. The repository `.gitignore` automatically excludes all `.env` files except `.env.example`.

---

## 6. Running the Application

Open two terminal windows (or use background processes) to start both services:

### Terminal 1 — Start the Backend API (Port 5000)

```bash
npm run dev:backend
```

* Expected output:
  ```
  [ClearDoc Server] Listening on http://localhost:5000
  [ClearDoc Server] Health check available at http://localhost:5000/api/v1/health
  ```

### Terminal 2 — Start the Frontend Development Server (Port 5173)

```bash
npm run dev:frontend
```

* Expected output:
  ```
  VITE v6.4.5  ready in 490 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ```

---

## 7. Verifying the Installation

1. **Verify Backend Health**:
   Open [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health) in your browser. You should receive:
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "database_connected": true,
     "ai_service": "groq",
     "ai_model": "qwen/qwen3.8-27b"
   }
   ```

2. **Open the Web Application**:
   Navigate to [http://localhost:5173/](http://localhost:5173/) in your web browser.

3. **Perform an End-to-End Test**:
   - Click **Get Started** and create a new account (e.g. `test@example.com`).
   - You will be redirected to the **Workspace Dashboard**.
   - Click **Upload Document** and upload any sample PDF bill or medical invoice image (up to 10MB).
   - Review the generated **5th-Grade Plain Language Summary**, **Key Facts & Amounts**, **Deadlines**, and **Action Steps**.
   - Click **Listen now** in the Voice Read-Aloud player to verify SpeechSynthesis.
   - Ask a question in the **Document Q&A** thread (e.g. *"What is the amount due?"*).

---

## 8. Production Build Verification

To verify that all TypeScript types, CSS utilities, and bundles compile cleanly for production:

```bash
# Build backend
npm run build:backend

# Build frontend
npm run build:frontend
```

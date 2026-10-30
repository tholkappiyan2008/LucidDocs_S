# ClearDoc — Production Deployment Guide (Vercel + Render)

This guide provides end-to-end instructions for deploying ClearDoc to production using:
* **Render**: Node.js + Express Backend API (`apps/backend`)
* **Vercel**: React + Vite Frontend Web Application (`apps/frontend`)

---

## Architecture Overview

```text
+------------------------------+             +---------------------------------+
|        Vercel (Client)       |             |         Render (API Service)    |
|   https://<app>.vercel.app   |  REST / JWT |  https://<service>.onrender.com |
|  - React 18 + Vite SPA       | ----------> |  - Express.js Node API          |
|  - In-browser Speech A11y    |             |  - In-Memory File Processing    |
|  - vercel.json SPA rewrites  |             |  - Groq Multimodal AI Pipeline  |
+------------------------------+             +---------------------------------+
                                                               |
                                            +------------------+------------------+
                                            |                                     |
                                            v                                     v
                             +-----------------------------+       +-----------------------------+
                             |     Supabase PostgreSQL     |       |       Groq Cloud API        |
                             |  - public.users             |       |  - qwen/qwen3.8-27b         |
                             |  - public.documents         |       |  - Multimodal Vision + JSON |
                             |  - public.document_actions  |       +-----------------------------+
                             +-----------------------------+
```

---

## STEP 1: Deploy Backend to Render

### Option A: 1-Click Blueprint (Recommended)
This repository includes a [`render.yaml`](../render.yaml) blueprint specification:
1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository: `tholkappiyan2008/LucidDocs_S`.
4. Render will automatically detect `render.yaml` and configure the service:
   * **Name**: `cleardoc-api`
   * **Environment**: `Node`
   * **Build Command**: `npm install && npm run build:backend`
   * **Start Command**: `npm run start`
   * **Health Check Path**: `/api/v1/health`
5. Fill in your environment variables when prompted by the Render UI (see below).
6. Click **Apply**.

---

### Option B: Manual Web Service Setup
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Select your repository (`tholkappiyan2008/LucidDocs_S`).
3. Fill in the service configuration:
   * **Name**: `cleardoc-backend` (or your choice)
   * **Region**: Choose the region closest to your users / Supabase database
   * **Branch**: `main`
   * **Root Directory**: Leave blank (monorepo root)
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build:backend`
   * **Start Command**: `npm run start`
   * **Plan**: `Free` or `Starter`
4. Expand **Advanced** and set:
   * **Health Check Path**: `/api/v1/health`
   * **Auto-Deploy**: `Yes`

---

### Backend Environment Variables on Render

In the **Environment** tab of your Render service, add the following variables:

| Variable | Value / Description | Sensitive? |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | No |
| `PORT` | `10000` *(Render sets this automatically)* | No |
| `SUPABASE_URL` | `https://your-project.supabase.co` | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key | **Yes** |
| `GROQ_API_KEY` | `gsk_...` from [console.groq.com/keys](https://console.groq.com/keys) | **Yes** |
| `GROQ_MODEL` | `qwen/qwen3.8-27b` | No |
| `JWT_SECRET` | 32+ character random secret string | **Yes** |
| `JWT_EXPIRES_IN` | `7d` | No |
| `FRONTEND_URL` | `https://your-app.vercel.app` *(add after Vercel step)* | No |

---

### Verify Backend Deployment
Once deployed, copy your Render URL (e.g. `https://cleardoc-backend.onrender.com`).
Test the health endpoint in your browser or curl:
```bash
curl https://cleardoc-backend.onrender.com/api/v1/health
```
Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-10-30T18:00:00.000Z",
  "service": "ClearDoc API",
  "database_connected": true
}
```

---

## STEP 2: Deploy Frontend to Vercel

### 1. Import Repository
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository (`tholkappiyan2008/LucidDocs_S`).

### 2. Configure Build & Output Settings
Vercel will detect Vite. Configure the build parameters:

* **Framework Preset**: `Vite`
* **Root Directory**: `apps/frontend`
* **Build Command**: `vite build` (or `npm run build`)
* **Output Directory**: `dist`
* **Install Command**: `npm install`

> [!TIP]
> Alternatively, if you leave the Root Directory as `.` (monorepo root), Vercel will automatically read the root [`vercel.json`](../vercel.json) which specifies `npm run build:frontend` and `apps/frontend/dist`.

### 3. Environment Variables on Vercel
Under **Environment Variables**, add:

| Key | Value | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Your Render Backend URL + `/api/v1` | `https://cleardoc-backend.onrender.com/api/v1` |

> [!IMPORTANT]
> Make sure `VITE_API_URL` ends with `/api/v1` (no trailing slash). ClearDoc's Axios client will automatically append endpoint paths like `/auth/login` and `/documents/analyze`.

### 4. Deploy
Click **Deploy**. Vercel will build the frontend and provide your production URL (e.g. `https://cleardoc.vercel.app`).

---

## STEP 3: Link Both Services

Now that both services are running:

1. Copy your Vercel URL: `https://your-app.vercel.app`.
2. Return to the **Render Dashboard** -> your backend service -> **Environment**.
3. Update or set:
   ```env
   FRONTEND_URL=https://your-app.vercel.app
   ```
4. Click **Save Changes**. Render will automatically redeploy the backend with the updated CORS configuration.

---

## Troubleshooting & Verification Checklist

- [ ] **SPA Route Refresh (404 on reload)**:
  - Both [`vercel.json`](../vercel.json) and [`apps/frontend/vercel.json`](../apps/frontend/vercel.json) contain rewrite rules directing all paths `/(.*)` to `/index.html`. Refreshing `/dashboard`, `/login`, or `/documents/:id` works smoothly.
- [ ] **Render Free Tier Cold Starts**:
  - Render free-tier web services spin down after 15 minutes of inactivity. The initial request after inactivity may take 30–50 seconds to wake up. ClearDoc's frontend Axios client handles standard request timeouts.
- [ ] **CORS Origin Validation**:
  - The Express backend dynamically permits requests matching `FRONTEND_URL`, `http://localhost:*`, and any `https://*.vercel.app` preview deployments.
- [ ] **Supabase Connectivity**:
  - Verify `https://your-backend.onrender.com/api/v1/health` returns `"database_connected": true`. If `false`, verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Render environment variables.

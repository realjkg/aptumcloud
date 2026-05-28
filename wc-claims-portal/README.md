# WC Claims Agent Portal

An AI-assisted Workers' Compensation claims management portal built with Next.js 14, authenticated via Azure Active Directory, and powered by Azure OpenAI. Designed to deploy to Azure Static Web Apps with a GitHub Actions CI/CD pipeline.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Azure Setup](#azure-setup)
  - [1. Azure AD App Registration](#1-azure-ad-app-registration)
  - [2. Azure OpenAI Resource](#2-azure-openai-resource)
  - [3. Azure Static Web App](#3-azure-static-web-app)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [GitHub Actions Deployment](#github-actions-deployment)
- [Project Structure](#project-structure)
- [Key Routes](#key-routes)
- [Security Notes](#security-notes)

---

## Architecture Overview

```
Browser
  │
  ├─► Azure Static Web Apps (hosts Next.js standalone build)
  │       │
  │       ├─► /api/auth/*   — NextAuth.js  ──► Azure AD (Entra ID)
  │       │
  │       └─► /api/chat     — Streaming SSE ──► Azure OpenAI (GPT-4o)
  │
  └─► Auth flow: Azure AD OAuth2 → JWT session → protected routes via Next.js middleware
```

- **Frontend**: Next.js 14 App Router, Tailwind CSS, React
- **Auth**: NextAuth.js v4 with `AzureADProvider` (JWT strategy, 8-hour sessions)
- **AI**: `@azure/openai` SDK streaming chat completions
- **Infra**: Azure Static Web Apps (Standard tier required for API routes)
- **CI/CD**: GitHub Actions via `.azure/deploy.yml`

---

## Prerequisites

- Node.js 20+
- An Azure subscription with the following permissions:
  - Entra ID (Azure AD): Application Administrator or Global Administrator
  - Ability to create Azure OpenAI resources (requires approved access)
  - Ability to create Static Web App resources
- GitHub repository connected to your Azure subscription

---

## Azure Setup

### 1. Azure AD App Registration

This controls who can sign in to the portal.

1. Go to [portal.azure.com](https://portal.azure.com) → **Entra ID** → **App registrations** → **New registration**

2. Fill in:
   - **Name**: `wc-claims-portal` (or your preferred name)
   - **Supported account types**: *Accounts in this organizational directory only* (single tenant)
   - **Redirect URI**: Select **Web** and enter:
     - `http://localhost:3000/api/auth/callback/azure-ad` (local dev)
     - `https://<your-swa-hostname>/api/auth/callback/azure-ad` (production — add after SWA is created)

3. After creation, note the following from the **Overview** tab:
   - **Application (client) ID** → `AZURE_AD_CLIENT_ID`
   - **Directory (tenant) ID** → `AZURE_AD_TENANT_ID`

4. Go to **Certificates & secrets** → **New client secret**:
   - Set an expiry (12 or 24 months recommended)
   - Copy the **Value** immediately (it won't be shown again) → `AZURE_AD_CLIENT_SECRET`

5. Go to **Authentication** → under **Implicit grant and hybrid flows**, ensure **ID tokens** is checked.

6. *(Optional)* Go to **App roles** to define roles like `Claims.Adjuster`, `Claims.Supervisor`. Users assigned these roles will have them forwarded in the session token.

---

### 2. Azure OpenAI Resource

1. Go to **Azure OpenAI** in the portal → **Create**
   - Select your subscription, resource group, region, and a unique name
   - **Pricing tier**: Standard S0

2. After deployment, go to the resource → **Keys and Endpoint**:
   - **Endpoint** → `AZURE_OPENAI_ENDPOINT` (format: `https://<name>.openai.azure.com`)
   - **Key 1** → `AZURE_OPENAI_API_KEY`

3. Go to **Model deployments** → **Deploy model**:
   - Select `gpt-4o` (or `gpt-4o-mini` for lower cost)
   - Set a deployment name (e.g., `gpt-4o`) → `AZURE_OPENAI_DEPLOYMENT_NAME`
   - Note the API version in use → `AZURE_OPENAI_API_VERSION` (default: `2024-10-21`)

> **Note**: Azure OpenAI access requires approval. If you don't have it yet, request access at [aka.ms/oai/access](https://aka.ms/oai/access). Approval typically takes 1–2 business days.

---

### 3. Azure Static Web App

> **Important**: Use the **Standard** tier. The Free tier does not support custom API (Next.js server routes). Standard is ~$9/month.

1. Go to **Static Web Apps** → **Create**
   - **Subscription / Resource group**: your choice
   - **Name**: `wc-claims-portal`
   - **Plan type**: Standard
   - **Region**: choose one close to your users
   - **Deployment source**: GitHub
   - **Organization / Repository / Branch**: point to this repo and `main`
   - **Build presets**: Custom
   - **App location**: `wc-claims-portal`
   - **Output location**: `.next/standalone`
   - **Skip build**: We handle build in GitHub Actions, so this can be left blank

2. After creation, go to the resource → **Manage deployment token**:
   - Copy the token → `AZURE_STATIC_WEB_APPS_API_TOKEN` (add to GitHub secrets, see below)

3. Go to **Configuration** → **Application settings** and add every environment variable from the [Environment Variables](#environment-variables) section below. These are the runtime secrets the app reads server-side.

4. Add the production redirect URI back to your App Registration:
   - Copy the SWA hostname (e.g., `https://agreeable-sky-0abc123.1.azurestaticapps.net`)
   - In Entra ID → App registration → **Authentication** → add:
     `https://<swa-hostname>/api/auth/callback/azure-ad`

---

## Local Development

```bash
# 1. Clone and enter the portal directory
git clone https://github.com/realjkg/adaptcloud.git
cd adaptcloud/wc-claims-portal

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env.local
# Edit .env.local with your real Azure values (see Environment Variables below)

# 4. Generate a NextAuth secret if you don't have one
openssl rand -base64 32
# Paste the output as NEXTAUTH_SECRET in .env.local

# 5. Run the dev server
npm run dev
# Open http://localhost:3000
```

On first load you will be redirected to `/auth/signin`. Click **Sign in with Microsoft** — this triggers the Azure AD OAuth flow. You must have a valid account in the tenant configured in `AZURE_AD_TENANT_ID`.

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development. For production, set these as **Application settings** in the Azure Static Web App resource (not as GitHub secrets — SWA passes them to the runtime).

| Variable | Where to find it | Required |
|---|---|---|
| `NEXTAUTH_URL` | Your app's base URL (`http://localhost:3000` locally, `https://<swa-hostname>` in prod) | Yes |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` | Yes |
| `AZURE_AD_CLIENT_ID` | Entra ID → App registration → Overview | Yes |
| `AZURE_AD_CLIENT_SECRET` | Entra ID → App registration → Certificates & secrets | Yes |
| `AZURE_AD_TENANT_ID` | Entra ID → App registration → Overview | Yes |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI resource → Keys and Endpoint | Yes |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI resource → Keys and Endpoint | Yes |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Azure OpenAI → Model deployments (e.g. `gpt-4o`) | Yes |
| `NEXT_PUBLIC_APP_NAME` | Display name shown in the UI | No |
| `NEXT_PUBLIC_ORG_NAME` | Organization name shown in the sidebar | No |

> Variables prefixed `NEXT_PUBLIC_` are embedded at build time and exposed to the browser. Do not put secrets in them.

---

## GitHub Actions Deployment

The workflow at `.azure/deploy.yml` runs on every push to `main` and on pull requests.

### Required GitHub Secrets

Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** and add:

| Secret name | Value |
|---|---|
| `NEXTAUTH_URL` | Your production SWA URL |
| `NEXTAUTH_SECRET` | Same value as in SWA Application settings |
| `AZURE_AD_CLIENT_ID` | From App registration |
| `AZURE_AD_CLIENT_SECRET` | From App registration |
| `AZURE_AD_TENANT_ID` | From App registration |
| `AZURE_OPENAI_ENDPOINT` | From Azure OpenAI resource |
| `AZURE_OPENAI_API_KEY` | From Azure OpenAI resource |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Your model deployment name |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | From SWA resource → Manage deployment token |

> The build step uses secrets only to embed `NEXT_PUBLIC_*` values at compile time. All other secrets are also set as Application settings in the SWA resource so they are available at runtime.

### What the pipeline does

1. Checks out the repo
2. Installs Node 20 and runs `npm ci` in `wc-claims-portal/`
3. Runs `next build` with secrets injected as env vars
4. Uploads the `.next/standalone` output to Azure Static Web Apps
5. On PR close, tears down the preview environment automatically

---

## Project Structure

```
wc-claims-portal/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts   # NextAuth handler (GET + POST)
│   │   │   └── chat/route.ts                 # Streaming SSE chat endpoint
│   │   ├── auth/
│   │   │   ├── signin/page.tsx               # Azure AD sign-in page
│   │   │   └── error/page.tsx                # Auth error page
│   │   ├── claims/
│   │   │   ├── page.tsx                      # Claims list table
│   │   │   └── [id]/page.tsx                 # Per-claim split view (detail + chat)
│   │   ├── dashboard/page.tsx                # Summary stats and recent activity
│   │   ├── layout.tsx                        # Root layout with SessionProvider
│   │   └── page.tsx                          # Root redirect (→ /dashboard or /auth/signin)
│   ├── components/
│   │   ├── chat/ChatPanel.tsx                # Streaming chat UI with markdown rendering
│   │   ├── claims/
│   │   │   ├── ClaimDetail.tsx               # Claim data panel
│   │   │   ├── ClaimsTable.tsx               # Sortable claims list
│   │   │   ├── DashboardStats.tsx            # KPI cards
│   │   │   └── RecentActivity.tsx            # Activity feed
│   │   └── ui/
│   │       ├── AppShell.tsx                  # Sidebar nav + mobile layout
│   │       └── AuthProvider.tsx              # NextAuth SessionProvider wrapper
│   ├── lib/
│   │   ├── auth.ts                           # NextAuth config and callbacks
│   │   └── azure-openai.ts                   # AzureOpenAI client + WC system prompt
│   ├── middleware.ts                          # Protects all routes except /auth and /api/auth
│   └── types/
│       ├── chat.ts                           # Message and request types
│       └── next-auth.d.ts                    # Session type augmentation (roles, oid)
├── staticwebapp.config.json                  # SWA routing, auth rules, security headers
├── .azure/deploy.yml                         # GitHub Actions CI/CD workflow
├── .env.example                              # Template for local env setup
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Key Routes

| Route | Auth required | Description |
|---|---|---|
| `/` | Yes | Redirects to `/dashboard` |
| `/dashboard` | Yes | KPI stats + recent claim activity |
| `/claims` | Yes | Full claims list table |
| `/claims/[id]` | Yes | Claim detail + AI chat panel side by side |
| `/auth/signin` | No | Azure AD sign-in page |
| `/auth/error` | No | Auth error display |
| `/api/auth/[...nextauth]` | No | NextAuth OAuth callback handler |
| `/api/chat` | Yes (session) | Streaming SSE endpoint — POST `{messages, claimId?}` |

The `/api/chat` endpoint:
- Validates the session server-side before touching Azure OpenAI
- Accepts up to 50 messages, max 32k characters each (Zod-validated)
- Injects the WC system prompt and optional claim ID context automatically
- Streams responses as `text/event-stream` SSE (`data: {"content":"..."}` lines, terminated with `data: [DONE]`)

---

## Security Notes

- **Route protection**: `src/middleware.ts` uses NextAuth's `withAuth` to block unauthenticated access to all routes except `/auth/*` and `/api/auth/*`.
- **API protection**: `/api/chat` independently verifies `getServerSession` — it does not trust the middleware alone.
- **Security headers**: `staticwebapp.config.json` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and a Content Security Policy on all responses.
- **Secrets**: No secrets are committed to the repo. All credentials flow through GitHub Actions secrets (build time) and SWA Application settings (runtime).
- **Session lifetime**: JWT sessions expire after 8 hours, matching a standard work day.
- **AI disclaimer**: The chat UI displays a notice that responses should be verified against jurisdiction statutes and clinical guidelines. The AI does not have write access to any claims system in the current scaffold.

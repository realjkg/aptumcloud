# WC Claims Agent Portal

An AI-assisted Workers' Compensation claims management portal. Adjusters sign in with their Microsoft work account, open a claim, and interact with a streaming AI assistant that is pre-loaded with WC-domain knowledge and jurisdiction-specific context for the active claim.

Built with Next.js 14 App Router · Azure AD (Entra ID) · Azure OpenAI · Azure Static Web Apps.

---

## Table of Contents

- [Architecture](#architecture)
  - [Demo Mode](#demo-mode)
  - [Production Mode](#production-mode)
  - [Data Mode Decision](#data-mode-decision)
- [Prerequisites](#prerequisites)
- [Deployment: Demo Mode](#deployment-demo-mode)
- [Deployment: Production Mode](#deployment-production-mode)
- [Azure Infrastructure (Bicep)](#azure-infrastructure-bicep)
- [Environment Variables Reference](#environment-variables-reference)
- [MFA Enforcement](#mfa-enforcement)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [GitHub Copilot Compatibility](#github-copilot-compatibility)
- [Project Structure](#project-structure)
- [Key Routes](#key-routes)
- [Security Notes](#security-notes)

---

## Architecture

### Demo Mode

Used for evaluation, internal showcasing, and development. No external claims system required. Seed data covers 10 realistic WC claims across the 10 largest US WC jurisdictions (CA, TX, FL, NY, IL, GA, WA, PA, OH, CO).

```
Browser
  │
  │  HTTPS / Azure AD session
  ▼
┌─────────────────────────────────────────────────────┐
│              Azure Static Web Apps                  │
│                                                     │
│  ┌─────────────────┐   ┌───────────────────────┐   │
│  │   React UI       │   │    Next.js API routes  │   │
│  │  Dashboard        │   │                       │   │
│  │  Claims table     │   │  /api/auth  ──────────┼───┼──► Entra ID (Azure AD)
│  │  Claim detail     │   │  /api/claims ─────────┼───┼──► DemoClaimsAdapter
│  │  AI chat panel    │   │  /api/chat  ──────────┼───┼──► Azure OpenAI (GPT-4o)
│  └─────────────────┘   └───────────────────────┘   │
└─────────────────────────────────────────────────────┘
                                          │
                              DemoClaimsAdapter
                              (in-memory seed data —
                               10 claims, no DB needed)
```

### Production Mode

Connects to your existing claims management system (ClaimCenter, Majesco, Duck Creek, or custom API) via the `ProductionClaimsAdapter`. All other components — auth, AI, hosting — remain identical.

```
Browser
  │
  │  HTTPS / Azure AD session (MFA enforced)
  ▼
┌─────────────────────────────────────────────────────┐
│              Azure Static Web Apps                  │
│                                                     │
│  ┌─────────────────┐   ┌───────────────────────┐   │
│  │   React UI       │   │    Next.js API routes  │   │
│  │  Dashboard        │   │                       │   │
│  │  Claims table     │   │  /api/auth  ──────────┼───┼──► Entra ID (Azure AD)
│  │  Claim detail     │   │  /api/claims ─────────┼───┼──► ProductionClaimsAdapter
│  │  AI chat panel    │   │  /api/chat  ──────────┼───┼──► Azure OpenAI (GPT-4o)
│  └─────────────────┘   └───────────────────────┘   │
└─────────────────────────────────────────────────────┘
                                          │
                              ProductionClaimsAdapter
                                          │
                              CLAIMS_API_BASE_URL
                              (your CMS REST API)
                                          │
                              ┌───────────────────────┐
                              │  Claims Management     │
                              │  System                │
                              │  (ClaimCenter /        │
                              │   Majesco / custom)    │
                              └───────────────────────┘
```

### Data Mode Decision

The mode is set by a single environment variable evaluated at startup. Nothing else in the application changes.

```
CLAIMS_DATA_MODE=demo        → DemoClaimsAdapter   (seeded in-memory, zero dependencies)
CLAIMS_DATA_MODE=production  → ProductionClaimsAdapter  (live CMS API)
```

The adapter pattern means the entire UI, AI integration, and auth layer are identical in both modes. Switching from Demo to Production is a configuration change, not a code change.

**ClaimsAdapter interface** — the contract both adapters must satisfy:

```typescript
interface ClaimsAdapter {
  listClaims(): Promise<ClaimSummary[]>
  getClaim(id: string): Promise<Claim | null>
  getDashboardMetrics(): Promise<DashboardMetrics>
  getRecentActivity(limit?: number): Promise<ActivityItem[]>
}
```

---

## Prerequisites

- Node.js 20+
- Azure subscription with:
  - Entra ID: Application Administrator or Global Administrator role
  - Azure OpenAI access approved ([request here](https://aka.ms/oai/access) — takes 1–2 business days)
  - Ability to create Static Web App resources (Standard tier)
- GitHub repository connected to your Azure subscription

---

## Deployment: Demo Mode

Demo mode requires no claims management system. Complete these steps in order.

### Step 1 — Entra ID App Registration

```bash
# Create the registration
az ad app create \
  --display-name "wc-claims-portal-dev" \
  --sign-in-audience AzureADMyOrg \
  --web-redirect-uris "http://localhost:3000/api/auth/callback/azure-ad"

# Get Client ID and Tenant ID
az ad app list --display-name "wc-claims-portal-dev" \
  --query "[0].{clientId:appId}" -o tsv

az account show --query tenantId -o tsv

# Create a client secret (copy the 'value' — shown once only)
APP_ID=$(az ad app list --display-name "wc-claims-portal-dev" --query "[0].appId" -o tsv)
az ad app credential reset --id $APP_ID --years 2
```

Save: `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID`

### Step 2 — Deploy Azure infrastructure

```bash
cd wc-claims-portal

# Review region and prefix in infra/main.bicepparam, then:
./infra/deploy.sh <your-azure-subscription-id>
```

The script prints all four output values on completion. Copy them.

### Step 3 — Retrieve the OpenAI API key

```bash
az cognitiveservices account keys list \
  --resource-group rg-adaptcloud-wc-claims-dev \
  --name oai-adaptcloud-wc-claims-dev \
  --query key1 -o tsv
```

Save as `AZURE_OPENAI_API_KEY`.

### Step 4 — Generate NextAuth secret

```bash
openssl rand -base64 32
```

Save as `NEXTAUTH_SECRET`.

### Step 5 — Set GitHub Actions secrets

**Repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|---|---|
| `NEXTAUTH_URL` | `https://<swa-hostname>` from deploy output |
| `NEXTAUTH_SECRET` | from Step 4 |
| `AZURE_AD_CLIENT_ID` | from Step 1 |
| `AZURE_AD_CLIENT_SECRET` | from Step 1 |
| `AZURE_AD_TENANT_ID` | from Step 1 |
| `AZURE_OPENAI_ENDPOINT` | from deploy output |
| `AZURE_OPENAI_API_KEY` | from Step 3 |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | from deploy output (`gpt-4o`) |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | from deploy output |
| `CLAIMS_DATA_MODE` | `demo` |

### Step 6 — Set SWA Application Settings (runtime)

```bash
az staticwebapp appsettings set \
  --name swa-adaptcloud-wc-claims-dev \
  --resource-group rg-adaptcloud-wc-claims-dev \
  --setting-names \
    NEXTAUTH_URL="https://<swa-hostname>" \
    NEXTAUTH_SECRET="<value>" \
    AZURE_AD_CLIENT_ID="<value>" \
    AZURE_AD_CLIENT_SECRET="<value>" \
    AZURE_AD_TENANT_ID="<value>" \
    AZURE_OPENAI_ENDPOINT="<value>" \
    AZURE_OPENAI_API_KEY="<value>" \
    AZURE_OPENAI_DEPLOYMENT_NAME="gpt-4o" \
    CLAIMS_DATA_MODE="demo"
```

### Step 7 — Add the production redirect URI

```bash
APP_ID=$(az ad app list --display-name "wc-claims-portal-dev" --query "[0].appId" -o tsv)
az ad app update --id $APP_ID \
  --web-redirect-uris \
    "http://localhost:3000/api/auth/callback/azure-ad" \
    "https://<swa-hostname>/api/auth/callback/azure-ad"
```

### Step 8 — Trigger first deployment

Push to `main`. The GitHub Actions workflow builds and deploys automatically. Monitor in the **Actions** tab.

### Step 9 — Configure MFA Conditional Access policy

See [MFA Enforcement](#mfa-enforcement) below. Do this before sharing the URL with any users.

---

## Deployment: Production Mode

Complete all Demo Mode steps first, replacing `CLAIMS_DATA_MODE=demo` with `CLAIMS_DATA_MODE=production` everywhere, then complete the additional steps below.

### Additional Step A — Implement the ProductionClaimsAdapter

Open `src/lib/claims/adapters/production.ts`. Replace each `throw new Error(...)` stub with a real call to your CMS API. The `fetch` helper and constructor are already wired to `CLAIMS_API_BASE_URL` and `CLAIMS_API_KEY`.

The `ClaimsAdapter` interface in `src/lib/claims/adapter.ts` defines the exact contract. Your CMS responses must map to the types in `src/lib/claims/types.ts`. Key fields the rest of the application depends on:

| Field | Type | Used by |
|---|---|---|
| `jurisdiction` | 2-letter state code | AI system prompt, VCK form selection |
| `type` | `Medical-Only \| Lost-Time \| PPD \| PTD` | Dashboard, filters |
| `icd10Codes` | `string[]` | AI context, future form pre-fill |
| `claimant`, `employer` | Full objects with address | Form pre-population |
| `status` | `active \| pending \| rtw \| escalated \| closed` | Dashboard metrics, badges |

### Additional Step B — Add CMS credentials to SWA and GitHub secrets

```bash
az staticwebapp appsettings set \
  --name swa-adaptcloud-wc-claims-dev \
  --resource-group rg-adaptcloud-wc-claims-dev \
  --setting-names \
    CLAIMS_DATA_MODE="production" \
    CLAIMS_API_BASE_URL="https://<your-cms-api>/v1" \
    CLAIMS_API_KEY="<your-cms-api-key>"
```

Add the same three values as GitHub secrets (`CLAIMS_DATA_MODE`, `CLAIMS_API_BASE_URL`, `CLAIMS_API_KEY`).

### Additional Step C — Verify network connectivity

If your CMS API is behind a private network or firewall, Azure Static Web Apps will need either:
- An **allowlisted outbound IP range** on the CMS side (SWA uses shared Azure egress IPs — get the current list from Azure documentation), or
- A **VNet integration** (requires SWA Dedicated tier, ~$120/month)

For internal CMS APIs not accessible from the internet, the VNet integration path is the right one.

---

## Azure Infrastructure (Bicep)

The `infra/` directory contains a subscription-scoped Bicep deployment that creates all required Azure resources.

```
infra/
├── main.bicep           # Creates resource group, calls modules
├── main.bicepparam      # Dev environment parameter values
├── modules/
│   ├── openai.bicep     # Azure OpenAI account + GPT-4o deployment (S0, Standard)
│   └── staticwebapp.bicep  # Static Web App (Standard tier)
└── deploy.sh            # Wrapper: validates, deploys, prints all output values
```

**To deploy:**
```bash
./infra/deploy.sh <subscription-id>
```

**To modify parameters** (region, model, capacity):
```bash
# Edit before deploying
cat infra/main.bicepparam
```

**Outputs printed by deploy.sh:**

| Output | GitHub Secret / SWA Setting |
|---|---|
| `openAiEndpoint` | `AZURE_OPENAI_ENDPOINT` |
| `openAiDeploymentName` | `AZURE_OPENAI_DEPLOYMENT_NAME` |
| `swaHostname` | `NEXTAUTH_URL` (prefix with `https://`) |
| `swaDeploymentToken` | `AZURE_STATIC_WEB_APPS_API_TOKEN` |

> The OpenAI API key is not in the Bicep outputs for security. Retrieve it separately with `az cognitiveservices account keys list`.

---

## Environment Variables Reference

### Required in all modes

Set in `.env.local` for local dev. Set as **SWA Application Settings** for runtime and as **GitHub secrets** for build time.

| Variable | Where to find it | Required |
|---|---|---|
| `NEXTAUTH_URL` | `http://localhost:3000` locally; `https://<swa-hostname>` in prod | Yes |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Yes |
| `AZURE_AD_CLIENT_ID` | Entra ID → App registration → Overview | Yes |
| `AZURE_AD_CLIENT_SECRET` | Entra ID → App registration → Certificates & secrets | Yes |
| `AZURE_AD_TENANT_ID` | Entra ID → App registration → Overview | Yes |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI → Keys and Endpoint | Yes |
| `AZURE_OPENAI_API_KEY` | Azure OpenAI → Keys and Endpoint | Yes |
| `AZURE_OPENAI_DEPLOYMENT_NAME` | Azure OpenAI → Model deployments | Yes |
| `CLAIMS_DATA_MODE` | `demo` or `production` | Yes |

### Production mode only

| Variable | Description | Required |
|---|---|---|
| `CLAIMS_API_BASE_URL` | Base URL of your CMS REST API | Yes (production) |
| `CLAIMS_API_KEY` | API key or service account token for CMS | Yes (production) |

### Optional display

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | App title shown in the browser tab and header |
| `NEXT_PUBLIC_ORG_NAME` | Organization name shown in the sidebar |

> `NEXT_PUBLIC_` variables are embedded at build time and sent to the browser. Never put secrets in them.

---

## MFA Enforcement

MFA is enforced at three independent layers. All three must fail simultaneously for a session without MFA to reach the application — in practice this is not possible once the Conditional Access policy is active.

| Layer | Where | What it does |
|---|---|---|
| Conditional Access policy | Entra ID portal | Blocks the OAuth flow entirely if MFA is not completed. Primary enforcement. |
| `acr_values: "mfa"` | `src/lib/auth.ts` | Application explicitly requests MFA step-up in the authorization request, even if the user has an existing non-MFA session cookie. |
| `amr` claim check | `src/lib/auth.ts` + `src/middleware.ts` | JWT callback reads Azure AD's Authentication Methods References claim and sets `mfaVerified: boolean`. Middleware rejects any session where `mfaVerified !== true` before the request reaches any page or API route. |

### Conditional Access policy setup

1. **portal.azure.com → Entra ID → Security → Conditional Access → New policy**
2. Name: `CA-WC-Claims-Portal-Require-MFA`
3. **Users**: your claims adjusters group (exclude break-glass accounts)
4. **Target resources → Cloud apps**: select `wc-claims-portal-dev`
5. **Grant → Require multifactor authentication**
6. Set to **Report-only** for 24 hours, verify in Sign-in logs, then set to **On**

---

## RBAC — Role-Based Access Control

Roles are assigned in **Entra ID → App registration → App roles**, then granted to users or groups via **Enterprise Applications → Assign users and groups**.

### Defined roles

| Role value | Who gets it | What it unlocks |
|---|---|---|
| `Claims.Adjuster` | Front-line adjusters | Full portal access including AI chat |
| `Claims.Supervisor` | Supervisors, managers | Full portal access including AI chat |
| `Claims.ReadOnly` | Auditors, compliance | Portal and claim views; AI chat blocked |

### Where enforcement happens

- **`/api/chat`** — requires `Claims.Adjuster` or `Claims.Supervisor`. Returns `403 Forbidden` with a clear message for `Claims.ReadOnly` users and anyone with no role assigned.
- All other routes are accessible to any authenticated user with a valid MFA session. Role-gating on specific claim actions (reserve updates, status changes) is the next enforcement layer.

### Adding a role in Entra ID

1. **App registration → App roles → Create app role**
   - Display name: `Claims Adjuster`
   - Allowed member types: Users/Groups
   - Value: `Claims.Adjuster`
   - Description: Front-line WC claims adjuster — can view claims and use the AI assistant
2. **Enterprise Applications → your app → Users and groups → Add user/group**
   - Select the user or group, assign the role

Roles appear in the `id_token` claims on the user's next sign-in and flow through to `session.user.roles` automatically.

---

## Audit Logging

Every significant action is written as structured JSON to stdout. In Azure Static Web Apps, stdout flows to **Azure Monitor / Log Analytics** automatically — no additional SDK required to start.

### What is logged

| Event | When |
|---|---|
| `claims.list` | Any adjuster views the claims list |
| `claim.view` | Any adjuster opens a specific claim |
| `chat.request` | An AI message is sent (includes claim ID, jurisdiction, message count) |
| `chat.rate_limited` | A user hits the 20 req/min limit |
| `chat.error` | Azure OpenAI returns an error |

### Log format

```json
{
  "audit": true,
  "type": "chat.request",
  "userId": "<azure-ad-oid>",
  "userEmail": "adjuster@yourorg.com",
  "userName": "T. Brown",
  "claimId": "WC-2024-0891",
  "jurisdiction": "CA",
  "metadata": { "messageCount": 4 },
  "timestamp": "2024-10-22T14:35:00.000Z"
}
```

### Querying in Log Analytics

Once connected to a Log Analytics workspace, query audit events with:

```kusto
AppTraces
| where Properties.audit == "true"
| project
    Timestamp = todatetime(Properties.timestamp),
    Type      = tostring(Properties.type),
    UserId    = tostring(Properties.userId),
    UserEmail = tostring(Properties.userEmail),
    ClaimId   = tostring(Properties.claimId)
| order by Timestamp desc
```

### Upgrading to Application Insights custom events

When you're ready for structured telemetry, dashboards, and alerting:

1. `npm install applicationinsights`
2. Add `APPLICATIONINSIGHTS_CONNECTION_STRING` to SWA Application Settings
3. In `src/lib/audit.ts`, add `client.trackEvent()` alongside the `console.log` — no callers change

---

## GitHub Actions CI/CD

The workflow at `.azure/deploy.yml` triggers on every push to `main` and on pull requests.

### What it does

1. Checks out the repo
2. Installs Node 20, runs `npm ci` in `wc-claims-portal/`
3. Runs `next build` with all secrets injected as env vars
4. Uploads `.next/standalone` to Azure Static Web Apps
5. On PR close, tears down the preview environment automatically

### GitHub secrets required

All variables in the [Required in all modes](#required-in-all-modes) table plus `AZURE_STATIC_WEB_APPS_API_TOKEN`. For production deployments, also add the [Production mode only](#production-mode-only) variables.

> **Why both GitHub secrets and SWA Application Settings?** GitHub secrets are available only during the build step (compile-time). SWA Application Settings are injected at runtime into the Next.js server process. Non-`NEXT_PUBLIC_` variables must be in both places.

---

## GitHub Copilot Compatibility

| Copilot product | Compatible | Notes |
|---|---|---|
| **GitHub Copilot** (VS Code / JetBrains) | Yes | TypeScript interfaces give Copilot strong context. The `ClaimsAdapter` interface is particularly useful — Copilot can see the contract and suggest correct `ProductionClaimsAdapter` implementations when wiring a CMS. |
| **GitHub Copilot for Azure** (`@azure` extension) | Yes | The Bicep files in `infra/` are directly compatible. Ask it to modify resources, add modules, or explain the deployment. |
| **Copilot Autofix** (security scanning in PRs) | Yes | No conflicts with the current setup. Will flag issues in workflow files and source code automatically. |

**One caveat**: `.azure/deploy.yml` builds the app manually rather than using the SWA integrated build service (`skip_app_build: true`). Copilot for Azure sometimes suggests switching to the managed build flow. Do not remove `skip_app_build: true` — the Next.js standalone output must be built with secrets available, which the SWA build service cannot access.

---

## Project Structure

```
wc-claims-portal/
├── infra/
│   ├── main.bicep                    # Subscription-scoped entry point
│   ├── main.bicepparam               # Dev environment parameters
│   ├── modules/
│   │   ├── openai.bicep              # Azure OpenAI + model deployment
│   │   └── staticwebapp.bicep        # SWA (Standard tier)
│   └── deploy.sh                     # Deployment wrapper script
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/   # NextAuth OAuth handler
│   │   │   ├── claims/               # GET /api/claims — list
│   │   │   ├── claims/[id]/          # GET /api/claims/:id — single claim
│   │   │   └── chat/                 # POST /api/chat — streaming SSE
│   │   ├── auth/signin/              # Azure AD sign-in page
│   │   ├── auth/error/               # Auth error page
│   │   ├── claims/                   # Claims list page
│   │   ├── claims/[id]/              # Per-claim split view (detail + AI chat)
│   │   ├── dashboard/                # KPI stats + activity feed
│   │   └── layout.tsx / page.tsx
│   │
│   ├── components/
│   │   ├── chat/ChatPanel.tsx        # Streaming chat UI, markdown rendering
│   │   ├── claims/
│   │   │   ├── ClaimDetail.tsx       # Claim data panel (pure display, typed props)
│   │   │   ├── ClaimsTable.tsx       # Claims list table (pure display, typed props)
│   │   │   ├── DashboardStats.tsx    # KPI cards (pure display, typed props)
│   │   │   └── RecentActivity.tsx    # Activity feed (pure display, typed props)
│   │   └── ui/
│   │       ├── AppShell.tsx          # Sidebar nav + mobile layout
│   │       └── AuthProvider.tsx      # NextAuth SessionProvider wrapper
│   │
│   ├── lib/
│   │   ├── auth.ts                   # NextAuth config, MFA enforcement
│   │   ├── azure-openai.ts           # OpenAIClient + WC domain system prompt
│   │   └── claims/
│   │       ├── types.ts              # Claim, ClaimSummary, DashboardMetrics, etc.
│   │       ├── adapter.ts            # ClaimsAdapter interface (the contract)
│   │       ├── index.ts              # Singleton factory — reads CLAIMS_DATA_MODE
│   │       └── adapters/
│   │           ├── demo.ts           # 10-claim seed dataset, in-memory
│   │           └── production.ts     # CMS API stub — implement to go live
│   │
│   ├── middleware.ts                 # Route protection + mfaVerified enforcement
│   └── types/
│       ├── chat.ts                   # Message, Role types
│       └── next-auth.d.ts            # Session augmentation (roles, oid, mfaVerified)
│
├── staticwebapp.config.json          # SWA routing rules + security headers
├── .azure/deploy.yml                 # GitHub Actions CI/CD workflow
├── .env.example                      # Environment variable template
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Key Routes

| Route | Auth + MFA | Description |
|---|---|---|
| `/` | Yes | Redirects to `/dashboard` |
| `/dashboard` | Yes | KPI metrics + recent claim activity |
| `/claims` | Yes | Full claims list with jurisdiction column |
| `/claims/[id]` | Yes | Claim detail panel + streaming AI chat |
| `/auth/signin` | No | Azure AD sign-in (Microsoft button) |
| `/auth/error` | No | Auth error display |
| `/api/auth/[...nextauth]` | No | NextAuth OAuth callback handler |
| `/api/claims` | Yes | `GET` — returns `ClaimSummary[]` |
| `/api/claims/:id` | Yes | `GET` — returns full `Claim` or 404 |
| `/api/chat` | Yes | `POST` — streaming SSE, 20 req/min per user |

### `/api/chat` request body

```json
{
  "messages": [{ "role": "user", "content": "..." }],
  "claimId": "WC-2024-0891",
  "jurisdiction": "CA"
}
```

`jurisdiction` is automatically injected into the AI system prompt so responses cite the correct state statutes, deadlines, and form requirements.

---

## Security Notes

- **MFA**: Three-layer enforcement — Conditional Access policy, `acr_values` in auth request, `amr` claim verified server-side. See [MFA Enforcement](#mfa-enforcement).
- **RBAC**: `/api/chat` requires `Claims.Adjuster` or `Claims.Supervisor` role. Read-only users and unenrolled accounts receive `403`. See [RBAC](#rbac--role-based-access-control).
- **Audit logging**: All claim views and AI interactions are logged as structured JSON. See [Audit Logging](#audit-logging).
- **Route protection**: `src/middleware.ts` blocks all routes except `/auth/*` and `/api/auth/*` for sessions without a verified MFA claim.
- **API protection**: All API routes independently verify `getServerSession` — they do not trust middleware alone.
- **Rate limiting**: `/api/chat` enforces 20 requests per minute per user (by Azure AD OID) using an in-memory sliding window. Prevents unbounded Azure OpenAI spend.
- **Security headers**: `staticwebapp.config.json` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and Content Security Policy on all responses.
- **Secrets**: Nothing is committed to the repo. Credentials flow through GitHub Actions secrets (build time) and SWA Application Settings (runtime).
- **Session lifetime**: JWT sessions expire after 8 hours (one work day).
- **AI disclaimer**: The chat UI shows a notice that AI responses must be verified against jurisdiction statutes and clinical guidelines. The AI has no write access to any claims system.

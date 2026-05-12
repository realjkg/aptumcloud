# Aptum Cloud — Insurance Agent Platform on Azure

Infrastructure-as-code for an **insurance application** built **low-code first**
(Power Platform + Copilot Studio) and progressively layered with **API
connectors**, deployed inside an **Azure Landing Zone (ALZ)** with **policy as
code** governance.

This directory is the implementation of the Microsoft Cloud Adoption Framework
guidance **"Govern and secure AI agents across your organization"**
(<https://learn.microsoft.com/azure/cloud-adoption-framework/ai-agents/governance-security-across-organization>)
and the AI landing zone / Application landing zone guidance.

## Why this layout

The CAF says: agents are a **new identity class**, they must run inside an
**Application (workload) landing zone** that sits under an **Application Platform
management group**, and their guardrails must be **policy as code**. If your
tenant does not already have an Application Platform landing zone, you must
create one before onboarding agent workloads — so we do.

```
azure/
├── landing-zones/
│   └── application-platform/   # Creates the Application Platform MG + vends the
│                               # insurance-app workload subscription, spoke network,
│                               # central Log Analytics, platform managed identities.
├── policy-as-code/             # Azure Policy definitions + AI-agent governance
│                               # initiative (policy set) + assignments. Deployed by
│                               # the platform team at the Application Platform MG scope.
├── workloads/
│   └── insurance-app/          # The insurance workload landing zone:
│                               #  - Power Platform managed environment + DLP (connector
│                               #    classification) — low-code first
│                               #  - APIM-fronted custom/API connectors (templates)
│                               #  - Copilot Studio / AI Foundry agents, each with its
│                               #    own Entra Agent ID / user-assigned managed identity
│                               #  - Key Vault, Application Insights, private endpoints
└── docs/
    └── caf-ai-agent-governance-mapping.md   # Control-by-control traceability matrix
```

## Build / deploy order

1. **Platform team** — `landing-zones/application-platform/` (idempotent: creates
   the Application Platform MG and supporting subscription only if absent).
2. **Platform team** — `policy-as-code/` (publishes definitions + the
   `ai-agent-governance` initiative and assigns it at the Application Platform MG).
3. **Workload team** — `workloads/insurance-app/` (low-code environment first;
   connectors and AI Foundry agents layered on top, all behind the policy guardrails).

Each directory has its own `README.md`, `providers.tf`, `variables.tf`, and
`terraform.tfvars.example`. Nothing here is meant to go straight to production —
review, parameterize, and run through your own pipeline first.

## Design principles (from the CAF article)

| Principle | How it shows up here |
|---|---|
| Agents are first-class identities | Every agent gets a dedicated **Entra Agent ID** (Copilot Studio / AI Foundry) or **user-assigned managed identity**; no shared identities, no human impersonation, no secrets in code. See `workloads/insurance-app/identity-agents.tf`. |
| Least privilege | Scoped RBAC role assignments + scoped connector permissions + Conditional Access targeting agent identities. |
| Run inside a landing zone | The workload is a vended **Application landing zone** subscription peered to the connectivity hub; PaaS is private-endpoint only. |
| Policy as code | `policy-as-code/` — allowed regions, approved models, deny public network access, require diagnostic settings, require ownership/classification tags, audit managed identity / disable local auth. |
| Low-code first, widest connector reach | Power Platform **managed environment** + **DLP policy** classifying the full connector catalog into Business / Non-Business / Blocked; custom **API connectors** generated from OpenAPI specs in `workloads/insurance-app/connectors/`. |
| Traceable / observable | Central Log Analytics, Application Insights per agent, diagnostic settings enforced by policy, Purview/DSPM-for-AI hooks, Defender for Cloud AI threat protection. |
| Adaptive & flexible | Connector classification, model allow-lists, environment settings, and policy parameters are all variables — change governance posture without re-architecting. |

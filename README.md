# Okta OIG Manager (React + Node.js Monorepo)

**Version 3.0**

Okta OIG Manager is a web application for managing Okta Identity Governance (OIG) resource labels. It allows administrators to create and manage label categories and values, assign labels to groups, applications, and entitlement values, and gain visibility into label coverage across the org.

This repository contains a React single-page application (Vite) and a Node.js (Express) backend in a single GitHub repo.

- The **frontend** runs at `http://localhost:5173` in development.
- The **backend** runs at `http://localhost:3001` in development.
- In development, the frontend proxies API calls to the backend (e.g. `/api/...`).
- In production, the Node backend serves the built React app.

---

## What's New in v3.0

### Applications — full tenant inventory
The Applications page now loads all applications in the Okta tenant and organizes them into two sections: **Entitlement Management Enabled** and **Standard**. Previously only entitlement-enabled apps were shown. Label assignments work for both sections; the Entitlements tab is only shown for apps where entitlement management is enabled.

### Dashboard — unlabeled resources
The Dashboard now shows which specific groups and applications have no governance labels assigned. Unlabeled Groups and Unlabeled Applications panels appear at the bottom of the Dashboard listing up to 10 resources each. The Groups and Applications stat cards also show a labeled/unlabeled breakdown in their sub-text.

### Dashboard — accurate labeled resource count
The "Labeled Resources" stat card previously summed assignment counts across all label values, which double-counted resources carrying more than one label. It now shows the exact count of distinct resources with at least one label assigned.

### Dashboard — live data sync
The Dashboard automatically refreshes its counts and panels after any label assignment or removal made elsewhere in the app. Navigating back to the Dashboard no longer requires a manual page reload to see current data.

### Performance
- **Service token caching** — the backend now caches Okta service tokens for their full lifetime (minus a 30-second buffer), eliminating a token round-trip on every API call.
- **Groups pagination** — all groups in the tenant are now fetched regardless of directory size. Previously the list was capped at 200.
- **Parallel bulk assignments** — Bulk Assign now fires all assignment requests simultaneously instead of sequentially.

---

## What's New in v2.5

### Dashboard
The Dashboard provides a high-level summary of label coverage across the org. It shows the total number of label categories and values configured, how many groups and applications have at least one label assigned, and highlights resources that remain unlabeled. This gives administrators an at-a-glance view of governance label adoption and gaps.

### Bulk Assign
Bulk Assign allows administrators to assign a label value to multiple resources in a single operation, rather than assigning labels one resource at a time. Administrators select a resource type (Groups, Applications, or Entitlement Values), choose the specific resources to label, select a label value, and confirm the assignment. The tool reports success and failure status for each resource in the batch.

### Label Manager Enhancements
Label categories and values can now be fully managed within the app. Administrators can add new values to existing categories inline, and delete values that are no longer needed. Deleting a value that is still assigned to one or more resources is blocked with a clear explanation.

### Label Search
The Label Search page allows administrators to find all resources assigned a specific label value. Search results can be unassigned individually or in bulk directly from the results list, without navigating away.

---

## Features

- **Dashboard** — label coverage overview across groups, apps, and entitlements
- **Label Manager** — create, edit, and delete label categories and values
- **Groups** — browse directory groups and manage their label assignments
- **Applications** — browse all apps split into Entitlement Management Enabled and Standard sections; manage app-level labels and assign labels to entitlement values for enabled apps
- **Label Search** — find all resources tagged with a given label value and unassign directly from results
- **Bulk Assign** — assign a label value to multiple groups, applications, or entitlement values at once

---

## Repository Layout

```
okta-governance-labelmaker/
    ├── frontend/               # React + Vite SPA
    │   └── src/
    │       ├── components/
    │       └── pages/
    ├── backend/                # Express API (BFF)
    ├── .env                    # Shared environment file (root)
    ├── .env.example
    ├── .gitignore
    ├── package.json            # Root scripts
    └── README.md
```

---

## Prerequisites

### 1) Okta Tenant & Application Setup

This app requires Okta Identity Governance to be enabled on the tenant. It relies on two OAuth applications.

#### Frontend SPA App

Create an App Integration → OIDC - OpenID Connect → Single-Page Application with:
- **Client Credentials:** Require PKCE as additional verification
- **Grant types:** Authorization Code, Interaction Code
- **Sign-in redirect URI:** `http://localhost:5173/login/callback`

Note the Client ID — used for `VITE_OKTA_CLIENT_ID` and `OKTA_CLIENT_ID` in `.env`.

#### Backend Service App

Create an App Integration → API Services application with:
- **Client authentication:** Public key / Private key
- Add your public key under General → Public Keys; add the private key to `.env` as `BFF_PRIVATE_KEY`


Grant the service app the following Okta API Scopes:
- `okta.apps.manage`
- `okta.apps.read`
- `okta.directories.groups.manage`
- `okta.governance.entitlements.read`
- `okta.governance.entitlements.manage`
- `okta.governance.labels.manage`
- `okta.governance.labels.read`
- `okta.governance.resourceOwner.manage`
- `okta.governance.resourceOwner.read`
- `okta.groups.manage`
- `okta.groups.read`

API Services application must also be assigned an Admin role with the appropriate permissions. Visit the following URL for more details: https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/#use-the-client-credentials-grant-flow

#### Additional Okta Configuration

API Access Management must be enabled on the tenant. The frontend app must have an access policy configured for it.

---

### 2) Install Git

- **macOS:** `xcode-select --install`
- **Windows:** install Git for Windows
- **Linux:** install via your package manager (e.g. `apt`, `dnf`)

### 3) Install Node.js + npm (LTS recommended)

```bash
node -v
npm -v
```

If using **nvm**:
```bash
nvm install --lts
nvm use --lts
```

---

## Quick Start (Development)

### 1) Clone the repository

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd okta-governance-labelmaker
```

### 2) Create the root `.env` file

```bash
cp .env.example .env
```

Then fill in the required values (see Environment Variables below).

### 3) Install dependencies

```bash
npm run install:all
```

Or manually:
```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 4) Start the app

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Health check:
```bash
curl -i http://localhost:3001/api/health
```

---

## Environment Variables (Root `.env`)

Both the frontend and backend load from the single `.env` at the repo root.

### Frontend (Vite)

Vite only exposes variables prefixed with `VITE_` to the browser.

```ini
VITE_OKTA_ISSUER=https://{yourOktaDomain}/oauth2/{authServerId}
VITE_OKTA_CLIENT_ID=0oaxxxxxxxxxxxxxxxxx
VITE_OKTA_REDIRECT_URI=http://localhost:5173/login/callback
VITE_OKTA_SCOPES=openid profile email
VITE_API_PROXY_TARGET=http://localhost:3001
VITE_OKTA_PARTITION=okta                        # or "oktapreview" for preview tenants
VITE_OKTA_ORG_ID=00oxxxxxxxxxxxxxxxxx           # your org's ID
```

### Backend (Express)

```ini
PORT=3001
NODE_ENV=development

# NO trailing slash, NO path — a trailing slash causes an invalid_client error on every API call
OKTA_ORG_URL=https://{yourOktaDomain}
OKTA_ISSUER=https://{yourOktaDomain}/oauth2/{authServerId}
OKTA_CLIENT_ID=0oaxxxxxxxxxxxxxxxxx
OKTA_AUDIENCE=api://default

BFF_CLIENT_ID=0oaSERVICEAPPCLIENTIDxxxxxxxx
BFF_PRIVATE_KEY={"kty":"RSA","kid":"...","use":"sig","alg":"RS256","n":"...","e":"AQAB","d":"..."}
```

> `BFF_PRIVATE_KEY` must be valid JSON on a single line with no line breaks.

---

## Running in Production

### 1) Build the frontend

```bash
npm --prefix frontend run build
```

This produces `frontend/dist`.

### 2) Start the backend in production mode

```bash
NODE_ENV=production npm --prefix backend start
```

The backend serves the React build from `frontend/dist` and exposes all API routes under `/api/...`.

---

## Tailwind CSS Setup (Frontend)

From the repo root:
```bash
npm --prefix frontend install -D tailwindcss postcss autoprefixer
cd frontend
npx tailwindcss init -p
cd ..
```

Ensure `frontend/src/index.css` contains:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

If `npx tailwindcss init` fails with `could not determine executable to run`:
```bash
cd frontend
npm exec tailwindcss init -p
```

---

## Scripts

From the repo root:

```bash
npm run install:all                       # install all dependencies
npm run dev                               # start frontend + backend concurrently
npm --prefix frontend run build           # build frontend for production
npm --prefix backend start                # start backend
```

---

## Common Troubleshooting

**Backend won't start: "Missing required env var: OKTA_CLIENT_ID"**
Add `OKTA_CLIENT_ID=0oaxxxxxxxxxxxxxxxxx` to your root `.env` and restart.

**Frontend shows 404 for `/api/...`**
Confirm the backend is running on port 3001 and that `VITE_API_PROXY_TARGET=http://localhost:3001` is set in `.env`.

**API calls return `invalid_client` / "audience claim must be the endpoint invoked"**
`OKTA_ORG_URL` has a trailing slash or includes a path segment. It must be exactly `https://{yourOktaDomain}` — no trailing slash, no `/oauth2/default` suffix.

**Sign-in redirects to the wrong Okta application**
`VITE_OKTA_CLIENT_ID` is missing from `.env` or has an incorrect value. This variable must be set and must match `OKTA_CLIENT_ID` — both should be the SPA client ID. Vite only exposes `VITE_`-prefixed variables to the browser; `OKTA_CLIENT_ID` alone is not sufficient.

**API calls return `E0000006 You do not have permission`**
The service app (`BFF_CLIENT_ID`) is missing required Okta API scopes. In the Okta Admin Console go to the service app → Okta API Scopes and grant the scopes listed in the Prerequisites section. No restart is needed after granting scopes.

**"Each child in a list should have a unique key prop"**
React warning only — does not block execution. Ensure list items use stable unique keys (Okta IDs are ideal).

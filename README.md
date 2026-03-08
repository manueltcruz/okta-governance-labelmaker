# Okta OIG Manager (React + Node.js Monorepo)

**Version 2.5**

Okta OIG Manager is a web application for managing Okta Identity Governance (OIG) resource labels. It allows administrators to create and manage label categories and values, assign labels to groups, applications, and entitlement values, and gain visibility into label coverage across the org.

This repository contains a React single-page application (Vite) and a Node.js (Express) backend in a single GitHub repo.

- The **frontend** runs at `http://localhost:5173` in development.
- The **backend** runs at `http://localhost:3001` in development.
- In development, the frontend proxies API calls to the backend (e.g. `/api/...`).
- In production, the Node backend serves the built React app.

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
- **Applications** — browse entitlement-enabled apps, manage app-level labels, and assign labels to entitlement values
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

Resources for key generation:
- https://jwkset.com/generate
- https://developer.okta.com/docs/guides/key-management/main/

Grant the service app the following Okta API Scopes:
- `okta.apps.manage`
- `okta.apps.read`
- `okta.directories.groups.manage`
- `okta.governance.entitlements.read`
- `okta.governance.labels.manage`
- `okta.governance.labels.read`
- `okta.governance.resourceOwner.manage`
- `okta.governance.resourceOwner.read`
- `okta.groups.manage`
- `okta.groups.read`

#### Additional Okta Configuration

API Access Management must be enabled on the tenant.

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

**"Each child in a list should have a unique key prop"**
React warning only — does not block execution. Ensure list items use stable unique keys (Okta IDs are ideal).

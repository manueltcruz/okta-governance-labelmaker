# Okta OIG Manager (React + Node.js Monorepo)

**Version 2.0**

A web application for managing Okta Identity Governance (OIG) Resource Labels. Create and manage label categories and values, assign them to groups, applications, and entitlements, and search for labeled resources across your org.

This repository contains a React single-page application (Vite) and a Node.js (Express) backend in a single GitHub repo.

- The **frontend** runs at `http://localhost:5173` in development.
- The **backend** runs at `http://localhost:3001` in development.
- In development, the frontend proxies API calls to the backend (e.g. `/api/...`).
- In production, the Node backend serves the built React app.

---

## Features

### Manage

| Page | Description |
|---|---|
| **Label Manager** | Create label categories and values. Edit value names and colors. Delete categories. |
| **Groups** | Browse Okta Universal Directory groups. Assign and unassign label values per group. |
| **Applications** | Browse entitlement-enabled applications. Assign labels to apps and to individual entitlement values. |

### Explore

| Page | Description |
|---|---|
| **Label Search** | Select a label category and value to see all resources currently tagged with it. Filter results by resource type (Application, Group, Entitlement). |

---

## Repository Layout

```
okta-governance-labelmaker/
├── frontend/               # React + Vite SPA
│   └── src/
│       ├── components/     # Shared UI components
│       ├── pages/          # Page-level components
│       └── utils/
├── backend/
│   └── server.js           # Express API (BFF)
├── .env                    # Shared environment file (repo root)
├── package.json            # Root scripts
└── README.md
```

---

## Prerequisites

### 1) Okta Tenant & Application Setup

This app requires **Okta Identity Governance** to be enabled on the tenant.

It relies on two OAuth applications:

#### Frontend SPA App

Create a new App Integration → **OIDC - OpenID Connect → Single-Page Application** with:

- **Client Credentials:** Require PKCE as additional verification
- **Grant types:** Authorization Code + Interaction Code
- **Sign-in redirect URI:** `http://localhost:5173/login/callback`

Note the **Client ID** — needed for `VITE_OKTA_CLIENT_ID` and `OKTA_CLIENT_ID` in `.env`.

#### Backend Service App

Create a new App Integration → **API Services**. Note the **Client ID** — needed for `BFF_CLIENT_ID` in `.env`.

For authentication, set **Client authentication** to `Public key / Private key`. Add the public key to the app's General → Public Keys section, and add the private key to `BFF_PRIVATE_KEY` in `.env`.

Useful references:
- https://jwkset.com/generate
- https://developer.okta.com/docs/guides/key-management/main/

Grant the service app the following **Okta API Scopes**:

```
okta.apps.read
okta.governance.entitlements.read
okta.governance.labels.manage
okta.governance.labels.read
okta.governance.resourceOwner.read
okta.groups.manage
okta.groups.read
```

> **Note:** `okta.governance.entitlements.read` is required for the Applications page to load entitlement categories and values. The original scope list has been updated to reflect the routes currently in use.

#### Additional Okta Configuration

**API Access Management** must be enabled on the tenant.

---

### 2) Install Git

- macOS: `xcode-select --install`
- Windows: install Git for Windows
- Linux: install via your package manager (e.g., apt, dnf)

### 3) Install Node.js + npm (LTS recommended)

```bash
node -v
npm -v
```

If your Node version is very new (e.g. Node 25+) and you hit tooling issues, install an LTS version (Node 20 or 22).

Recommended (optional): **nvm** (Node Version Manager)

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
touch .env
```

See the **Environment Variables** section below for required values.

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

### 4) Install frontend UI dependencies

The frontend uses the **Okta Odyssey** design system (built on MUI). Install these after the base install:

```bash
npm --prefix frontend install @okta/odyssey-react-mui @mui/material @emotion/react @emotion/styled
```

### 5) Start the app

```bash
npm run dev
```

This starts both frontend and backend concurrently. You should see:

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

Health check:

```bash
curl -i http://localhost:3001/api/health
```

---

## Environment Variables (Root `.env`)

Both frontend and backend load from the single `.env` file at the repo root.

### Frontend variables (Vite)

Vite only exposes variables prefixed with `VITE_` to the browser.

```ini
# Frontend (Vite) config
VITE_OKTA_ISSUER=https://{yourOktaDomain}/oauth2/{authServerId}
VITE_OKTA_CLIENT_ID=0oaxxxxxxxxxxxxxxxxx
VITE_OKTA_REDIRECT_URI=http://localhost:5173/login/callback
VITE_OKTA_SCOPES=openid profile email
VITE_API_PROXY_TARGET=http://localhost:3001   # optional, defaults to 3001
```

### Backend variables (Express / Okta service app)

```ini
# Backend (Express) config
PORT=3001
NODE_ENV=development

# Okta org URL
OKTA_ORG_URL=https://{yourOktaDomain}

# JWT verification for incoming user access tokens
OKTA_ISSUER=https://{yourOktaDomain}/oauth2/{authServerId}
OKTA_CLIENT_ID=0oaxxxxxxxxxxxxxxxxx
OKTA_AUDIENCE=api://default

# Backend service app (client credentials via private key JWT)
BFF_CLIENT_ID=0oaSERVICEAPPCLIENTIDxxxxxxxx
BFF_PRIVATE_KEY={"kty":"RSA","kid":"...","use":"sig","alg":"RS256","n":"...","e":"AQAB","d":"..."}
```

> `BFF_PRIVATE_KEY` must be valid JSON on a **single line**. If your key contains line breaks, convert it to a one-line JSON string before adding it to `.env`.

---

## UI Design System

The frontend uses the [Okta Odyssey](https://github.com/okta/odyssey) design system (`@okta/odyssey-react-mui`), which is built on top of MUI v5. The app is wrapped in `OdysseyProvider` in `main.jsx`, which applies Okta's official typography (Aeonik), color tokens, and component styles globally.

Odyssey components in use:
- `Button` (primary / secondary variants)
- `TextField` (all text inputs)
- `Dialog` / `DialogTitle` / `DialogContent` / `DialogActions` (modals)
- `Chip` (status badges and label pills)
- `CircularProgress` (loading indicators)
- `Avatar` / `Menu` (profile dropdown)

The app coexists with Tailwind CSS for layout utilities. Custom CSS variables in `index.css` are aligned to Odyssey's palette to ensure visual consistency.

---

## Running in Production

### 1) Build the frontend

```bash
npm run build
```

This produces `frontend/dist`.

### 2) Start in production mode

```bash
npm run start:prod
```

The backend will serve the React build from `frontend/dist` and expose API routes under `/api/...`.

---

## Scripts (from repo root)

| Command | Description |
|---|---|
| `npm run install:all` | Install root, backend, and frontend dependencies |
| `npm run dev` | Start frontend + backend concurrently |
| `npm run build` | Build the frontend for production |
| `npm run start:prod` | Start backend in production mode |

---

## Common Troubleshooting

### Backend won't start: "Missing required env var: OKTA_CLIENT_ID"

Your `.env` at the repo root is missing a required variable. Add it and restart:

```bash
npm run dev
```

### Frontend shows 404 for `/api/...`

- Confirm the backend is running on port 3001
- Confirm `VITE_API_PROXY_TARGET` is set (or defaults to `http://localhost:3001`)
- Confirm you are running `npm run dev` from the **repo root**, not from inside `frontend/`

### App loads but governance data is empty

- Confirm the backend service app has all required API scopes (see Prerequisites)
- Confirm `BFF_PRIVATE_KEY` is a valid single-line JSON string in `.env`
- Check the backend terminal for specific error messages from Okta

### "Each child in a list should have a unique key prop"

React warning caused by non-unique keys in `.map()`. Should not block execution, but can cause unexpected UI behavior. Use stable Okta resource IDs as keys where possible.

# Okta LabelMaker (React + Node.js Monorepo)

This repository contains a React single-page application (Vite) and a Node.js (Express) backend in a single GitHub repo.

- The **frontend** runs at `http://localhost:5173` in development.
- The **backend** runs at `http://localhost:3001` in development.
- In development, the frontend proxies API calls to the backend (e.g. `/api/...`).
- In production, the Node backend serves the built React app.

---

## Repository Layout

okta-labelmaker/
backend/ # Express API (BFF)
frontend/ # React + Vite SPA
.env # Shared environment file (root)
package.json # Root scripts for convenience


---

## Prerequisites

### 1) Install Git
- macOS: install Xcode Command Line Tools
  ```bash
  xcode-select --install

Windows: install Git for Windows

Linux: install via your package manager (e.g., apt, dnf)

2) Install Node.js + npm (recommended: LTS)

This project uses Node + npm to run both the backend and frontend.

Recommended:

Node.js LTS (not “Current”)

npm will be included with Node.

Verify:
node -v
npm -v

If your Node version is very new (e.g. Node 25+), and you hit tooling issues, install an LTS version (Node 20 or 22 LTS).

Recommended (optional but helpful): nvm (Node Version Manager) so you can switch Node versions easily.

macOS/Linux: install nvm, then:
nvm install --lts
nvm use --lts

Windows: use nvm-windows

Quick Start (Development)
1) Clone the repository

git clone <YOUR_GITHUB_REPO_URL>
cd okta-labelmaker

2) Create the root .env file

Create a file named .env in the repo root (same folder as the root package.json).

Example:
touch .env

Then open .env and add the required variables (see Environment Variables section below).

3) Install dependencies (root + frontend + backend)

From the repo root:

npm run install:all

If that script does not exist in your root package.json, run these instead:
npm install
npm --prefix backend install
npm --prefix frontend install

4) Start the app (frontend + backend)

From the repo root:
npm run dev

You should see:

Frontend: http://localhost:5173
Backend: http://localhost:3001

Health check:
curl -i http://localhost:3001/api/health

Environment Variables (Root .env)

This project uses a single .env file at the repo root.
Both the frontend and backend load configuration from this file.

Frontend variables (Vite)

Vite only exposes variables prefixed with VITE_ to the browser.

Required:

VITE_OKTA_ISSUER

VITE_OKTA_CLIENT_ID

VITE_OKTA_REDIRECT_URI

VITE_OKTA_SCOPES

VITE_API_PROXY_TARGET (optional; default is usually http://localhost:3001)

Example:
# -----------------------------
# Frontend (Vite) config
# -----------------------------
VITE_OKTA_ISSUER=https://{yourOktaDomain}/oauth2/{authServerId}
VITE_OKTA_CLIENT_ID=0oaxxxxxxxxxxxxxxxxx
VITE_OKTA_REDIRECT_URI=http://localhost:5173/login/callback
VITE_OKTA_SCOPES=openid profile email
VITE_API_PROXY_TARGET=http://localhost:3001

Backend variables (Express / Okta service app)

The backend uses these values to:

verify user access tokens (JWT verification)

obtain a backend service token using client credentials + private key JWT

call Okta Governance APIs

Required backend values typically include:
# -----------------------------
# Backend (Express) config
# -----------------------------
PORT=3001
NODE_ENV=development

# Okta Org / API base URL
OKTA_ORG_URL=https://{yourOktaDomain}

# JWT verification for incoming user access tokens
OKTA_ISSUER=https://{yourOktaDomain}/oauth2/{authServerId}
OKTA_CLIENT_ID=0oaxxxxxxxxxxxxxxxxx
OKTA_AUDIENCE=api://default

# Backend service app (client credentials via private key JWT)
BFF_CLIENT_ID=0oaSERVICEAPPCLIENTIDxxxxxxxx
BFF_PRIVATE_KEY={"kty":"RSA","kid":"...","use":"sig","alg":"RS256","n":"...","e":"AQAB","d":"..."}

Notes:

OKTA_CLIENT_ID is used by the backend verifier to validate tokens. In most setups, this corresponds to the OIDC app/client issuing the tokens used by the frontend.

BFF_CLIENT_ID and BFF_PRIVATE_KEY are the service app credentials used for backend-to-Okta calls (client credentials grant).

BFF_PRIVATE_KEY must be valid JSON on a single line. If your key contains line breaks, convert it to a one-line JSON string.

Tailwind CSS Setup (Frontend)

This repository uses Tailwind CSS in the frontend (Vite).

Normal install steps

From the repo root:
npm --prefix frontend install -D tailwindcss postcss autoprefixer

Then initialize Tailwind config files:
cd frontend
npx tailwindcss init -p
cd ..

Ensure frontend/src/index.css contains:
@tailwind base;
@tailwind components;
@tailwind utilities;

Ensure your frontend/tailwind.config.js includes:
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

If you get: npm error could not determine executable to run

This can happen when npx cannot find the Tailwind CLI executable.

Use this recovery path (most reliable):

Reinstall Tailwind in the frontend explicitly:
npm --prefix frontend install -D tailwindcss@latest postcss@latest autoprefixer@latest

Run Tailwind init using a direct executable path via npm:
cd frontend
npm exec tailwindcss init -p
cd ..

If that still fails, try forcing npx to use the local package:
cd frontend
npx --yes tailwindcss@latest init -p
cd ..

Verify Tailwind is installed:
npm --prefix frontend ls tailwindcss


Running in Production
1) Build the frontend

From repo root:
npm --prefix frontend run build

The backend will:

serve the React build from frontend/dist

expose API routes under /api/...

Common Troubleshooting
Backend won’t start: “Missing required env var: OKTA_CLIENT_ID”

This means your backend startup validation is expecting OKTA_CLIENT_ID in the root .env.

Add it:
OKTA_CLIENT_ID=0oaxxxxxxxxxxxxxxxxx

Restart:
npm run dev

Frontend shows 404 for /api/...

In development, the frontend proxies requests to the backend. Confirm:

backend is running on http://localhost:3001

VITE_API_PROXY_TARGET is set correctly (or defaults to 3001)

frontend/vite.config.js is configured to load .env from the repo root (your project already does this)

“Each child in a list should have a unique key prop”

This is a React warning, usually due to using non-unique IDs in .map().
It should not block execution, but it can cause strange UI behavior in some cases.
Fix by ensuring each list item uses a stable unique key (Okta IDs are ideal).

Scripts

From the repo root:

Install everything:
npm run install:all

Run dev (frontend + backend):
npm run dev

Build frontend:
npm --prefix frontend run build

npm --prefix frontend run build

Start backend:
npm --prefix backend start


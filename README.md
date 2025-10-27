# SQL Runner

SQL Runner is a lightweight, modern web app to write and run SQL queries against a sample database. It provides a polished editor, live results, a tables view, and recent query management, wrapped in a responsive neon/glass UI with dark/light mode and authentication.

## Tech Stack

- Frontend
  - React 18, Vite, TypeScript
  - Tailwind CSS
  - Monaco Editor (@monaco-editor/react)
  - Framer Motion (micro-interactions)
  - Lucide Icons
- Backend
  - FastAPI (Python)
  - Uvicorn (ASGI server)
  - SQLite (embedded DB for demo)
- Authentication
  - Firebase Authentication (client-side login)
  - Optional Firebase Admin on backend (token verification). A dev bypass flag is available.
- Tooling
  - Axios (HTTP)

## Features

- SQL editor with syntax highlighting (Monaco)
- Run queries (SELECT/INSERT/UPDATE/DELETE and DDL)
- Results table with CSV export
- Tables panel
  - Session-based: shows tables created during the current session
- Recent Queries panel with quick re-run and clear
- Dark/Light theme toggle with smooth transitions
- Animated, responsive UI with accessible controls
- Optional authentication via Firebase (login retained; query execution does not require auth in dev)

## Setup and Installation

### Prerequisites
- Node.js (LTS) and npm
- Python 3.10+

### 1) Clone and install

```bash
# In project root
# Frontend
cd frontend
npm install

# Backend
cd ../backend
python -m venv .venv
# PowerShell
. .\.venv\Scripts\Activate.ps1
# or CMD
# .venv\Scripts\activate.bat
pip install -r requirements.txt
```

### 2) Environment variables

Frontend (frontend/.env):
```bash
VITE_API_BASE_URL=http://127.0.0.1:8001
```

Backend (optional; choose one):
- Dev bypass (no token verification): set in the same shell before starting Uvicorn
  - PowerShell
    ```powershell
    $env:ALLOW_UNAUTH = "true"
    ```
  - CMD
    ```cmd
    set ALLOW_UNAUTH=true
    ```
- Production-style auth (verify Firebase ID tokens):
  - Place `serviceAccountKey.json` in `backend/` OR set:
    ```powershell
    $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\\path\\to\\serviceAccountKey.json"
    ```

CORS
- Backend allows localhost dev origins by default. Add your prod frontend domain when deploying.

### 3) Run locally

Backend (from backend/):
```powershell
# PowerShell
# Optional: $env:ALLOW_UNAUTH = "true"  # to bypass auth in dev
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

Verify API: http://127.0.0.1:8001/docs

Frontend (from frontend/):
```bash
npm run dev
# Visit the URL Vite prints, e.g. http://localhost:5173 or http://localhost:5175
```

## Database Setup

- SQLite is used for demo and is pre-initialized via backend code. To inspect tables:
  - Run: `SELECT name FROM sqlite_master WHERE type='table';`
- DDL operations are idempotent on the backend (CREATE TABLE -> CREATE TABLE IF NOT EXISTS; DROP TABLE -> DROP TABLE IF EXISTS).
- If you prefer a managed DB (e.g., Postgres) for production, replace the SQLite connection in `backend/main.py` and provide appropriate drivers/config.

## Firebase Authentication

- Frontend uses Firebase Authentication for login.
  - Configure Firebase in `frontend/src/lib/firebase.ts` with your project settings.
- Backend token verification is optional:
  - For local/dev: use `ALLOW_UNAUTH=true` to skip verification.
  - For production: ensure Firebase Admin is initialized
    - Place `serviceAccountKey.json` in `backend/` (excluded from git), or
    - Set `GOOGLE_APPLICATION_CREDENTIALS` to the JSON path.

Security
- Do not commit `serviceAccountKey.json`.
- Add `.env`, `.venv`, `__pycache__`, `sql_runner.db`, and build outputs to `.gitignore`.

## Deployment

### Live URLs
- **Frontend**: https://sql-runner-hazel.vercel.app/
- **Backend**: https://sql-runner-xmi7.onrender.com/

### Frontend (Vercel)
- Build: `npm run build`
- Output: `dist`
- Environment Variables (set in Vercel dashboard):
  - `VITE_API_BASE_URL=https://sql-runner-xmi7.onrender.com`
  - `VITE_FIREBASE_API_KEY=<your-key>`
  - `VITE_FIREBASE_AUTH_DOMAIN=<your-domain>`
  - `VITE_FIREBASE_PROJECT_ID=<your-project-id>`
  - `VITE_FIREBASE_APP_ID=<your-app-id>`

### Backend (Render)
- Runtime: Python 3.11.9 (specified in `runtime.txt`)
- Install: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Environment Variables (set in Render dashboard):
  - `ALLOW_UNAUTH=false` (recommended for prod)
  - `GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccountKey.json` (or provide secrets as env/volume)
- CORS: Frontend domain `https://sql-runner-hazel.vercel.app` is already configured in `main.py`
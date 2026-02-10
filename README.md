# EpiTrello 2.0 — Kanban App (Monorepo)

EpiTrello is a modern Kanban application to organize projects with boards, lists, and cards, member management, invitations, checklists, and tags. The repository is structured as a monorepo with:

- frontend/ (Angular 20 + Angular Material, SSR, Karma/Jasmine tests)
- backend/ (Express.js + TypeScript + MongoDB, REST API)

## Table of Contents
- Overview and structure
- Installation and start
- Configuration (environments, OAuth)
- Tests and CI
- Available scripts
- Architecture and docs

## Repository Structure
```
EpiTrello2.0/
├── frontend/                  # Angular application
│   ├── src/                   # Source code
│   ├── angular.json
│   ├── karma.conf.js
│   ├── package.json
│   └── ARCHITECTURE.md        # Frontend architecture doc
├── backend/                   # Express API
│   ├── src/                   # Source code
│   ├── package.json
│   └── ARCHITECTURE.md        # Backend architecture doc
└── .github/workflows/
    └── frontend-tests.yml     # Frontend tests CI
```

## Installation and Start

### Frontend (Angular)
```bash
cd frontend
npm install
npm run start
# http://localhost:4200/
```
- Production build:
```bash
npm run build
```
- SSR (Server-Side Rendering):
```bash
npm run build
npm run serve:ssr:EpiTrello
```
- API configuration:
  - Edit `src/environments/environment.development.ts` to point to your API:
    ```ts
    export const environment = {
      production: false,
      apiURL: 'http://localhost:5000/api'
    };
    ```

### Backend (Express + MongoDB)
```bash
cd backend
npm install
```
Create `.env` in `backend/`:
```
PORT=5000
DATABASE_URL=mongodb://localhost:27017/epitrello
JWT_SECRET=your_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_LOGIN_URL=http://localhost:4200/login
FRONTEND_GOOGLE_URL=http://localhost:4200/
NODE_ENV=development
```
- Start in development:
```bash
npm start
# http://localhost:5000
```
- Build and start in production:
```bash
npm run build
npm run start-build
```

## Authentication and OAuth
- Local auth (name + password) and Google OAuth 2.0
- Frontend triggers Google flow via backend endpoint:
  - GET `/api/auth/google`
- Ensure `FRONTEND_*_URL` in backend matches your frontend domain

## Tests and CI

### Frontend
- Unit/integration tests with Karma + Jasmine
- Brave/Chrome Headless configured via `karma.conf.js`
- Run tests locally:
```bash
cd frontend
npm run test -- --watch=false
# Headless mode:
# PowerShell:
$env:KARMA_HEADLESS="true"; npm run test -- --watch=false
# CMD:
set KARMA_HEADLESS=true && npm run test -- --watch=false
```

### CI GitHub Actions
- Workflow: `.github/workflows/frontend-tests.yml`
- Installs Chrome and exports `CHROME_BIN`; runs `npm ci` then `npm run test -- --watch=false`

## Available Scripts

### Frontend
```json
{
  "start": "ng serve",
  "build": "ng build",
  "test": "ng test",
  "serve:ssr:EpiTrello": "node dist/EpiTrello/server/server.mjs"
}
```

### Backend
```json
{
  "start": "ts-node src/server.ts",
  "build": "tsc",
  "start-build": "node dist/server.js",
  "test": "jest"
}
```

## Architecture and Documentation
- Frontend: [frontend/ARCHITECTURE.md](frontend/ARCHITECTURE.md)
- Backend: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)

 

## License
This project is intended for educational use. Add a license if needed.

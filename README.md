# EpiTrello 2.0 — Kanban App (Monorepo)

EpiTrello est une application Kanban moderne permettant d’organiser des projets avec des boards, des listes et des cartes, la gestion des membres, des invitations, des checklists et des tags. Le dépôt est structuré en monorepo avec:

- frontend/ (Angular 20 + Angular Material, SSR, tests Karma/Jasmine)
- backend/ (Express.js + TypeScript + MongoDB, REST API)

## Sommaire
- Présentation et structure
- Installation et démarrage
- Configuration (environnements, OAuth)
- Tests et CI
- Scripts disponibles
- Documentation technique

## Structure du dépôt
```
EpiTrello2.0/
├── frontend/                  # Application Angular
│   ├── src/                   # Code source
│   ├── angular.json
│   ├── karma.conf.js
│   ├── package.json
│   └── ARCHITECTURE.md        # Doc d’architecture frontend
├── backend/                   # API Express
│   ├── src/                   # Code source
│   ├── package.json
│   └── ARCHITECTURE.md        # Doc d’architecture backend
└── .github/workflows/
    └── frontend-tests.yml     # CI tests frontend
```

## Installation et démarrage

### Frontend (Angular)
```bash
cd frontend
npm install
npm run start
# http://localhost:4200/
```
- Build production:
```bash
npm run build
```
- SSR (Server-Side Rendering):
```bash
npm run build
npm run serve:ssr:EpiTrello
```
- Configuration API:
  - Modifier `src/environments/environment.development.ts` pour pointer vers l’API:
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
- Fichier `.env` à créer dans `backend/`:
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
- Démarrer en développement:
```bash
npm start
# http://localhost:5000
```
- Build et start production:
```bash
npm run build
npm run start-build
```

## Authentification et OAuth
- Auth locale (nom + mot de passe) et Google OAuth 2.0
- Frontend déclenche le flow Google via l’endpoint backend:
  - GET `/api/auth/google`
- S’assurer que `FRONTEND_*_URL` dans le backend correspond au domaine du frontend

## Tests et CI

### Frontend
- Tests unitaires/intégration avec Karma + Jasmine
- Brave/Chrome Headless configuré via `karma.conf.js`
- Lancer les tests en local:
```bash
cd frontend
npm run test -- --watch=false
# Mode headless:
# PowerShell:
$env:KARMA_HEADLESS="true"; npm run test -- --watch=false
# CMD:
set KARMA_HEADLESS=true && npm run test -- --watch=false
```

### CI GitHub Actions
- Workflow: `.github/workflows/frontend-tests.yml`
- Installe Chrome et exporte `CHROME_BIN`; exécute `npm ci` puis `npm run test -- --watch=false`

## Scripts disponibles

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

## Architecture et documentation
- Frontend: [frontend/ARCHITECTURE.md](frontend/ARCHITECTURE.md)
- Backend: [backend/ARCHITECTURE.md](backend/ARCHITECTURE.md)

 

## Licence
Ce projet est destiné à un usage pédagogique. Ajoutez une licence si nécessaire.

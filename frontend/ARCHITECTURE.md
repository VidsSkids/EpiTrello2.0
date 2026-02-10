# EpiTrello Frontend Architecture Documentation

## 📋 Overview

EpiTrello frontend is a Kanban application built with Angular 20 (standalone components, signals) and Angular Material. It provides management of boards, lists, cards, checklists, tags, invitations, and members, with local authentication + Google OAuth, SSR, and a “zoneless” testing strategy using Karma/Jasmine.

---

## 🏗️ Architecture Model

Feature- and service-oriented architecture:

```
Route → Composant → Services → HTTP API → Rendu UI
          ↓
        State (BehaviorSubjects + signals)
          ↓
      Gestion des effets (CDR, RxJS)
```

### Couches clés

| Layer | Role | Path |
|-------|------|------|
| Routes | Navigation definition | [app.routes.ts](src/app/app.routes.ts) |
| Components | UI and interactions | [features/*/components](src/app/features) |
| Services | Business logic, API integration | [board.service.ts](src/app/features/board/services/board.service.ts), [auth.service.ts](src/app/features/auth/services/auth.service.ts) |
| Environments | API configuration | [environment.development.ts](src/environments/environment.development.ts), [environment.ts](src/environments/environment.ts) |
| Theme/Styles | Material + global styles | [styles.css](src/styles.css), [custom-theme.scss](src/custom-theme.scss) |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.ts, app.html, app.css
│   │   ├── app.routes.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── components/login, register
│   │   │   │   └── services/auth.service.ts
│   │   │   ├── home/
│   │   │   │   ├── home.component.{ts,html,css}
│   │   │   │   └── components/boards-list, create-board-dialog, invitations, ...
│   │   │   └── board/
│   │   │       ├── components/board, list, card
│   │   │       └── services/board.service.ts
│   ├── assets/, public/
│   ├── environments/environment*.ts
│   ├── main.ts, main.server.ts, server.ts
│   └── styles.css, custom-theme.scss
├── angular.json
├── karma.conf.js
├── package.json
└── README.md
```

Entry Points:
- Application: [app.ts](src/app/app.ts), [app.html](src/app/app.html), [app.routes.ts](src/app/app.routes.ts)
- SSR: [server.ts](src/server.ts), [main.server.ts](src/main.server.ts)

---

## 🚀 Getting Started (Development)

Prerequisites:
- Node 20+
- npm 10+
- Brave or Chrome (tests)

Installation:
```bash
cd frontend
npm install
```

Dev server:
```bash
npm run start
# http://localhost:4200/
```

Production build:
```bash
npm run build
```

SSR:
```bash
npm run build
npm run serve:ssr:EpiTrello
```

---

## 🔐 Authentication (Frontend)

Methods:
- Local (name/password): [auth.service.ts](src/app/features/auth/services/auth.service.ts#L15-L35)
- Google OAuth (redirect): [loginWithGoogle](src/app/features/auth/services/auth.service.ts#L54-L60)

Components:
- Login: [login.component.ts](src/app/features/auth/components/login/login.component.ts#L37-L69), [login.component.html](src/app/features/auth/components/login/login.component.html)
- Register: [register.component.ts](src/app/features/auth/components/register/register.component.ts#L36-L62), [register.component.html](src/app/features/auth/components/register/register.component.html)

API Configuration:
- `environment.apiURL` est consommé par les services: [environment.development.ts](src/environments/environment.development.ts#L1-L5)

---

## 🗂️ Client-side Modeling

Centralized state via BoardService:
- Streams: `boards$`, `lists$`, `cards$`, `invitationsReceived$`, `invitationsSent$`, `member$`
- Sources: BehaviorSubject + hydratation depuis API
- File: [board.service.ts](src/app/features/board/services/board.service.ts#L11-L26)

Key Components:
- Board: [board.component.ts](src/app/features/board/components/board/board.component.ts), [board.component.html](src/app/features/board/components/board/board.component.html)
- List: [list.component.ts](src/app/features/board/components/list/list.component.ts), [list.component.html](src/app/features/board/components/list/list.component.html)
- Card: [card.component.ts](src/app/features/board/components/card/card.component.ts), [card.component.html](src/app/features/board/components/card/card.component.html)
- Invitations: [invitations.component.ts](src/app/features/home/components/invitations/invitations.component.ts), [invitations.component.html](src/app/features/home/components/invitations/invitations.component.html)
- Home: [home.component.ts](src/app/features/home/home.component.ts), [home.component.html](src/app/features/home/home.component.html)

---

## 🔄 Request/Response Flow (example)

Create a project from Home:
```typescript
// Composant: openCreateBoardDialog() → CreateBoardDialogComponent
// Service:
this.boardService.createProject(title).subscribe({
  next: (project) => this.boardService.loadBoards(),
});
```
References:
- Création projet: [board.service.ts:createProject](src/app/features/board/services/board.service.ts#L65-L72)
- Chargement projets: [board.service.ts:loadBoards](src/app/features/board/services/board.service.ts#L73-L93)

---

## ⚠️ Error Handling (UI)

- AuthService and BoardService propagate errors via RxJS `throwError`.
- Components display messages in the UI (`error` state) and log for diagnostics.
- Examples:
- Login: [login.component.ts](src/app/features/auth/components/login/login.component.ts#L62-L66)
- Register: [register.component.ts](src/app/features/auth/components/register/register.component.ts#L51-L56)

---

## 🧪 Testing

Framework:
- Karma + Jasmine
- Stratégie zoneless: `provideZonelessChangeDetection()` dans les TestBed
- Headless via Brave/Chrome

Key Files:
- Config Karma: [karma.conf.js](karma.conf.js)
- Angular builder test: [angular.json](angular.json#L63-L99)
- Specs principaux:
  - App: [app.spec.ts](src/app/app.spec.ts)
  - Auth: [login.component.spec.ts](src/app/features/auth/components/login/login.component.spec.ts), [register.component.spec.ts](src/app/features/auth/components/register/register.component.spec.ts)
  - Board/Home: [board.component.spec.ts](src/app/features/board/components/board/board.component.spec.ts), [invitations.component.spec.ts](src/app/features/home/components/invitations/invitations.component.spec.ts)

Run:
```bash
npm run test -- --watch=false
# Headless:
KARMA_HEADLESS=true npm run test -- --watch=false
```

CI:
- Workflow: [../.github/workflows/frontend-tests.yml](../.github/workflows/frontend-tests.yml)
- Installe Chrome Headless et exporte CHROME_BIN

---

## 🎨 Theme & UI

- Angular Material (AppBar, menus, boutons, inputs, dialogs)
- Textures and backgrounds:
- Board grid: [board.component.css](src/app/features/board/components/board/board.component.css#L19-L37)
- Home dotted pattern: [home.component.css](src/app/features/home/home.component.css#L21-L43)
- Welcome banner: [home.component.html](src/app/features/home/home.component.html#L61-L69)

---

## 🔄 Common Frontend Workflows

Add a UI feature:
1. Define routes: [app.routes.ts](src/app/app.routes.ts)
2. Create the standalone component and its template.
3. Extend the service if an API is needed: [board.service.ts](src/app/features/board/services/board.service.ts)
4. Connect state (BehaviorSubject/Observables).
5. Add tests (zoneless) and required stubs (HttpClient, Router, Dialog).

---

## 📦 Key Dependencies

| Package | Rôle |
|---------|------|
| `@angular/*` | Framework (core, router, forms, common) |
| `@angular/material` | UI Material |
| `@angular/build` | Builder (application, karma) |
| `rxjs` | Streams et orchestration |
| `karma`, `jasmine` | Tests |

---

## 🐛 Troubleshooting

- Erreur Zone.js (NG0908) en test:
  - Solution: `provideZonelessChangeDetection()` dans TestBed
- `No provider for _HttpClient` en test:
  - Ajouter `provideHttpClient()` et stub `AuthService.getToken()`
- Router/ActivatedRoute manquants en test:
  - Utiliser `provideRouter([])`
- MatDialog manquant:
  - Stub `MatDialogRef`, `MAT_DIALOG_DATA`

---

## 📖 Best Practices

- Thin components: move logic to services.
- Stateless services, DI via Angular.
- No network calls in tests; use stubs.
- State via BehaviorSubject + selectors; avoid direct mutation.
- Consistent Material theme; do not expose secrets in the frontend.

---

## 🔧 Configuration

- Paramètres builder/test: [angular.json](angular.json)
- Karma Brave/Headless: [karma.conf.js](karma.conf.js)
- Environnements API: [environment.development.ts](src/environments/environment.development.ts), [environment.ts](src/environments/environment.ts)

---

## 📝 Notes for New Frontend Developers

- Start with services (Auth, Board) to understand the flows.
- Browse Board/List/Card components for interactions.
- Read specs for zoneless test patterns.
- Check environments to avoid network errors in dev/test.

Happy coding! 🚀

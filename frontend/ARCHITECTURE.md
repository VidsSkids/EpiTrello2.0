# EpiTrello Frontend Architecture Documentation

## 📋 Aperçu

Frontend Kanban "EpiTrello" basé sur Angular 20 (standalone components, signals) et Angular Material. Il propose la gestion des boards, listes, cartes, checklists, tags, invitations et membres, avec authentification locale + Google OAuth, SSR, et une stratégie de tests "zoneless" avec Karma/Jasmine.

---

## 🏗️ Modèle d’architecture

Architecture orientée fonctionnalités et services:

```
Route → Composant → Services → HTTP API → Rendu UI
          ↓
        State (BehaviorSubjects + signals)
          ↓
      Gestion des effets (CDR, RxJS)
```

### Couches clés

| Couche | Rôle | Répertoire |
|-------|------|------------|
| Routes | Définition de la navigation | [app.routes.ts](src/app/app.routes.ts) |
| Composants | UI et interactions | [features/*/components](src/app/features) |
| Services | Logique métier, intégration API | [board.service.ts](src/app/features/board/services/board.service.ts), [auth.service.ts](src/app/features/auth/services/auth.service.ts) |
| Environnements | Configuration API | [environment.development.ts](src/environments/environment.development.ts), [environment.ts](src/environments/environment.ts) |
| Thème/Styles | Material + styles globaux | [styles.css](src/styles.css), [custom-theme.scss](src/custom-theme.scss) |

---

## 📁 Structure du projet

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

Points d’entrée:
- Application: [app.ts](src/app/app.ts), [app.html](src/app/app.html), [app.routes.ts](src/app/app.routes.ts)
- SSR: [server.ts](src/server.ts), [main.server.ts](src/main.server.ts)

---

## 🚀 Démarrage développement

Prérequis:
- Node 20+
- npm 10+
- Brave ou Chrome (tests)

Installation:
```bash
cd frontend
npm install
```

Serveur dev:
```bash
npm run start
# http://localhost:4200/
```

Build prod:
```bash
npm run build
```

SSR:
```bash
npm run build
npm run serve:ssr:EpiTrello
```

---

## 🔐 Authentification (Frontend)

Méthodes:
- Locale (name/password): [auth.service.ts](src/app/features/auth/services/auth.service.ts#L15-L35)
- Google OAuth (redirection): [loginWithGoogle](src/app/features/auth/services/auth.service.ts#L54-L60)

Composants:
- Login: [login.component.ts](src/app/features/auth/components/login/login.component.ts#L37-L69), [login.component.html](src/app/features/auth/components/login/login.component.html)
- Register: [register.component.ts](src/app/features/auth/components/register/register.component.ts#L36-L62), [register.component.html](src/app/features/auth/components/register/register.component.html)

Configuration API:
- `environment.apiURL` est consommé par les services: [environment.development.ts](src/environments/environment.development.ts#L1-L5)

---

## 🗂️ Modélisation côté client

State centralisé via BoardService:
- Streams: `boards$`, `lists$`, `cards$`, `invitationsReceived$`, `invitationsSent$`, `member$`
- Sources: BehaviorSubject + hydratation depuis API
- Fichier: [board.service.ts](src/app/features/board/services/board.service.ts#L11-L26)

Composants clés:
- Board: [board.component.ts](src/app/features/board/components/board/board.component.ts), [board.component.html](src/app/features/board/components/board/board.component.html)
- List: [list.component.ts](src/app/features/board/components/list/list.component.ts), [list.component.html](src/app/features/board/components/list/list.component.html)
- Card: [card.component.ts](src/app/features/board/components/card/card.component.ts), [card.component.html](src/app/features/board/components/card/card.component.html)
- Invitations: [invitations.component.ts](src/app/features/home/components/invitations/invitations.component.ts), [invitations.component.html](src/app/features/home/components/invitations/invitations.component.html)
- Home: [home.component.ts](src/app/features/home/home.component.ts), [home.component.html](src/app/features/home/home.component.html)

---

## 🔄 Flux Requête/Réponse (exemple)

Créer un projet depuis Home:
```typescript
// Composant: openCreateBoardDialog() → CreateBoardDialogComponent
// Service:
this.boardService.createProject(title).subscribe({
  next: (project) => this.boardService.loadBoards(),
});
```
Références:
- Création projet: [board.service.ts:createProject](src/app/features/board/services/board.service.ts#L65-L72)
- Chargement projets: [board.service.ts:loadBoards](src/app/features/board/services/board.service.ts#L73-L93)

---

## ⚠️ Gestion des erreurs (UI)

- AuthService et BoardService propagent les erreurs via RxJS `throwError`.
- Les composants affichent les messages dans l’UI (`error` state) et loggent pour diagnostic.
- Exemples:
- Login: [login.component.ts](src/app/features/auth/components/login/login.component.ts#L62-L66)
- Register: [register.component.ts](src/app/features/auth/components/register/register.component.ts#L51-L56)

---

## 🧪 Tests

Cadre:
- Karma + Jasmine
- Stratégie zoneless: `provideZonelessChangeDetection()` dans les TestBed
- Headless via Brave/Chrome

Fichiers clés:
- Config Karma: [karma.conf.js](karma.conf.js)
- Angular builder test: [angular.json](angular.json#L63-L99)
- Specs principaux:
  - App: [app.spec.ts](src/app/app.spec.ts)
  - Auth: [login.component.spec.ts](src/app/features/auth/components/login/login.component.spec.ts), [register.component.spec.ts](src/app/features/auth/components/register/register.component.spec.ts)
  - Board/Home: [board.component.spec.ts](src/app/features/board/components/board/board.component.spec.ts), [invitations.component.spec.ts](src/app/features/home/components/invitations/invitations.component.spec.ts)

Exécution:
```bash
npm run test -- --watch=false
# Headless:
KARMA_HEADLESS=true npm run test -- --watch=false
```

CI:
- Workflow: [../.github/workflows/frontend-tests.yml](../.github/workflows/frontend-tests.yml)
- Installe Chrome Headless et exporte CHROME_BIN

---

## 🎨 Thème & UI

- Angular Material (AppBar, menus, boutons, inputs, dialogs)
- Textures et fonds:
- Quadrillage Board: [board.component.css](src/app/features/board/components/board/board.component.css#L19-L37)
- Motif à pois Home: [home.component.css](src/app/features/home/home.component.css#L21-L43)
- Bannière de bienvenue: [home.component.html](src/app/features/home/home.component.html#L61-L69)

---

## 🔄 Workflows courants (Frontend)

Ajouter une fonctionnalité UI:
1. Définir les routes: [app.routes.ts](src/app/app.routes.ts)
2. Créer le composant (standalone) et son template.
3. Étendre le service si API nécessaire: [board.service.ts](src/app/features/board/services/board.service.ts)
4. Connecter State (BehaviorSubject/Observables).
5. Ajouter les tests (zoneless) et stubs requis (HttpClient, Router, Dialog).

---

## 📦 Dépendances clés

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

## 📖 Bonnes pratiques

- Composants fins: la logique côté services.
- Services stateless, DI via Angular.
- Pas d’appels réseau dans les tests; utiliser des stubs.
- State via BehaviorSubject + sélecteurs; éviter mutations directes.
- Thème cohérent Material; ne pas exposer de secrets dans le frontend.

---

## 🔧 Configuration

- Paramètres builder/test: [angular.json](angular.json)
- Karma Brave/Headless: [karma.conf.js](karma.conf.js)
- Environnements API: [environment.development.ts](src/environments/environment.development.ts), [environment.ts](src/environments/environment.ts)

---

## 📝 Notes pour nouveaux devs Frontend

- Commencer par les services (Auth, Board) pour comprendre les flux.
- Parcourir les composants Board/List/Card pour les interactions.
- Lire les specs pour les patterns de test zoneless.
- Vérifier les environments pour éviter les erreurs réseau en dev/test.

Bon dev ! 🚀

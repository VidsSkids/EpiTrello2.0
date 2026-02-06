# EpiTrello — Kanban

EpiTrello est une application Kanban moderne permettant d’organiser des projets sous forme de boards, listes et cartes. Elle intègre la gestion des membres, des invitations, des checklists et un partage de projet. L’interface est construite avec Angular Material et fonctionne côté client et SSR.

## Fonctionnalités
- Boards, listes et cartes avec édition du titre et réorganisation.
- Checklists sur les cartes, tags et membres assignés.
- Invitations et gestion des rôles des membres.
- Partage de projet (dialog dédié).
- Page Home avec bannière de bienvenue et liens rapides.
- Authentification: Login, Register et “Continue with Google”.
- Thème Material et textures (grid/pois) sur les pages.

## Stack technique
- Angular 20 (standalone components, signals).
- Angular Material (UI).
- SSR via `@angular/build` (scripts fournis).
- Tests unitaires/intégration avec Karma + Jasmine (configuration Brave).

## Prérequis
- Node.js 20+ (recommandé)
- npm 10+
- Optionnel: Brave Browser (pour exécuter les tests facilement) ou Chrome

## Installation
```bash
cd frontend
npm install
```

## Développement
```bash
npm run start
# ou
ng serve
```
- Ouvre http://localhost:4200/
- Reload automatique sur modification des sources

## Build
```bash
npm run build
```
- Les artefacts sont générés dans `dist/`

## SSR (Server-Side Rendering)
```bash
npm run build
npm run serve:ssr:EpiTrello
```
- Lance le serveur SSR à partir de `dist/EpiTrello/server/server.mjs`

## Configuration API
- Les services consomment l’API via `environment.apiURL`.
- Fichiers d’environnement:
  - `src/environments/environment.development.ts` (utilisé en dev)
  - `src/environments/environment.ts` (prod, à compléter)
- Exemple:
```ts
export const environment = {
  production: false,
  apiURL: 'http://YOUR_API_HOST/api'
};
```
- L’authentification Google utilise l’endpoint `${environment.apiURL}/auth/google` côté backend.

## Tests
### Commandes
```bash
npm run test              # lance Karma avec Brave (configurée)
npm run test -- --watch=false  # exécution unique (CI)
```

### Navigateur de test (Brave/Headless)
- Karma est configuré pour utiliser Brave via `karma.conf.js`.
- Mode headless:
  - Windows PowerShell:
    ```powershell
    $env:KARMA_HEADLESS="true"; npm run test
    ```
  - CMD:
    ```cmd
    set KARMA_HEADLESS=true && npm run test
    ```
- Si Brave n’est pas détecté automatiquement, définis `CHROME_BIN`:
  - Windows PowerShell:
    ```powershell
    $env:CHROME_BIN="C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"; npm run test
    ```

### Stratégie de tests “zoneless”
- Les specs utilisent `provideZonelessChangeDetection()` pour éviter Zone.js.
- Les composants/services testés requièrent souvent:
  - `provideHttpClient()` (HTTP)
  - `provideRouter([])` (Router/ActivatedRoute)
  - Stubs pour `AuthService.getToken()` si besoin
  - Pour les dialogs Material: `MatDialogRef` et `MAT_DIALOG_DATA`
- Cette approche accélère les tests et limite les effets de bord.

## Scripts npm
```json
{
  "start": "ng serve",
  "build": "ng build",
  "test": "ng test",
  "serve:ssr:EpiTrello": "node dist/EpiTrello/server/server.mjs"
}
```

## Génération de composants
```bash
ng generate component component-name
ng generate --help   # liste des schémas disponibles
```

## Conventions
- UI: Angular Material, styles cohérents avec le thème.
- Tests: éviter les appels réseau; stubber les services; zoneless par défaut.
- Sécurité: ne pas exposer de secrets dans les environnements frontend.

## Ressources
- Angular CLI: https://angular.dev/tools/cli

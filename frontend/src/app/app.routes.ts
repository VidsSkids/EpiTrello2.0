import { Routes } from '@angular/router';
import { authGuard } from './features/auth/guards/auth.guard';
import { HomeComponent } from './features/home/home.component';
import { BoardsListComponent } from './features/home/components/boards-list/boards-list.component';

export const routes: Routes = [
    { path: 'home', redirectTo: '', pathMatch: 'full' },
    {
        path: '', component: HomeComponent,
        children: [
            // default child intentionally empty to show Home welcome
            { path: 'w/board', component: BoardsListComponent },
            { path: 'w/boards', component: BoardsListComponent },
            { path: 'w/invitations', loadComponent: () => import('./features/home/components/invitations/invitations.component').then(m => m.InvitationsComponent) }
        ],
        canActivate: [authGuard]
    },
    {
        path: 'board/:id',
        loadChildren: () => import('./features/board/board.routes').then(m => m.boardRoutes),
        loadComponent: () => import('./features/board/components/board/board.component').then(m => m.BoardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'login',
        loadComponent: () => import('./features/auth/components/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'auth/google-callback',
        loadComponent: () => import('./features/auth/components/google-callback/google-callback.component').then(m => m.GoogleCallbackComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./features/auth/components/register/register.component').then(m => m.RegisterComponent)
    }
];

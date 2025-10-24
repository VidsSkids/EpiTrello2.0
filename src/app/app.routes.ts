import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { TipCard } from './features/home/components/tip-card/tip-card';
import { BoardsList } from './features/home/components/boards-list/boards-list';

export const routes: Routes = [
    { path: 'home', redirectTo: '', pathMatch: 'full' },
    { path: '', component: HomeComponent,
        children: [
            { path: '', component: TipCard },
            { path: 'w/board', component: BoardsList }
        ]
    },
    {
        path: 'board/:id',
        loadChildren: () => import('./features/board/board-routes').then(m => m.boardRoutes), 
        loadComponent: () => import('./features/board/components/board/board').then(m => m.Board)
    },
];

import { Routes } from '@angular/router';
import { Board } from './components/board/board';

export const boardRoutes: Routes = [
  { path: 'board/:id', component: Board },
];

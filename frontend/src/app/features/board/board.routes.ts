import { Routes } from '@angular/router';
import { BoardComponent } from './components/board/board.component';

export const boardRoutes: Routes = [
  { path: 'board/:id', component: BoardComponent },
];

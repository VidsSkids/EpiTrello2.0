import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { BoardService } from '../board/services/board.service';
import { Board } from '../board/models/board';
import { CreateBoardDialogComponent } from './components/create-board-dialog/create-board-dialog.component';
import { Observable } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterOutlet } from '@angular/router';
import { CreateBoardPanelComponent } from './components/create-board-panel/create-board-panel.component';
import { AuthService } from '@features/auth/services/auth.service';

import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CreateBoardPanelComponent,
    MatMenuModule,
    MatDividerModule
],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  boards$!: Observable<Board[]>;
  showCreatePanel = false;
  user: { name: string; email: string } | null = null;
  isHomeSection = true;

  constructor(
    private boardService: BoardService,
    private dialog: MatDialog,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.auth.isTokenValid()) {
      this.auth.logout();
      this.router.navigate(['/login'], { queryParams: { redirectTo: '/' } });
      return;
    }
    this.boards$ = this.boardService.boards$;
    this.loadUserFromToken();
    this.isHomeSection = this.router.url === '/';
    this.router.events.subscribe((ev: any) => {
      if (ev?.constructor?.name === 'NavigationEnd') {
        this.isHomeSection = this.router.url === '/';
      }
    });
  }

  loadUserFromToken(): void {
    const token = this.auth.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      this.user = {
        name: payload.name,
        email: payload.email,
      };
    } catch (e) {
      console.error('Failed to parse token', e);
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  closeCreatePanel(): void {
    this.showCreatePanel = false;
  }



  loadBoards(): void {}


  openCreateBoardDialog(): void {
    this.showCreatePanel = true;
  }

  deleteBoard(event: Event, boardId: string): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this board?')) {
      this.boardService.deleteProject(boardId).subscribe({
        next: () => {
          this.boardService.deleteBoard(boardId);
        },
        error: (err) => {
          console.error(`Failed to delete board ${boardId}`, err);
        }
      });
    }
  }

  openBoard(boardId: string): void {
    console.log(['/board', boardId])
    this.router.navigate(['/board', boardId]);
  }

  private getUserId(): string | null {
    const token = this.auth.getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      const payload = JSON.parse(atob(parts[1]));
      return payload?.id || payload?.userId || payload?.sub || null;
    } catch {
      return null;
    }
  }

  deleteAccount(): void {
    const idStr = this.getUserId();
    const idNum = idStr ? Number(idStr) : NaN;
    if (!idStr || Number.isNaN(idNum)) { 
      console.error('API:deleteUser:error', { reason: 'invalid_user_id', userId: idStr });
      return;
    }
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ?')) return;
    this.auth.deleteUser(idNum).subscribe({
      next: () => {
        this.auth.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('API:deleteUser:error', err);
      }
    });
  }

}

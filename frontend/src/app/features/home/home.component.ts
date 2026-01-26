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
    CreateBoardPanelComponent
],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  boards$!: Observable<Board[]>;
  showCreatePanel = false;

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
      this.boardService.deleteBoard(boardId);
    }
  }

  openBoard(boardId: string): void {
    console.log(['/board', boardId])
    this.router.navigate(['/board', boardId]);
  }
}

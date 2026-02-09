import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';
import { Board } from '@features/board/models/board';
import { BoardService } from '@features/board/services/board.service';
import { Router } from '@angular/router';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-boards-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './boards-list.component.html',
  styleUrl: './boards-list.component.css'
})
export class BoardsListComponent {
  boards$!: Observable<Board[]>;

  constructor(private boardService: BoardService, private router: Router) {}

  ngOnInit(): void {
    this.boards$ = this.boardService.boards$;
    this.boardService.loadProjectsFromServer().subscribe({
      next: () => {},
      error: (err) => {
        console.error('Failed to load boards', err);
      }
    });
  }

  openBoard(boardId: string): void {
    this.router.navigate(['/board', boardId]);
  }

  deleteBoard(event: Event, boardId: string): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this board?')) {
      this.boardService.deleteProject(boardId).subscribe({
        error: (err) => console.error('Failed to delete board', err)
      });
    }
  }
}

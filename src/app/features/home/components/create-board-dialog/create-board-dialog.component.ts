import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BoardService } from '@features/board/services/board.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-board-dialog',
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './create-board-dialog.component.html',
  styleUrl: './create-board-dialog.component.css'
})
export class CreateBoardDialogComponent {
  boardTitle: string = '';

  constructor(
    public dialogRef: MatDialogRef<CreateBoardDialogComponent>,
    private boardService: BoardService,
    private router: Router
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.boardTitle.trim()) {
      this.boardService.createBoardFromServer(this.boardTitle.trim()).subscribe({
        next: (board) => {
          this.dialogRef.close(board);
          this.router.navigate(['/board', board.id]);
        },
        error: (err) => {
          console.error('Error creating board:', err);
        }
      });
    }
  }
}

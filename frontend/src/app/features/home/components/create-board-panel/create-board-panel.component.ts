import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BoardService } from '@features/board/services/board.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-board-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './create-board-panel.component.html',
  styleUrls: ['./create-board-panel.component.css']
})
export class CreateBoardPanelComponent {
  @Output() closed = new EventEmitter<void>();

  title = '';
  visibility: 'Workspace' | 'Private' = 'Workspace';
  gradients: string[] = [];
  selectedGradient = '';

  constructor(private boardService: BoardService, private router: Router) {
    this.gradients = this.boardService.gradients;
    this.selectedGradient = this.gradients[0];
  }

  selectGradient(gradient: string): void {
    this.selectedGradient = gradient;
  }

  create(): void {
    if (!this.title.trim()) return;
    this.boardService.createBoardFromServer(this.title.trim(), this.selectedGradient).subscribe({
      next: (board) => {
        this.closed.emit();
        this.router.navigate(['/board', board.id]);
      },
      error: (err) => {
        console.error('Error creating board:', err);
      }
    });
  }

  cancel(): void {
    this.closed.emit();
  }
}

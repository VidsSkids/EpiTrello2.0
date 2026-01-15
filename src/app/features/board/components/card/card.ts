import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Card as CardModel } from '../../models/card';
import { BoardService } from '../../services/board-service';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './card.html',
  styleUrl: './card.css'
})
export class CardComponent {
  @Input() card!: CardModel;
  @Output() cardUpdated = new EventEmitter<void>();
  
  editMode = false;
  editedTitle = '';
  editedDescription = '';

  constructor(private boardService: BoardService) {}

  startEdit(): void {
    this.editMode = true;
    this.editedTitle = this.card.title;
    this.editedDescription = this.card.description || '';
  }

  saveCard(): void {
    if (this.editedTitle.trim()) {
      const updatedCard = {
        ...this.card,
        title: this.editedTitle,
        description: this.editedDescription || undefined
      };
      this.boardService.updateCard(updatedCard);
      this.card = updatedCard;
      this.editMode = false;
      this.cardUpdated.emit();
    }
  }

  cancelEdit(): void {
    this.editMode = false;
  }

  deleteCard(): void {
    if (confirm('Are you sure you want to delete this card?')) {
      this.boardService.deleteCard(this.card.id);
      this.cardUpdated.emit();
    }
  }
}

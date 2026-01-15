import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { List as ListModel } from '../../models/list';
import { Card as CardModel } from '../../models/card';
import { BoardService } from '../../services/board-service';
import { CardComponent } from '../card/card';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    CardComponent
  ],
  templateUrl: './list.html',
  styleUrl: './list.css'
})
export class ListComponent {
  @Input() list!: ListModel;
  @Output() listUpdated = new EventEmitter<void>();
  
  cards: CardModel[] = [];
  newCardTitle = '';
  showNewCardForm = false;
  editingTitle = false;
  editedTitle = '';

  constructor(private boardService: BoardService) {}

  ngOnInit(): void {
    this.loadCards();
  }

  ngOnChanges(): void {
    this.loadCards();
  }

  loadCards(): void {
    this.cards = this.boardService.getCards(this.list.id);
  }

  createCard(): void {
    if (this.newCardTitle.trim()) {
      this.boardService.createCard(this.list.id, this.newCardTitle);
      this.newCardTitle = '';
      this.showNewCardForm = false;
      this.loadCards();
      this.listUpdated.emit();
    }
  }

  deleteList(): void {
    if (confirm('Are you sure you want to delete this list?')) {
      this.boardService.deleteList(this.list.id);
      this.listUpdated.emit();
    }
  }

  startEditingTitle(): void {
    this.editingTitle = true;
    this.editedTitle = this.list.title;
  }

  saveTitle(): void {
    if (this.editedTitle.trim() && this.editedTitle !== this.list.title) {
      const updatedList = { ...this.list, title: this.editedTitle };
      this.boardService.updateList(updatedList);
      this.list = updatedList;
    }
    this.editingTitle = false;
  }

  onCardDrop(event: CdkDragDrop<CardModel[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      event.container.data.forEach((card, index) => {
        this.boardService.updateCard({
          ...card,
          position: index
        });
      });
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      const targetListId = this.list.id;
      
      event.container.data.forEach((card, index) => {
        this.boardService.updateCard({
          ...card,
          listId: targetListId,
          position: index
        });
      });
      
      event.previousContainer.data.forEach((card, index) => {
        this.boardService.updateCard({
          ...card,
          position: index
        });
      });
    }
    
    this.listUpdated.emit();
  }

  onCardUpdated(): void {
    this.loadCards();
    this.listUpdated.emit();
  }
}

import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
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
import { BoardService } from '../../services/board.service';
import { CardComponent } from '../card/card.component';

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
  templateUrl: './list.component.html',
  styleUrl: './list.component.css'
})
export class ListComponent {
  @Input() list!: ListModel;
  @Input() allLists!: ListModel[];
  @Input() allTags: { _id: string; name: string; color: string }[] = [];
  @Output() listUpdated = new EventEmitter<void>();
  
  dropListIds: string[] = [];
  cards: CardModel[] = [];
  newCardTitle = '';
  showNewCardForm = false;
  editingTitle = false;
  editedTitle = '';
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;

  constructor(private boardService: BoardService) {}

  ngOnInit(): void {
    this.editedTitle = this.list.title;
    this.loadCards();
  }

  ngOnChanges(): void {
    this.loadCards();
    if (this.allLists) {
      this.dropListIds = this.allLists.map(l => l.id);
    }
  }

  loadCards(): void {
    const raw = Array.isArray((this.list as any)?.cards) ? (this.list as any).cards : null;
    if (raw) {
      this.cards = raw.map((cd: any, idx: number) => {
        const id = cd?._id;
        const title = cd?.title || '';
        const description = cd?.description;
        const position = idx;
        const tagIds = Array.isArray(cd?.tagIds) ? cd.tagIds : undefined;
        const assignedTo = Array.isArray(cd?.assignedTo) ? cd.assignedTo : undefined;
        const checklists = Array.isArray(cd?.checklists) ? cd.checklists : undefined;
        const createdAt = cd?.createdAt ? new Date(cd.createdAt) : new Date();
        const isDone = typeof cd?.isDone === 'boolean' ? cd.isDone : false;
        return {
          id,
          title,
          description,
          listId: this.list.id,
          position,
          tagIds,
          assignedTo,
          createdAt,
          isDone,
          checklists,
        } as CardModel;
      });
    } else {
      this.cards = this.boardService.getCards(this.list.id);
    }
  }

  createCard(): void {
    if (this.newCardTitle.trim()) {
      this.boardService.createCardAPI(this.list.boardId, this.list.id, this.newCardTitle).subscribe({
        next: () => {
          this.newCardTitle = '';
          this.showNewCardForm = false;
          this.listUpdated.emit();
          console.log('API:createCard:success', { projectId: this.list.boardId, columnId: this.list.id });
        },
        error: (err) => {
          console.error('API:createCard:error', { projectId: this.list.boardId, columnId: this.list.id, err });
          this.listUpdated.emit();
        }
      });
    }
  }

  deleteList(): void {
    if (confirm('Are you sure you want to delete this list?')) {
      this.boardService.deleteColumn(this.list.boardId, this.list.id).subscribe({
        next: () => { console.log('API:deleteColumn:success', { projectId: this.list.boardId, columnId: this.list.id }); this.listUpdated.emit(); },
        error: (err) => { console.error('API:deleteColumn:error', { projectId: this.list.boardId, columnId: this.list.id, err }); this.listUpdated.emit(); }
      });
    }
  }

  toggleTitleEdit(editing: boolean): void {
    this.editingTitle = editing;
    if (editing) {
      setTimeout(() => this.titleInput.nativeElement.focus());
    }
  }

  startEditingTitle(): void {
    this.editingTitle = true;
    this.editedTitle = this.list.title;
  }

  saveTitle(): void {
    if (this.editedTitle.trim() && this.editedTitle !== this.list.title) {
      const name = this.editedTitle;
      this.boardService.updateColumn(this.list.boardId, this.list.id, name).subscribe({
        next: () => {
          this.list = { ...this.list, title: name };
          this.listUpdated.emit();
          console.log('API:updateColumn:success', { projectId: this.list.boardId, columnId: this.list.id, name });
        },
        error: (err) => { console.error('API:updateColumn:error', { projectId: this.list.boardId, columnId: this.list.id, name, err }); this.listUpdated.emit(); }
      });
    }
    this.editingTitle = false;
  }

  onCardDrop(event: CdkDragDrop<CardModel[]>): void {
    const movedCard: any = event.item.data;
    if (event.previousContainer === event.container) {
      // Swap items visually
      const temp = event.container.data[event.previousIndex];
      event.container.data[event.previousIndex] = event.container.data[event.currentIndex];
      event.container.data[event.currentIndex] = temp;

      if (movedCard?.id) {
        this.boardService.reorderCardAPI(this.list.boardId, this.list.id, movedCard.id, event.currentIndex).subscribe({
          next: () => { console.log('API:reorderCard:success', { projectId: this.list.boardId, columnId: this.list.id, cardId: movedCard.id, newIndex: event.currentIndex }); this.listUpdated.emit(); },
          error: (err) => { console.error('API:reorderCard:error', { projectId: this.list.boardId, columnId: this.list.id, cardId: movedCard.id, newIndex: event.currentIndex, err }); this.listUpdated.emit(); }
        });
      }
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      if (movedCard?.id) {
        const sourceColumnId = movedCard.listId || this.list.id;
        const targetColumnId = this.list.id;
        this.boardService.reorderCardAPI(this.list.boardId, sourceColumnId, movedCard.id, event.currentIndex, targetColumnId).subscribe({
          next: () => { console.log('API:reorderCard:success', { projectId: this.list.boardId, columnId: sourceColumnId, cardId: movedCard.id, newIndex: event.currentIndex, newColumnId: targetColumnId }); this.listUpdated.emit(); },
          error: (err) => { console.error('API:reorderCard:error', { projectId: this.list.boardId, columnId: sourceColumnId, cardId: movedCard.id, newIndex: event.currentIndex, newColumnId: targetColumnId, err }); this.listUpdated.emit(); }
        });
      } else {
        this.listUpdated.emit();
      }
    }
  }

  onCardUpdated(): void {
    this.loadCards();
    this.listUpdated.emit();
  }
}

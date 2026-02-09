import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild, ChangeDetectorRef, ElementRef, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Card as CardModel } from '../../models/card';
import { Checklist as ChecklistModel } from '../../models/card';
import { ChecklistItem as ChecklistItemModel } from '../../models/card';
import { BoardService } from '../../services/board.service';

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
    MatFormFieldModule,
    MatDialogModule,
    MatMenuModule,
    MatCheckboxModule,
    MatProgressBarModule
  ],
  templateUrl: './card.component.html',
  styleUrl: './card.component.css'
})

export class CardComponent {
  @Input() card!: CardModel;
  @Input() projectId!: string;
  @Input() columnId!: string;
  @Input() allTags: { _id: string; name: string; color: string }[] = [];
  @Output() cardUpdated = new EventEmitter<void>();
  
  editedTitle = '';
  editedDescription = '';
  editingTitle = false;
  @ViewChild('editDialog') editDialogTpl!: TemplateRef<any>;
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;
  tags: { id: string; name: string; color?: string }[] = [];
  labelsDensity: 'normal' | 'compact' | 'ultra' = 'normal';
  checklists: Array<ChecklistModel> = [];
  newChecklistTitle: string = '';
  showCreateTagForm = false;
  showNewChecklistForm = false;
  newTagName = '';
  newTagColor = '#FFFFFF';
  selectedTag: { _id: string; name: string; color?: string } | null = null;
  editedTagName: string = '';
  editingChecklistId: string | null = null;
  editedChecklistTitle = '';

  editingItemId: string | null = null;
  editedItemContent = '';
  checklistsCompletionSummary: string | null = null;

  private updateChecklistsCompletionSummary(): void {
    const summary = this.getChecklistsCompletionSummary();
    this.checklistsCompletionSummary = summary ? summary : null;
  }

  startEditChecklist(checklist: ChecklistModel) {
    this.editingChecklistId = checklist.id;
    this.editedChecklistTitle = checklist.title;
  }

  saveChecklistTitle(checklist: ChecklistModel) {
    if (!this.editingChecklistId || !this.editedChecklistTitle.trim()) {
      this.editingChecklistId = null;
      return;
    }

    const newTitle = this.editedChecklistTitle.trim();
    if (newTitle === checklist.title) {
      this.editingChecklistId = null;
      return;
    }
    
    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;
    if (!projectId || !columnId || !cardId || !checklist.id) {
      this.editingChecklistId = null;
      return;
    }

    this.boardService.updateChecklist(projectId, columnId, cardId, checklist.id, { title: newTitle }).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          checklist.title = newTitle;
          
          if ((this.card as any).checklists) {
            const cardChecklist = (this.card as any).checklists.find((c: any) => c.id === this.editingChecklistId);
            if (cardChecklist) {
              cardChecklist.title = newTitle;
            }
          }
          this.editingChecklistId = null;
          this.updateChecklistsCompletionSummary();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to update checklist title', err);
        this.editingChecklistId = null;
      }
    });
  }

  cancelEditChecklist() {
    this.editingChecklistId = null;
    this.editedChecklistTitle = '';
  }

  startEditItem(item: ChecklistItemModel) {
    this.editingItemId = item.id;
    this.editedItemContent = item.content;
  }

  saveItemContent(checklist: ChecklistModel, item: ChecklistItemModel) {
    if (!this.editingItemId || !this.editedItemContent.trim()) {
      this.editingItemId = null;
      return;
    }

    const newContent = this.editedItemContent.trim();
    if (newContent === item.content) {
      this.editingItemId = null;
      return;
    }

    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;

    this.boardService.updateChecklistItem(projectId, columnId, cardId, checklist.id, item.id, { content: newContent }).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          item.content = newContent;
          this.editingItemId = null;
          this.updateChecklistsCompletionSummary();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to update checklist item', err);
        this.editingItemId = null;
      }
    });
  }


  startEditTag(tag: { _id: string, name: string, color?: string }) {
    this.editedTagName = tag.name;
    this.selectedTag = tag;
  }

  saveTag() {
    const newName = this.editedTagName.trim();
    if (!newName) { return; }
    this.boardService.updateTag(this.projectId, this.selectedTag!._id, { name: newName, color: this.selectedTag!.color }).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          const tagInAllTags = this.allTags.find(t => t._id === this.selectedTag!._id); 
          if (tagInAllTags) {
            tagInAllTags.name = newName;
            tagInAllTags.color = this.selectedTag!.color || tagInAllTags.color;
          }
          const tagInCard = this.tags.find(t => t.id === this.selectedTag!._id);
          if (tagInCard) {
            tagInCard.name = newName;
            tagInCard.color = this.selectedTag!.color || tagInCard.color;
          }
          this.selectedTag = null;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to update tag', err);
        this.selectedTag = null;
      }
    });
  }

  constructor(private boardService: BoardService, private dialog: MatDialog, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initTags();
    this.loadChecklistsFromCard();
    this.updateChecklistsCompletionSummary();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['card']) {
      this.initTags();
      this.loadChecklistsFromCard();
      this.updateChecklistsCompletionSummary();
    }
  }

  startEdit(): void {
    this.editedTitle = this.card.title;
    this.editedDescription = this.card.description || '';
    this.editingTitle = false;
    this.initTags();
    this.loadChecklistsFromCard();
    this.updateChecklistsCompletionSummary();
    this.openEditDialog();
  }

  openEditDialog(): void {
    const ref = this.dialog.open(this.editDialogTpl, {
      width: '60%',
      maxWidth: 'none',
      height: '80%',
      panelClass: 'custom-dialog'
    });
    ref.afterClosed().subscribe((result) => {
      if (result === 'delete') {
        this.deleteCard();
      }
    });
  }



  cancelEdit(): void {
    this.editingTitle = false;
  }

  saveTitleInline(): void {
    const newTitle = (this.editedTitle || '').trim();
    if (!newTitle || newTitle === this.card.title) { this.editingTitle = false; return; }
    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    if (!projectId || !columnId) { this.editingTitle = false; return; }
    this.boardService.updateCardFieldsAPI(projectId, columnId, this.card.id, { title: newTitle }).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.card = { ...this.card, title: newTitle };
          this.editingTitle = false;
          this.cardUpdated.emit();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('API:updateCardFieldsAPI:error', err);
        this.editingTitle = false;
        this.cardUpdated.emit();
      }
    });
  }

  saveDescriptionInline(): void {
    const newDesc = (this.editedDescription ?? '').toString();
    const curr = this.card.description ?? '';
    if (newDesc === curr) { return; }
    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    if (!projectId || !columnId) { return; }
    this.boardService.updateCardFieldsAPI(projectId, columnId, this.card.id, { description: newDesc || undefined }).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.card = { ...this.card, description: newDesc || undefined };
          this.cardUpdated.emit();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('API:updateCardFieldsAPI:error', err);
        this.cardUpdated.emit();
      }
    });
  }

  deleteCard(): void {
    if (confirm('Are you sure you want to delete this card?')) {
      const projectId = this.projectId || '';
      const columnId = this.columnId || this.card.listId;
      if (projectId && columnId) {
        this.boardService.deleteCardAPI(projectId, columnId, this.card.id).subscribe({
          next: () => { console.log('API:deleteCard:success', { projectId, columnId, cardId: this.card.id }); this.cardUpdated.emit(); },
          error: (err) => { console.error('API:deleteCard:error', { projectId, columnId, cardId: this.card.id, err }); this.cardUpdated.emit(); }
        });
      }
    }
  }

  initTags(): void {
    this.tags = [];
    this.allTags.forEach(tag => {
      if (this.card.tagIds?.find(tid => tid === tag._id)) {
        this.tags.push({
          id: tag._id,
          name: tag.name,
          color: tag.color,
        });
      }
    });
    this.recalcLabelsDensity();
  }


  toggleTagAttachment(tag: { id: string; name: string; color?: string; attached: boolean; initiallyAttached: boolean }, checked: boolean): void {
    const projectId = this.projectId || '';
    const cardId = this.card.id;
    if (!projectId || !cardId || !tag.id) return;
    if (checked) {
      if (tag.initiallyAttached) {
        Promise.resolve().then(() => { tag.attached = true; this.cdr.detectChanges(); });
        return;
      }
      this.boardService.attachTagToCard(projectId, tag.id, cardId).subscribe({
        next: () => {
          Promise.resolve().then(() => {
            tag.attached = true;
            tag.initiallyAttached = true;
            const hasTid = Array.isArray((this.card as any).tagIds) && (this.card as any).tagIds.includes(tag.id);
            if (!hasTid) {
              (this.card as any).tagIds = [ ...(Array.isArray((this.card as any).tagIds) ? (this.card as any).tagIds : []), tag.id ];
            }
            this.recalcLabelsDensity();
            this.cdr.detectChanges();
          });
        },
        error: (err) => console.error('API:attachTagToCard:error', err)
      });
    } else {
      if (!tag.initiallyAttached) {
        Promise.resolve().then(() => { tag.attached = false; this.cdr.detectChanges(); });
        return;
      }
      this.boardService.detachTagFromCard(projectId, tag.id, cardId).subscribe({
        next: () => {
          Promise.resolve().then(() => {
            tag.attached = false;
            tag.initiallyAttached = false;
            if (Array.isArray((this.card as any).tagIds)) {
              (this.card as any).tagIds = (this.card as any).tagIds.filter((tid: any) => tid !== tag.id);
            }
            this.recalcLabelsDensity();
            this.cdr.detectChanges();
          });
        },
        error: (err) => console.error('API:detachTagFromCard:error', err)
      });
    }
  }

  createTag(): void {
    const name = (this.newTagName || '').trim();
    const color = (this.newTagColor || '#FFFFFF').trim();
    const projectId = this.projectId || '';
    const cardId = this.card.id;
    if (!name || !projectId || !cardId) return;
    this.boardService.createTag(projectId, name, color).subscribe({
      next: (res: any) => {
        const t = res?.newTag || {};
        const id = t?._id;
        const rname = t?.name || name;
        const rcolor = t?.color || color;
        const item = { id, name: rname, color: rcolor };
        Promise.resolve().then(() => {
          this.tags = [ ...this.tags, item ];
          this.recalcLabelsDensity();
          this.showCreateTagForm = false;
          this.newTagName = '';
          this.newTagColor = '#FFFFFF';
          this.cdr.detectChanges();
          this.allTags = [ ...this.allTags, { _id: id, name: rname, color: rcolor } ];
        });
        this.boardService.attachTagToCard(projectId, id, cardId).subscribe({
          next: () => {
            Promise.resolve().then(() => {
              (this.card as any).tagIds = [ ...(Array.isArray((this.card as any).tagIds) ? (this.card as any).tagIds : []), id ];
              this.cdr.detectChanges();
            });
          },
          error: (err) => console.error('API:attachTagToCard:error', err)
        });
      },
      error: (err) => console.error('API:createTag:error', err)
    });
  }

  editTag(tag: { id: string; name: string; color?: string; }): void {
    const name = prompt('Nom du tag', tag.name) || tag.name;
    const color = prompt('Couleur (hex ou nom CSS)', tag.color || '') || tag.color;
    const projectId = this.projectId || '';
    if (!projectId || !tag.id) return;
    this.boardService.updateTag(projectId, tag.id, { name, color }).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          tag.name = name;
          tag.color = color || tag.color;
          this.recalcLabelsDensity();
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('API:updateTag:error', err)
    });
  }

  deleteTag(tag: { id: string; name: string; color?: string;}): void {
    const projectId = this.projectId || '';
    if (!projectId || !tag.id) return;
    this.boardService.deleteTag(projectId, tag.id).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.tags = this.tags.filter(t => t.id !== tag.id);
          if (Array.isArray((this.card as any).tagIds)) {
            (this.card as any).tagIds = (this.card as any).tagIds.filter((tid: any) => tid !== tag.id);
          }
          this.allTags = this.allTags.filter(t => t._id !== tag.id);
          this.recalcLabelsDensity();
          this.cdr.detectChanges();
          this.selectedTag = null;
          this.editedTagName = '';
        });
      },
      error: (err) => console.error('API:deleteTag:error', err)
    });
  }

  atachTag(tag: { id: string; name: string; color?: string; }) {
    const projectId = this.projectId || '';
    const cardId = this.card.id;
    if (!projectId || !cardId || !tag.id) return;
    this.boardService.attachTagToCard(projectId, tag.id, cardId).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.tags = [ ...this.tags, tag ];
          this.recalcLabelsDensity();
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('API:attachTagToCard:error', err)
    });
  }

  detachTag(tagToDetach: { id: string }): void {
    const projectId = this.projectId || '';
    const cardId = this.card.id;
    if (!projectId || !cardId || !tagToDetach.id) return;

    this.boardService.detachTagFromCard(projectId, tagToDetach.id, cardId).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.tags = this.tags.filter(t => t.id !== tagToDetach.id);
          if (Array.isArray(this.card.tagIds)) {
            this.card.tagIds = this.card.tagIds.filter(tid => tid !== tagToDetach.id);
          }
          this.recalcLabelsDensity();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to detach tag', err);
      }
    });
  }

  private recalcLabelsDensity(): void {
    const count = this.tags.length;
    if (count <= 8) {
      this.labelsDensity = 'normal';
    } else if (count <= 16) {
      this.labelsDensity = 'compact';
    } else {
      this.labelsDensity = 'ultra';
    }
  }

  getContrastingTextColor(color?: string): string {
    const hex = (color || '').trim();
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
    if (!m) return '#000';
    const val = m[1];
    const r = parseInt(val.substring(0, 2), 16);
    const g = parseInt(val.substring(2, 4), 16);
    const b = parseInt(val.substring(4, 6), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 128 ? '#000' : '#fff';
  }

  loadChecklistsFromCard(): void {
    console.log('loadChecklistsFromCard', (this.card as any)?.checklists);
    const raw = Array.isArray((this.card as any)?.checklists) ? (this.card as any).checklists : [];
    this.checklists = raw.map((cl: any, idx: number) => {
      const id = cl?._id || cl?.id;
      const title = cl?.title;
      const itemsArr = Array.isArray(cl?.items) ? cl.items : [];
      const items = itemsArr.map((it: any, j: number) => {
        const iid = it?._id || it?.id;
        const t = it?.content || '';
        const isChecked = typeof it?.isChecked === 'boolean' ? it.isChecked : false;
        const dueDate = it?.dueDate || 0;
        const assignedTo = it?.assignedTo || [];
        return { id: iid, content: t, isChecked, dueDate, assignedTo } as ChecklistItemModel;
      });
      return { id, title, items, showAddItem: false, newChecklistItemContent: '' };
    });
    this.updateChecklistsCompletionSummary();
  }

  addChecklist(): void {
    const title = (this.newChecklistTitle || '').trim();
    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;
    if (!title || !projectId || !columnId || !cardId) return;
    this.boardService.createChecklist(projectId, columnId, cardId, title).subscribe({
      next: (res: any) => {
        const c = res?.checklist || res || {};
        const id = c?.uuid || c?.id || c?._id;
        Promise.resolve().then(() => {
          this.checklists = [ ...this.checklists, { id, title, items: [] } ];
          (this.card as any).checklists = this.checklists.map(cl => ({ id: cl.id, title: cl.title, items: cl.items }));
          this.newChecklistTitle = '';
          this.updateChecklistsCompletionSummary();
          this.cdr.detectChanges();
          this.showNewChecklistForm = false;
        });
      },
      error: (err) => console.error('API:createChecklist:error', err)
    });
  }

  updateChecklistTitle(cl: { id: string; title: string; items: any[] }): void {
    const title = (cl.title || '').trim();
    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;
    if (!projectId || !columnId || !cardId || !cl.id) return;
    this.boardService.updateChecklist(projectId, columnId, cardId, cl.id, { title }).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
          this.updateChecklistsCompletionSummary();
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('API:updateChecklist:error', err)
    });
  }

  deleteChecklist(cl: { id: string }): void {
    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;
    if (!projectId || !columnId || !cardId || !cl.id) return;
    this.boardService.deleteChecklist(projectId, columnId, cardId, cl.id).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.checklists = this.checklists.filter(x => x.id !== cl.id);
          (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
          this.updateChecklistsCompletionSummary();
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('API:deleteChecklist:error', err)
    });
  }

  addChecklistItem(cl: ChecklistModel): void {
    const content = (cl.newChecklistItemContent || '').trim();
    if (!content) return;

    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;
    if (!projectId || !columnId || !cardId || !cl.id) return;

    const tempId = `temp-${Date.now()}`;
    const tempItem = { id: tempId, content, isDone: false };
    cl.items.push(tempItem as any);
    cl.newChecklistItemContent = '';
    (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
    this.updateChecklistsCompletionSummary();
    this.cdr.detectChanges();

    this.boardService.createChecklistItem(projectId, columnId, cardId, cl.id, content).subscribe({
      next: (res: any) => {
        const newItem = res?.item;
        if (newItem) {
          Promise.resolve().then(() => {
            const itemIndex = cl.items.findIndex(item => item.id === tempId);
            if (itemIndex > -1) {
              cl.items[itemIndex] = { ...newItem, id: newItem._id };
            }
            (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
            this.updateChecklistsCompletionSummary();
            this.cdr.detectChanges();
          });
        }
      },
      error: (err) => {
        console.error('Failed to add checklist item', err);
        cl.items = cl.items.filter(item => item.id !== tempId);
        this.updateChecklistsCompletionSummary();
        this.cdr.detectChanges();
      }
    });
  }

  updateChecklistItem(cl: { id: string }, it: ChecklistItemModel): void {
    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;
    if (!projectId || !columnId || !cardId || !cl.id || !it.id) return;
    this.boardService.updateChecklistItem(projectId, columnId, cardId, cl.id, it.id, {content: it.content, isChecked: it.isChecked, dueDate: 0, assignedTo: it.assignedTo}).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
          this.updateChecklistsCompletionSummary();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('API:updateChecklistItem:error', err);
        it.isChecked = !it.isChecked;
        this.updateChecklistsCompletionSummary();
        this.cdr.detectChanges();
      }
    });
  }

  toggleChecklistItem(cl: { id: string }, it: ChecklistItemModel, checked: boolean): void {
    const originalState = it.isChecked;
    it.isChecked = checked;
          console.log('toggleChecklistItem', this.checklists);

    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;
    if (!projectId || !columnId || !cardId || !cl.id || !it.id) return;

    this.boardService.updateChecklistItem(projectId, columnId, cardId, cl.id, it.id, { isChecked: checked }).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
          this.updateChecklistsCompletionSummary();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to update checklist item checked state', err);
        Promise.resolve().then(() => {
          it.isChecked = originalState;
          this.updateChecklistsCompletionSummary();
          this.cdr.detectChanges();
        });
      }
    });
  }

  deleteChecklistItem(cl: { id: string; items: Array<ChecklistItemModel> }, it: { id: string }): void {
    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;
    if (!projectId || !columnId || !cardId || !cl.id || !it.id) return;
    this.boardService.deleteChecklistItem(projectId, columnId, cardId, cl.id, it.id).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          cl.items = cl.items.filter(x => x.id !== it.id);
          (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
          this.updateChecklistsCompletionSummary();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('Failed to delete checklist item', err);
      }
    });
  }

  getChecklistCompletion(cl: { items: Array<ChecklistItemModel> }): number {
    const total = cl.items.length;
    if (total === 0) return 0;
    const done = cl.items.filter(i => i.isChecked).length;
    return Math.round((done / total) * 100);
  }

  getChecklistsCompletionSummary(): string {
    const checklists = (this.card as any)?.checklists || [];
    if (!checklists || checklists.length === 0) {
      return '';
    }
    let totalItems = 0;
    let completedItems = 0;
    for (const checklist of checklists) {
      const items = checklist?.items || [];
      totalItems += items.length;
      completedItems += items.filter((item: any) => item.isChecked).length;
    }
    if (totalItems === 0) {
      return '';
    }
    if (totalItems === completedItems) {
      return '100%';
    }
    return `${completedItems}/${totalItems}`;
  }

  toggleTitleEdit(editing: boolean): void {
    this.editingTitle = editing;
    if (editing) {
      setTimeout(() => this.titleInput.nativeElement.focus());
    }
  }
}

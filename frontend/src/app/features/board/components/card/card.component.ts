import { Component, EventEmitter, Input, Output, TemplateRef, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
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
  @Input() allTags: { id: string; name: string; color: string }[] = [];
  @Output() cardUpdated = new EventEmitter<void>();
  
  cardLabels: { id: string; name: string; color: string }[] = [];
  editedTitle = '';
  editedDescription = '';
  editingTitle = false;
  @ViewChild('editDialog') editDialogTpl!: TemplateRef<any>;
  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;
  tags: { id: string; name: string; color?: string; attached: boolean; initiallyAttached: boolean }[] = [];
  labelsDensity: 'normal' | 'compact' | 'ultra' = 'normal';
  checklists: Array<ChecklistModel> = [];
  newChecklistTitle: string = '';
  showCreateTagForm = false;
  newTagName = '';
  newTagColor = '#FFFFFF';

  constructor(private boardService: BoardService, private dialog: MatDialog, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.updateCardLabels();
  }

  ngOnChanges(): void {
    this.updateCardLabels();
  }

  updateCardLabels(): void {
    if (this.card && this.card.tagIds && this.allTags) {
      this.cardLabels = this.allTags.filter(tag => this.card.tagIds?.includes(tag.id));
    } else {
      this.cardLabels = [];
    }
  }

  startEdit(): void {
    this.editedTitle = this.card.title;
    this.editedDescription = this.card.description || '';
    this.editingTitle = false;
    this.initTags();
    this.loadProjectTags();
    this.loadChecklistsFromCard();
    this.openEditDialog();
  }

  openEditDialog(): void {
    const ref = this.dialog.open(this.editDialogTpl, {
      width: '60%',
      maxWidth: 'none'
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
      error: () => {
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
      error: () => {
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
    const raw = Array.isArray((this.card as any)?.labels) ? (this.card as any).labels : [];
    console.log('raw', raw);
    this.tags = raw.map((lab: any) => {
      const id = lab?.uuid || lab?.id || lab?._id || lab;
      const name = lab?.name || lab?.title || String(lab);
      const color = lab?.color;
      return { id, name, color, attached: true, initiallyAttached: true };
    });
    this.recalcLabelsDensity();
  }
  
  loadProjectTags(): void {
    const projectId = this.projectId || '';
    if (!projectId) return;
    this.boardService.getProject(projectId).subscribe({
      next: (res: any) => {
        const project = res?.project || res || {};
        const arr = Array.isArray(project?.tags) ? project.tags : [];
        const tagIds = Array.isArray((this.card as any)?.tagIds) ? (this.card as any).tagIds : [];
        const attachedIds = new Set(tagIds || []);
        const mapped = arr.map((t: any) => {
          const id = t?._id;
          const name = t?.name;
          const color = t?.color;
          const initiallyAttached = attachedIds.has(id);
          const attached = initiallyAttached;
          return { id, name, color, attached, initiallyAttached };
        });
        Promise.resolve().then(() => {
          this.tags = mapped;
          this.recalcLabelsDensity();
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
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
            const exists = Array.isArray((this.card as any).labels) && (this.card as any).labels.some((l: any) => (l?.id || l?.uuid) === tag.id);
            if (!exists) {
              const obj: any = { id: tag.id, name: tag.name, color: tag.color };
              (this.card as any).labels = [ ...(this.card as any).labels || [], obj ];
            }
            const hasTid = Array.isArray((this.card as any).tagIds) && (this.card as any).tagIds.includes(tag.id);
            if (!hasTid) {
              (this.card as any).tagIds = [ ...(Array.isArray((this.card as any).tagIds) ? (this.card as any).tagIds : []), tag.id ];
            }
            this.recalcLabelsDensity();
            this.cdr.detectChanges();
          });
        },
        error: () => {}
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
            (this.card as any).labels = ((this.card as any).labels || []).filter((l: any) => (l?.id || l?.uuid) !== tag.id);
            if (Array.isArray((this.card as any).tagIds)) {
              (this.card as any).tagIds = (this.card as any).tagIds.filter((tid: any) => tid !== tag.id);
            }
            this.recalcLabelsDensity();
            this.cdr.detectChanges();
          });
        },
        error: () => {}
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
        const t = res?.tag || res || {};
        const id = t?.id || t?.uuid;
        const rname = t?.name || t?.title || name;
        const rcolor = t?.color || color;
        const item = { id, name: rname, color: rcolor, attached: true, initiallyAttached: true };
        Promise.resolve().then(() => {
          this.tags = [ ...this.tags, item ];
          this.recalcLabelsDensity();
          this.showCreateTagForm = false;
          this.newTagName = '';
          this.newTagColor = '#FFFFFF';
          this.cdr.detectChanges();
        });
        this.boardService.attachTagToCard(projectId, id, cardId).subscribe({
          next: () => {
            Promise.resolve().then(() => {
              (this.card as any).labels = [ ...(this.card as any).labels || [], { id, name: rname, color: rcolor } ];
              (this.card as any).tagIds = [ ...(Array.isArray((this.card as any).tagIds) ? (this.card as any).tagIds : []), id ];
              this.cdr.detectChanges();
            });
          },
          error: () => {}
        });
      },
      error: () => {}
    });
  }

  editTag(tag: { id: string; name: string; color?: string; attached: boolean }): void {
    const name = prompt('Nom du label', tag.name) || tag.name;
    const color = prompt('Couleur (hex ou nom CSS)', tag.color || '') || tag.color;
    const projectId = this.projectId || '';
    if (!projectId || !tag.id) return;
    this.boardService.updateTag(projectId, tag.id, { name, color }).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          tag.name = name;
          tag.color = color || tag.color;
          (this.card as any).labels = ((this.card as any).labels || []).map((l: any) => {
            const lid = l?.id || l?.uuid;
            if (lid === tag.id) return { ...l, name: tag.name, color: tag.color };
            return l;
          });
          this.recalcLabelsDensity();
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  deleteTag(tag: { id: string; name: string; color?: string; attached: boolean }): void {
    const projectId = this.projectId || '';
    if (!projectId || !tag.id) return;
    if (!confirm('Supprimer ce label ?')) return;
    this.boardService.deleteTag(projectId, tag.id).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          this.tags = this.tags.filter(t => t.id !== tag.id);
          (this.card as any).labels = ((this.card as any).labels || []).filter((l: any) => (l?.id || l?.uuid) !== tag.id);
          if (Array.isArray((this.card as any).tagIds)) {
            (this.card as any).tagIds = (this.card as any).tagIds.filter((tid: any) => tid !== tag.id);
          }
          this.recalcLabelsDensity();
          this.cdr.detectChanges();
        });
      },
      error: () => {}
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
      const id = cl?.uuid || cl?.id || cl?._id || String(idx);
      const title = cl?.title || cl?.name || '';
      const itemsArr = Array.isArray(cl?.items) ? cl.items : [];
      const items = itemsArr.map((it: any, j: number) => {
        const iid = it?._id || String(j);
        const t = it?.content || '';
        const isDone = typeof it?.isDone === 'boolean' ? it.isDone : false;
        const dueDate = it?.dueDate || '';
        const assignedTo = it?.assignedTo || '';
        return { id: iid, content: t, isDone, dueDate, assignedTo } as ChecklistItemModel;
      });
      return { id, title, items, showAddItem: false };
    });
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
          this.cdr.detectChanges();
        });
      },
      error: () => {}
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
          this.cdr.detectChanges();
        });
      },
      error: () => {}
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
          this.cdr.detectChanges();
        });
      },
      error: () => {}
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
    this.cdr.detectChanges();

    this.boardService.createChecklistItem(projectId, columnId, cardId, cl.id, content).subscribe({
      next: (res: any) => {
        const it = res?.item || res || {};
        const id = it?.uuid || it?.id || it?._id;
        Promise.resolve().then(() => {
          const index = cl.items.findIndex(i => i.id === tempId);
          if (index > -1) {
            cl.items[index] = { id, content, isDone: false };
            (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        Promise.resolve().then(() => {
          cl.items = cl.items.filter(i => i.id !== tempId);
          (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
          this.cdr.detectChanges();
        });
      }
    });
  }

  updateChecklistItem(cl: { id: string }, it: ChecklistItemModel): void {
    const projectId = this.projectId || '';
    const columnId = this.columnId || this.card.listId;
    const cardId = this.card.id;
    if (!projectId || !columnId || !cardId || !cl.id || !it.id) return;
    this.boardService.updateChecklistItem(projectId, columnId, cardId, cl.id, it.id, it).subscribe({
      next: () => {
        Promise.resolve().then(() => {
          (this.card as any).checklists = this.checklists.map(x => ({ id: x.id, title: x.title, items: x.items }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  toggleChecklistItem(cl: { id: string }, it: ChecklistItemModel, checked: boolean): void {
    it.isDone = checked;
    this.updateChecklistItem(cl, it);
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
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  getChecklistCompletion(cl: { items: Array<ChecklistItemModel> }): number {
    const total = cl.items.length;
    if (total === 0) return 0;
    const done = cl.items.filter(i => i.isDone).length;
    return Math.round((done / total) * 100);
  }

  toggleTitleEdit(editing: boolean): void {
    this.editingTitle = editing;
    if (editing) {
      setTimeout(() => this.titleInput.nativeElement.focus());
    }
  }
}

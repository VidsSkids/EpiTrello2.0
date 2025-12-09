import { Component, OnInit, TemplateRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon'
import { MatSelectModule } from '@angular/material/select'
import { MatInputModule } from '@angular/material/input'
import { MatMenuModule } from '@angular/material/menu'
import { MatFormFieldModule } from '@angular/material/form-field'
import { MatCardModule } from '@angular/material/card'
import { MatToolbarModule } from '@angular/material/toolbar'
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop'
import { MatDialogModule, MatDialog } from '@angular/material/dialog'
import { BoardService } from '../../services/board.service'
import { List } from '../../models/list'
import { ListComponent } from '../list/list.component'
import { Board as BoardModel } from '../../models/board'
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router'
import { Router } from '@angular/router'
import { Observable, of, combineLatest, Subject } from 'rxjs'
import { map, take } from 'rxjs/operators'
import { AuthService } from '@features/auth/services/auth.service'

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatMenuModule,
    MatFormFieldModule,
    MatCardModule,
    MatToolbarModule,
    DragDropModule,
    MatDialogModule,
    ListComponent,
],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css'
})
export class BoardComponent implements OnInit {
  boards$!: Observable<BoardModel[]>;
  currentBoardId$!: Observable<string | null>;
  currentBoard$!: Observable<BoardModel | undefined>;
  lists$!: Observable<List[]>;

  newBoardTitle = '';
  newListTitle = '';
  showNewBoardForm = false;
  showNewListForm = false;
  showMembers = false;
  members: any[] = [];
  isOwner = false;

  editingTitle = false;
  tempTitle = '';
  favorite = false;
  visibility: 'private' | 'public' = 'private';
  currentView: 'kanban' | 'calendar' | 'timeline' = 'kanban';
  invitations: any[] = [];
  inviteError: string | null = null;

  isLoading: boolean = true;
  ownerId: string | null = null;
  myRole: string | undefined;


  onListDrop(event: CdkDragDrop<any[]>): void {
    const lists = event.container.data as List[];
    moveItemInArray(lists, event.previousIndex, event.currentIndex);
    lists.forEach((list, index) => {
      this.boardService.updateList({ ...list, position: index });
    });
    const boardId = lists[0]?.boardId;
    if (boardId) {
      const board = this.boardService.getBoardById(boardId);
      if (board) {
        this.boardService.updateBoard({ ...board, lists: lists.map(l => l.id) });
      }
    }
  }

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.boards$ = this.boardService.getBoards();

    const id$ = this.route.paramMap.pipe(map(pm => pm.get('id')));
    const parentId$ = this.route.parent ? this.route.parent.paramMap.pipe(map(pm => pm.get('id'))) : of(null);
    this.currentBoardId$ = combineLatest([id$, parentId$]).pipe(map(([id, pid]) => id ?? pid));

    this.currentBoard$ = combineLatest([this.boards$, this.currentBoardId$]).pipe(
      map(([boards, id]) => boards.find(b => b.id === id))
    );

    this.lists$ = combineLatest([this.boardService.lists$, this.currentBoardId$]).pipe(
      map(([lists, id]) => (id ? lists.filter(l => l.boardId === id).sort((a, b) => a.position - b.position) : []))
    );

    this.currentBoard$.subscribe((board) => {
      if (!board) return;
      const uid = this.getUserId();
      if (board.ownerId && uid) {
        this.isOwner = board.ownerId === uid;
      } else {
        this.boardService.getProject(board.id).subscribe({
          next: (p) => {
            const project = p?.project || p;
            const ownerId = project?.ownerId;
            const vis = project?.visibility || board.visibility;
            const fav = project?.favorite ?? board.favorite;
            if (vis) this.visibility = vis;
            if (typeof fav === 'boolean') this.favorite = fav;
            if (ownerId) {
              this.ownerId = ownerId;
              this.isOwner = uid ? ownerId === uid : false;
            }
          },
          error: () => {}
        });
      }
    });
  }



  openBoard(boardId: string): void {
    this.router.navigate(['/board', boardId]);
  }



  createBoard(): void {
    if (this.newBoardTitle.trim()) {
      this.boardService.createBoardFromServer(this.newBoardTitle).subscribe({
        next: (board) => {
          this.newBoardTitle = '';
          this.showNewBoardForm = false;
          this.router.navigate(['/board', board.id]);
        },
        error: () => {}
      });
    }
  }

  createList(): void {
    if (this.newListTitle.trim()) {
      const id = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
      if (id) {
        this.boardService.createList(id, this.newListTitle);
        this.newListTitle = '';
        this.showNewListForm = false;
      }
    }
  }

  deleteBoard(event: Event, boardId: string): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this board?')) {
      this.boardService.deleteBoard(boardId);
      const currentId = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
      if (currentId === boardId) {
        this.router.navigate(['/']);
      }
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
  toggleMembers(): void {
    this.showMembers = !this.showMembers;
    if (!this.showMembers) return;
    this.currentBoardId$.subscribe(id => {
      if (!id) return;
      this.boardService.getProjectMembers(id).subscribe({
        next: (list) => {
          this.members = list || [];
          const uid = this.getUserId();
          const mine = (this.members || []).find(m => (m.userId || m.id) === uid);
          this.myRole = mine?.role;
        },
        error: () => this.members = []
      });
      if (!this.ownerId) {
        this.boardService.getProject(id).subscribe({
          next: (p) => {
            const project = p?.project || p;
            this.ownerId = project?.ownerId || null;
          },
          error: () => {}
        });
      }
    });
  }

  leaveOrDelete(): void {
    this.currentBoardId$.subscribe(id => {
      if (!id) return;
      if (this.isOwner) {
        this.boardService.deleteProject(id).subscribe({
          next: () => this.router.navigate(['/']),
          error: () => {}
        });
      } else {
        this.boardService.leaveProject(id).subscribe({
          next: () => this.router.navigate(['/']),
          error: () => {}
        });
      }
    });
  }

  startEditTitle(board: BoardModel): void {
    this.editingTitle = true;
    this.tempTitle = board.title;
  }

  saveTitle(board: BoardModel): void {
    const name = (this.tempTitle || '').trim();
    if (!name) { this.editingTitle = false; return; }
    const updated: BoardModel = { ...board, title: name };
    this.boardService.updateBoard(updated);
    this.currentBoardId$.subscribe(id => {
      if (!id) { this.editingTitle = false; return; }
      this.boardService.updateProject(id, { name }).subscribe({
        next: () => { this.editingTitle = false; },
        error: () => { this.editingTitle = false; }
      });
    });
  }

  toggleFavorite(board: BoardModel): void {
    const fav = !this.favorite;
    this.favorite = fav;
    const updated: BoardModel = { ...board, favorite: fav };
    this.boardService.updateBoard(updated);
    this.currentBoardId$.subscribe(id => {
      if (!id) return;
      this.boardService.updateProject(id, { favorite: fav }).subscribe({ next: () => {}, error: () => {} });
    });
  }

  toggleVisibility(board: BoardModel): void {
    const next = this.visibility === 'private' ? 'public' : 'private';
    this.visibility = next;
    const updated: BoardModel = { ...board, visibility: next };
    this.boardService.updateBoard(updated);
    this.currentBoardId$.subscribe(id => {
      if (!id) return;
      this.boardService.updateProject(id, { visibility: next }).subscribe({ next: () => {}, error: () => {} });
    });
  }

  openShareDialog(tpl: TemplateRef<any>): void {
    this.currentBoardId$.subscribe(id => {
      if (!id) return;
      this.inviteError = null;
      this.boardService.getProject(id).subscribe({
        next: (p) => {
          const project = p?.project || p;
          this.invitations = project?.invitations || [];
          this.boardService.getProjectMembers(id).subscribe({
            next: (list) => { this.members = list || []; this.dialog.open(tpl, { width: '640px' }); },
            error: () => { this.members = []; this.dialog.open(tpl, { width: '640px' }); }
          });
        },
        error: () => {
          this.invitations = [];
          this.boardService.getProjectMembers(id).subscribe({
            next: (list) => { this.members = list || []; this.dialog.open(tpl, { width: '640px' }); },
            error: () => { this.members = []; this.dialog.open(tpl, { width: '640px' }); }
          });
        }
      });
    });
  }

  sendInvite(name: string): void {
    const nm = (name || '').trim();
    if (!nm) return;
    this.currentBoardId$.subscribe(id => {
      if (!id) return;
      const existsMember = (this.members || []).some(m => (m.name || '').toLowerCase() === nm.toLowerCase());
      const existsInvite = (this.invitations || []).some((i: any) => (i.name || '').toLowerCase() === nm.toLowerCase());
      if (existsMember) { this.inviteError = 'Ce membre est déjà dans le projet'; return; }
      if (existsInvite) { this.inviteError = 'Invitation déjà envoyée'; return; }
      this.boardService.inviteMember(id, nm).subscribe({
        next: () => {
          this.boardService.getProject(id).subscribe({
            next: (p) => { const project = p?.project || p; this.invitations = project?.invitations || []; },
            error: () => {}
          });
          this.inviteError = null;
        },
        error: (err) => { this.inviteError = err?.error?.message || 'Impossible d\'envoyer l\'invitation'; }
      });
    });
  }

  changeMemberRole(member: any, role: string): void {
    this.currentBoardId$.pipe(take(1)).subscribe(id => {
      if (!id) return;
      const uid = member?.userId || member?.id;
      if (!uid) return;
      this.boardService.updateMemberRole(id, uid, role).subscribe({
        next: () => {
          this.boardService.getProjectMembers(id).subscribe({
            next: (list) => (this.members = list || []),
            error: () => {}
          });
        },
        error: () => {
          this.boardService.getProjectMembers(id).subscribe({
            next: (list) => (this.members = list || []),
            error: () => {}
          });
        }
      });
    });
  }

  canRemove(member: any): boolean {
    const mineOk = this.isOwner || this.myRole === 'Administrator';
    const targetOwner = this.ownerId && ((member?.userId || member?.id) === this.ownerId);
    const targetAdmin = member?.role === 'Administrator';
    return !!mineOk && !targetOwner && !targetAdmin;
  }

  removeMember(member: any): void {
    this.currentBoardId$.pipe(take(1)).subscribe(id => {
      if (!id) return;
      const uid = member?.userId || member?.id;
      if (!uid) return;
      if (!this.canRemove(member)) return;
      this.boardService.removeMember(id, uid).subscribe({
        next: () => {
          this.boardService.getProjectMembers(id).subscribe({
            next: (list) => (this.members = list || []),
            error: () => {}
          });
        },
        error: () => {}
      });
    });
  }

  private getUserId(): string | null {
    const token = this.auth.getToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length < 2) return null;
    try {
      if (typeof atob === 'undefined') return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload?.id || payload?.userId || payload?.sub || null;
    } catch {
      return null;
    }
  }
}

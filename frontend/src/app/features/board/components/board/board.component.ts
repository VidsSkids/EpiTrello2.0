import { Component, ElementRef, OnInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core'
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
import { Observable, of, combineLatest, Subject, startWith } from 'rxjs'
import { map, take, switchMap, shareReplay } from 'rxjs/operators'
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
  project$!: Observable<any | null>;
  projectMembers$!: Observable<any[]>;
  projectInvitations$!: Observable<any[]>;
  projectTags$!: Observable<any[]>;
  projectColumns$!: Observable<any[]>;
  ownerId$!: Observable<string | null>;
  projectName$!: Observable<string>;
  createdAt$!: Observable<Date | null>;
  updatedAt$!: Observable<Date | null>;
  refreshProject$ = new Subject<void>();


  newBoardTitle = '';
  newListTitle = '';
  showNewBoardForm = false;
  showNewListForm = false;
  showMembers = false;
  members: any[] = [];
  isOwner = false;

  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;
  editedTitle = '';
  editingTitle = false;
  favorite = false;
  visibility: 'private' | 'public' | 'workspace' | 'Workspace' = 'private';
  currentView: 'kanban' | 'calendar' | 'timeline' = 'kanban';
  invitations: any[] = [];
  inviteError: string | null = null;

  isLoading: boolean = true;
  ownerId: string | null = null;
  myRole: string | undefined;
  currentUserId: string | null = null;


  onListDrop(event: CdkDragDrop<any[]>): void {
    const lists = event.container.data as List[];
    moveItemInArray(lists, event.previousIndex, event.currentIndex);
    const boardId = lists[0]?.boardId;
    if (!boardId) return;
    lists.forEach((list, index) => {
      this.boardService.reorderColumn(boardId, list.id, index).subscribe({
        next: () => console.log('API:reorderColumn:success', { boardId, columnId: list.id, newIndex: index }),
        error: (err) => console.error('API:reorderColumn:error', { boardId, columnId: list.id, newIndex: index, err })
      });
    });
    this.refreshProject();
  }

  constructor(
    private boardService: BoardService,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.boards$ = of([]);
    this.currentUserId = this.getUserId();

    const id$ = this.route.paramMap.pipe(map(pm => pm.get('id')));
    const parentId$ = this.route.parent ? this.route.parent.paramMap.pipe(map(pm => pm.get('id'))) : of(null);
    this.currentBoardId$ = combineLatest([id$, parentId$]).pipe(map(([id, pid]) => id ?? pid));

    this.project$ = this.currentBoardId$.pipe(
      switchMap(id => (id ? this.refreshProject$.pipe(startWith(undefined), switchMap(() => this.boardService.getProject(id))) : of(null))),
      map((p: any) => (p ? (p?.project || p) : null)),
      shareReplay(1)
    );

    this.project$.subscribe(p => console.log('Project:', p));


    this.projectName$ = this.project$.pipe(map(p => (p?.name || 'Untitled')));
    this.ownerId$ = this.project$.pipe(map(p => p?.ownerId || null));
    this.projectMembers$ = this.project$.pipe(map(p => p?.members || []));
    this.projectInvitations$ = this.project$.pipe(map(p => p?.invitations || []));
    this.projectTags$ = this.project$.pipe(map(p => p?.tags || []));
    this.projectColumns$ = this.project$.pipe(map(p => p?.columns || []));
    this.createdAt$ = this.project$.pipe(map(p => (p?.createdAt ? new Date(p.createdAt) : null)));
    this.updatedAt$ = this.project$.pipe(map(p => (p?.updatedAt ? new Date(p.updatedAt) : null)));

    this.lists$ = combineLatest([this.projectColumns$, this.project$]).pipe(
      map(([columns, proj]) => {
        const boardId = proj ? (proj.uuid || proj.id || proj._id) : null;
        return (Array.isArray(columns) ? columns : []).map((c: any, index: number) => {
          const id = c?.uuid || c?.id || c?._id || (boardId ? `${boardId}-col-${index}` : `${index}`);
          const title = c?.name || c?.title || 'Untitled';
          const position = typeof c?.position === 'number' ? c.position : index;
          const cards = Array.isArray(c?.cards) ? c.cards : [];
          const list: List = {
            id,
            title,
            boardId: boardId || '',
            cards,
            position,
            createdAt: proj?.createdAt ? new Date(proj.createdAt) : new Date(),
            updatedAt: proj?.updatedAt ? new Date(proj.updatedAt) : new Date()
          };
          return list;
        }).sort((a, b) => a.position - b.position);
      })
    );

    this.currentBoard$ = combineLatest([this.project$, this.lists$]).pipe(
      map(([p, lists]) => {
        if (!p) return undefined;
        const id = p?.uuid || p?.id || p?._id;
        const createdAt = p?.createdAt ? new Date(p.createdAt) : new Date();
        const updatedAt = p?.updatedAt ? new Date(p.updatedAt) : createdAt;
        const b: BoardModel = {
          id,
          title: p?.name || 'Untitled',
          lists: (lists || []).map(l => l.id),
          createdAt,
          updatedAt,
          ownerId: p?.ownerId,
          visibility: p?.visibility,
          favorite: p?.favorite
        } as BoardModel;
        return b;
      })
    );

    this.project$.subscribe((project) => {
      if (!project) return;
      const uid = this.getUserId();
      const ownerId = project?.ownerId;
      const vis = project?.visibility;
      const fav = project?.favorite;
      if (vis) this.visibility = vis;
      if (typeof fav === 'boolean') this.favorite = fav;
      if (ownerId) {
        this.ownerId = ownerId;
        this.isOwner = uid ? ownerId === uid : false;
      }
      this.invitations = project?.invitations || [];
      this.editedTitle = project?.name || 'Untitled';
    });

    this.projectMembers$.subscribe(members => {
      if (!members) return;
      this.members = members.map(m => ({ userId: m.userId, username: m.username, role: m.role}));
    });

  }



  openBoard(boardId: string): void {
    this.router.navigate(['/board', boardId]);
  }



  createBoard(): void {
    if (this.newBoardTitle.trim()) {
      this.boardService.createBoardFromServer(this.newBoardTitle).subscribe({
        next: (board) => {
          console.log('API:createProject:success', { id: board.id, title: board.title });
          this.newBoardTitle = '';
          this.showNewBoardForm = false;
          this.router.navigate(['/board', board.id]);
        },
        error: (err) => console.error('API:createProject:error', err)
      });
    }
  }

  createList(): void {
    if (this.newListTitle.trim()) {
      const id = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
      if (id) {
        this.boardService.createColumn(id, this.newListTitle).subscribe({
          next: () => {
            console.log('API:createColumn:success', { projectId: id, name: this.newListTitle });
            this.newListTitle = '';
            this.showNewListForm = false;
            this.refreshProject();
          },
          error: (err) => console.error('API:createColumn:error', { projectId: id, name: this.newListTitle, err })
        });
      }
    }
  }

  deleteBoard(event: Event, boardId: string): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this board?')) {
      this.boardService.deleteProject(boardId).subscribe({
        next: () => {
          this.boardService.deleteBoard(boardId);
          const currentId = this.route.snapshot.paramMap.get('id') || this.route.parent?.snapshot.paramMap.get('id');
          if (currentId === boardId) {
            this.router.navigate(['/']);
          }
        },
        error: (err) => console.error(`Failed to delete board ${boardId}`, err)
      });
    }
  }

  refreshProject(): void {
    this.refreshProject$.next();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
  toggleMembers(): void {
    this.onMembersMenuOpened();
  }

  onMembersMenuOpened(): void {
    this.currentBoardId$.pipe(take(1)).subscribe(id => {
      if (!id) return;
      this.boardService.getProjectMembers(id).subscribe({
        next: (list) => {
          console.log('API:getProjectMembers:success', { projectId: id, count: (list || []).length });
          this.members = list || [];
          if (this.ownerId) {
            const hasOwner = (this.members || []).some(m => (m.userId || m.id) === this.ownerId);
            if (!hasOwner) {
              this.members = [...this.members, { id: this.ownerId, userId: this.ownerId, role: 'Owner' }];
            }
          }
          const uid = this.getUserId();
          const mine = (this.members || []).find(m => (m.userId || m.id) === uid);
          this.myRole = mine?.role;
        },
        error: (err) => { console.error('API:getProjectMembers:error', { projectId: id, err }); this.members = []; }
      });
      if (!this.ownerId) {
        this.boardService.getProject(id).subscribe({
          next: (p) => {
            const project = p?.project || p;
            this.ownerId = project?.ownerId || null;
            console.log('API:getProject:success', { projectId: id, name: project?.name });
          },
          error: (err) => console.error('API:getProject:error', { projectId: id, err })
        });
      }
    });
  }

  leaveOrDelete(): void {
    this.currentBoardId$.subscribe(id => {
      if (!id) return;
      if (this.isOwner) {
        this.boardService.deleteProject(id).subscribe({
          next: () => { console.log('API:deleteProject:success', { projectId: id }); this.router.navigate(['/']); },
          error: (err) => console.error('API:deleteProject:error', { projectId: id, err })
        });
      } else {
        this.boardService.leaveProject(id).subscribe({
          next: () => { console.log('API:leaveProject:success', { projectId: id }); this.router.navigate(['/']); },
          error: (err) => console.error('API:leaveProject:error', { projectId: id, err })
        });
      }
    });
  }

  toggleTitleEdit(editing: boolean): void {
    this.editingTitle = editing;
    if (editing) {
      setTimeout(() => this.titleInput.nativeElement.focus());
    }
  }

  saveTitle(board: BoardModel): void {
    const name = (this.editedTitle || '').trim();
    if (!name) { this.editingTitle = false; return; }
    const updated: BoardModel = { ...board, title: name };
    this.boardService.updateBoard(updated);
    this.currentBoardId$.subscribe(id => {
      if (!id) { this.editingTitle = false; return; }
      this.boardService.updateProject(id, { name }).subscribe({
        next: () => { console.log('API:updateProject:name:success', { projectId: id, name }); this.editingTitle = false; },
        error: (err) => { console.error('API:updateProject:name:error', { projectId: id, name, err }); this.editingTitle = false; }
      });
    });
  }

  openShareDialog(tpl: TemplateRef<any>): void {
    this.currentBoardId$.subscribe(id => {
      if (!id) return;
      this.dialog.open(tpl, {
        width: '60%',
        maxWidth: 'none',
        height: '80%',
        panelClass: 'custom-dialog'
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
            next: (p) => { const project = p?.project || p; this.invitations = project?.invitations || []; this.cdr.detectChanges(); },
            error: (err) => console.error('API:getProject:error', { projectId: id, err })
          });
          this.inviteError = null;
          console.log('API:inviteMember:success', { projectId: id, name: nm });
        },
        error: (err) => { console.error('API:inviteMember:error', { projectId: id, name: nm, err }); this.inviteError = err?.error?.message || 'Impossible d\'envoyer l\'invitation'; }
      });
    });
  }

  acceptInvitation(invitation: any): void {
    this.currentBoardId$.pipe(take(1)).subscribe(id => {
      if (!id || !invitation?.id) return;
      this.boardService.acceptInvitation(id).subscribe({
        next: () => {
          this.boardService.getProject(id).subscribe({
            next: (p) => { const project = p?.project || p; this.invitations = project?.invitations || []; this.cdr.detectChanges(); },
            error: (err: any) => console.error('API:getProject:error', { projectId: id, err })
          });
          this.boardService.getProjectMembers(id).subscribe({
            next: (list) => (this.members = list || []),
            error: (err: any) => console.error('API:getProjectMembers:error', { projectId: id, err })
          });
          console.log('API:acceptInvitation:success', { projectId: id, invitationId: invitation.id });
        },
        error: (err: any) => console.error('API:acceptInvitation:error', { projectId: id, invitationId: invitation.id, err })
      });
    });
  }

  revokeInvitation(invitation: any): void {
    this.currentBoardId$.pipe(take(1)).subscribe(id => {
      if (!id || !invitation?.id) return;
      this.boardService.revokeInvitation(id).subscribe({
        next: () => {
          this.boardService.getProject(id).subscribe({
            next: (p) => { const project = p?.project || p; this.invitations = project?.invitations || []; this.cdr.detectChanges(); },
            error: (err: any) => console.error('API:getProject:error', { projectId: id, err })
          });
          console.log('API:revokeInvitation:success', { projectId: id, invitationId: invitation.id });
        },
        error: (err: any) => console.error('API:revokeInvitation:error', { projectId: id, invitationId: invitation.id, err })
      });
    });
  }

  changeMemberRole(member: any, role: string): void {
    this.currentBoardId$.pipe(take(1)).subscribe(id => {
      if (!id) return;
      const uid = member?.userId || member?.id;
      if (!uid) return;
      if (this.ownerId && uid === this.ownerId) return;
      this.boardService.updateMemberRole(id, uid, role).subscribe({
        next: () => {
          this.boardService.getProjectMembers(id).subscribe({
            next: (list) => (this.members = list || []),
            error: (err) => console.error('API:getProjectMembers:error', { projectId: id, err })
          });
          console.log('API:updateMemberRole:success', { projectId: id, userId: uid, role });
        },
        error: (err) => {
          console.error('API:updateMemberRole:error', { projectId: id, userId: uid, role, err });
          this.boardService.getProjectMembers(id).subscribe({
            next: (list) => (this.members = list || []),
            error: (err) => console.error('API:getProjectMembers:error', { projectId: id, err })
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
            error: (err) => console.error('API:getProjectMembers:error', { projectId: id, err })
          });
          console.log('API:removeMember:success', { projectId: id, userId: uid });
        },
        error: (err) => console.error('API:removeMember:error', { projectId: id, userId: uid, err })
      });
    });
  }

  deleteAccount(): void {
    const idStr = this.getUserId();
    const idNum = idStr ? Number(idStr) : NaN;
    if (!idStr || Number.isNaN(idNum)) {
      console.error('API:deleteUser:error', { reason: 'invalid_user_id', userId: idStr });
      return;
    }
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre compte ?')) return;
    this.auth.deleteUser(idNum).subscribe({
      next: () => {
        console.log('API:deleteUser:success', { userId: idNum });
        this.auth.logout();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('API:deleteUser:error', { userId: idNum, err });
      }
    });
  }

  logoutUser(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
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

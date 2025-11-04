import { Component, OnInit } from '@angular/core'
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
import { BoardService } from '../../services/board-service'
import { List } from '../../models/list'
import { ListComponent } from '../list/list'
import { Board as BoardModel } from '../../models/board'
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router'
import { Router } from '@angular/router'
import { Observable, of, combineLatest, Subject } from 'rxjs'
import { map } from 'rxjs/operators'

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
    ListComponent,
],
  templateUrl: './board.html',
  styleUrl: './board.css'
})
export class Board implements OnInit {
  boards$!: Observable<BoardModel[]>;
  currentBoardId$!: Observable<string | null>;
  currentBoard$!: Observable<BoardModel | undefined>;
  lists$!: Observable<List[]>;

  newBoardTitle = '';
  newListTitle = '';
  showNewBoardForm = false;
  showNewListForm = false;

  isLoading: boolean = true;


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
    private router: Router
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
  }



  openBoard(boardId: string): void {
    this.router.navigate(['/board', boardId]);
  }



  createBoard(): void {
    if (this.newBoardTitle.trim()) {
      const board = this.boardService.createBoard(this.newBoardTitle);
      this.newBoardTitle = '';
      this.showNewBoardForm = false;
      this.router.navigate(['/board', board.id]);
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

}

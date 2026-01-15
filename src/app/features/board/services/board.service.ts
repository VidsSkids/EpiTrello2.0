import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Board } from '../models/board';
import { List } from '../models/list';
import { Card } from '../models/card';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '@environments/environment.development';
import { AuthService } from '@features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private readonly STORAGE_KEY = 'epitrello_data';
  
  private boardsSubject = new BehaviorSubject<Board[]>([]);
  private listsSubject = new BehaviorSubject<List[]>([]);
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  private invitationsReceivedSubject = new BehaviorSubject<any[]>([]);
  private invitationsSentSubject = new BehaviorSubject<any[]>([]);
  private currentMemberSubject = new BehaviorSubject<any | null>(null);
  
  boards$ = this.boardsSubject.asObservable();
  lists$ = this.listsSubject.asObservable();
  cards$ = this.cardsSubject.asObservable();
  invitationsReceived$ = this.invitationsReceivedSubject.asObservable();
  invitationsSent$ = this.invitationsSentSubject.asObservable();
  member$ = this.currentMemberSubject.asObservable();

  readonly gradients: string[] = [
    'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
    'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)',
    'linear-gradient(135deg, #FAD0C4 0%, #FFD1FF 100%)',
    'linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)',
    'linear-gradient(135deg, #C6FFDD 0%, #FBD786 50%, #f7797d 100%)',
    'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    'linear-gradient(135deg, #209cff 0%, #68e0cf 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #b1ea4d 0%, #459522 100%)'
  ];
  
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiURL}`;
  private readonly auth = inject(AuthService);

  constructor() {
    this.loadFromLocalStorage();
  }

  getBoards(): Observable<Board[]> {
    return this.boards$;
  }

  getBoardById(id: string): Board | undefined {
    return this.boardsSubject.value.find(board => board.id === id);
  }

  private getAuthOptions(): { headers?: HttpHeaders } {
    const token = this.auth.getToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  createBoardFromServer(title: string, backgroundGradiant?: string): Observable<Board> {
    console.log('API:createProject:req', { name: title });
    return this.http.post<any>(`${this.baseUrl}/projects`, { name: title }, this.getAuthOptions()).pipe(
      tap((res: any) => {
        const p = res?.project || res;
        console.log('API:createProject:res', { id: p?.uuid || p?.id || p?._id, name: p?.name });
        this.updateCurrentMemberFromProject(p);
      }),
      map((res: any) => {
        const p = res?.project || res || {};
        const id = p.id || p.uuid;
        const name = p.name || title;
        const createdAt = p.createdAt ? new Date(p.createdAt) : new Date();
        const updatedAt = p.updatedAt ? new Date(p.updatedAt) : createdAt;
        const board: Board = {
          id,
          title: name,
          lists: [],
          createdAt,
          updatedAt,
          ownerId: p.ownerId
        };
        const boards = [...this.boardsSubject.value, board];
        this.boardsSubject.next(boards);
        this.saveToLocalStorage();
        return board;
      })
    );
  }

  getProject(projectId: string): Observable<any> {
    console.log('API:getProject:req', { projectId });
    return this.http.get<any>(`${this.baseUrl}/projects/${projectId}`, this.getAuthOptions()).pipe(
      tap((res: any) => {
        const project = res?.project || res;
        console.log('API:getProject:res', { projectId, name: project?.name });
        this.updateCurrentMemberFromProject(project);
      })
    );
  }

  getProjectMembers(projectId: string): Observable<any[]> {
    console.log('API:getProjectMembers:req', { projectId });
    return this.http
      .get<any>(`${this.baseUrl}/projects/${projectId}`, this.getAuthOptions())
      .pipe(map((res: any) => res?.project?.members || []));
  }

  leaveProject(projectId: string): Observable<any> {
    console.log('API:leaveProject:req', { projectId });
    return this.http.post(`${this.baseUrl}/projects/${projectId}/leave`, {}, this.getAuthOptions());
  }

  deleteProject(projectId: string): Observable<any> {
    console.log('API:deleteProject:req', { projectId });
    return this.http.delete(`${this.baseUrl}/projects/${projectId}`, this.getAuthOptions());
  }

  updateProject(projectId: string, changes: any): Observable<any> {
    console.log('API:updateProject:req', { projectId, changes });
    return this.http.post(`${this.baseUrl}/projects/${projectId}/update`, changes, this.getAuthOptions());
  }

  createColumn(projectId: string, name: string): Observable<any> {
    console.log('API:createColumn:req', { projectId, name });
    return this.http.post(`${this.baseUrl}/projects/${projectId}/columns`, { name }, this.getAuthOptions());
  }

  updateColumn(projectId: string, columnId: string, name: string): Observable<any> {
    console.log('API:updateColumn:req', { projectId, columnId, name });
    return this.http.patch(`${this.baseUrl}/projects/${projectId}/columns/${columnId}`, { name }, this.getAuthOptions());
  }

  reorderColumn(projectId: string, columnId: string, newIndex: number): Observable<any> {
    console.log('API:reorderColumn:req', { projectId, columnId, newIndex });
    return this.http.patch(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/reorder`,
      { newIndex },
      this.getAuthOptions()
    );
  }

  deleteColumn(projectId: string, columnId: string): Observable<any> {
    console.log('API:deleteColumn:req', { projectId, columnId });
    return this.http.delete(`${this.baseUrl}/projects/${projectId}/columns/${columnId}`, this.getAuthOptions());
  }

  createCardAPI(projectId: string, columnId: string, title: string): Observable<any> {
    console.log('API:createCard:req', { projectId, columnId, title });
    return this.http.post(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards`,
      { title },
      this.getAuthOptions()
    );
  }

  toggleCardDoneAPI(projectId: string, columnId: string, cardId: string): Observable<any> {
    console.log('API:toggleCardDone:req', { projectId, columnId, cardId });
    return this.http.post(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}/toggleDone`,
      {},
      this.getAuthOptions()
    );
  }

  updateCardFieldsAPI(
    projectId: string,
    columnId: string,
    cardId: string,
    changes: {
      title?: string;
      description?: string;
      isDone?: boolean;
      dueDate?: number;
      startDate?: number;
      assignedTo?: any[];
      tags?: any[];
    }
  ): Observable<any> {
    console.log('API:updateCard:req', { projectId, columnId, cardId, changes });
    return this.http.patch(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}`,
      changes,
      this.getAuthOptions()
    );
  }

  reorderCardAPI(
    projectId: string,
    columnId: string,
    cardId: string,
    newIndex: number,
    newColumnId?: string
  ): Observable<any> {
    const body: any = { newIndex };
    if (newColumnId) body.newColumnId = newColumnId;
    console.log('API:reorderCard:req', { projectId, columnId, cardId, ...body });
    return this.http.patch(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}/reorder`,
      body,
      this.getAuthOptions()
    );
  }

  deleteCardAPI(projectId: string, columnId: string, cardId: string): Observable<any> {
    console.log('API:deleteCard:req', { projectId, columnId, cardId });
    return this.http.delete(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}`,
      this.getAuthOptions()
    );
  }

  createTag(projectId: string, name: string, color: string = '#FFFFFF'): Observable<any> {
    console.log('API:createTag:req', { projectId, name, color });
    return this.http.post(
      `${this.baseUrl}/projects/${projectId}/tags`,
      { name, color },
      this.getAuthOptions()
    );
  }

  updateTag(projectId: string, tagId: string, changes: { name?: string; color?: string }): Observable<any> {
    console.log('API:updateTag:req', { projectId, tagId, changes });
    return this.http.patch(
      `${this.baseUrl}/projects/${projectId}/tags/${tagId}`,
      changes,
      this.getAuthOptions()
    );
  }

  deleteTag(projectId: string, tagId: string): Observable<any> {
    console.log('API:deleteTag:req', { projectId, tagId });
    return this.http.delete(
      `${this.baseUrl}/projects/${projectId}/tags/${tagId}`,
      this.getAuthOptions()
    );
  }

  attachTagToCard(projectId: string, tagId: string, cardId: string): Observable<any> {
    console.log('API:attachTagToCard:req', { projectId, tagId, cardId });
    return this.http.post(
      `${this.baseUrl}/projects/${projectId}/tags/attach/${tagId}/${cardId}`,
      {},
      this.getAuthOptions()
    );
  }

  detachTagFromCard(projectId: string, tagId: string, cardId: string): Observable<any> {
    console.log('API:detachTagFromCard:req', { projectId, tagId, cardId });
    return this.http.post(
      `${this.baseUrl}/projects/${projectId}/tags/detach/${tagId}/${cardId}`,
      {},
      this.getAuthOptions()
    );
  }

  createChecklist(projectId: string, columnId: string, cardId: string, title: string): Observable<any> {
    console.log('API:createChecklist:req', { projectId, columnId, cardId, title });
    return this.http.post(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists`,
      { title },
      this.getAuthOptions()
    );
  }

  updateChecklist(projectId: string, columnId: string, cardId: string, checklistId: string, changes: { title: string }): Observable<any> {
    console.log('API:updateChecklist:req', { projectId, columnId, cardId, checklistId, changes });
    return this.http.patch(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}`,
      changes,
      this.getAuthOptions()
    );
  }

  deleteChecklist(projectId: string, columnId: string, cardId: string, checklistId: string): Observable<any> {
    console.log('API:deleteChecklist:req', { projectId, columnId, cardId, checklistId });
    return this.http.delete(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}`,
      this.getAuthOptions()
    );
  }

  createChecklistItem(projectId: string, columnId: string, cardId: string, checklistId: string, content: string): Observable<any> {
    console.log('API:createChecklistItem:req', { projectId, columnId, cardId, checklistId, content });
    return this.http.post(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}/items`,
      { content },
      this.getAuthOptions()
    );
  }

  updateChecklistItem(
    projectId: string,
    columnId: string,
    cardId: string,
    checklistId: string,
    itemId: string,
    changes: { content?: string; isDone?: boolean; dueDate?: number; assignedTo?: any[] }
  ): Observable<any> {
    console.log('API:updateChecklistItem:req', { projectId, columnId, cardId, checklistId, itemId, changes });
    return this.http.patch(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`,
      changes,
      this.getAuthOptions()
    );
  }

  deleteChecklistItem(projectId: string, columnId: string, cardId: string, checklistId: string, itemId: string): Observable<any> {
    console.log('API:deleteChecklistItem:req', { projectId, columnId, cardId, checklistId, itemId });
    return this.http.delete(
      `${this.baseUrl}/projects/${projectId}/columns/${columnId}/cards/${cardId}/checklists/${checklistId}/items/${itemId}`,
      this.getAuthOptions()
    );
  }

  inviteMember(projectId: string, name: string): Observable<any> {
    console.log('API:inviteMember:req', { projectId, name });
    return this.http.post(`${this.baseUrl}/projects/${projectId}/invite`, { name }, this.getAuthOptions());
  }

  acceptInvitation(projectId: string, invitationId: string): Observable<any> {
    console.log('API:acceptInvitation:req', { projectId, invitationId });
    return this.http.post(`${this.baseUrl}/projects/${projectId}/accept`, { invitationId }, this.getAuthOptions());
  }

  cancelInvitation(projectId: string, invitationId: string): Observable<any> {
    console.log('API:revokeInvitation:req', { projectId, invitationId });
    return this.http.post(`${this.baseUrl}/projects/${projectId}/revokeInvitation`, { invitationId }, this.getAuthOptions());
  }

  updateMemberRole(projectId: string, userId: string, role: string): Observable<any> {
    console.log('API:updateMemberRole:req', { projectId, userId, role });
    return this.http.patch(
      `${this.baseUrl}/projects/${projectId}/members/${userId}/role`,
      { role },
      this.getAuthOptions()
    );
  }

  removeMember(projectId: string, userId: string): Observable<any> {
    console.log('API:removeMember:req', { projectId, userId });
    return this.http.post(
      `${this.baseUrl}/projects/${projectId}/remove/${userId}`,
      {},
      this.getAuthOptions()
    );
  }

  loadInvitationsReceived(): Observable<any[]> {
    console.log('API:getInvitationsReceived:req');
    return this.http.get<any>(`${this.baseUrl}/projects/invitations`, this.getAuthOptions()).pipe(
      map((res: any) => {
        const arr = Array.isArray(res?.invitations) ? res.invitations : (Array.isArray(res) ? res : []);
        this.invitationsReceivedSubject.next(arr);
        return arr;
      })
    );
  }

  loadInvitationsSent(): Observable<any[]> {
    console.log('API:getInvitationsSent:req');
    return this.http.get<any>(`${this.baseUrl}/projects/sent`, this.getAuthOptions()).pipe(
      map((res: any) => {
        const arr = Array.isArray(res?.invitations) ? res.invitations : (Array.isArray(res) ? res : []);
        this.invitationsSentSubject.next(arr);
        return arr;
      })
    );
  }

  preloadWorkspaceData(): Observable<{ projects: Board[]; received: any[]; sent: any[] }> {
    return forkJoin({
      projects: this.loadProjectsFromServer(),
      received: this.loadInvitationsReceived(),
      sent: this.loadInvitationsSent()
    });
  }

  loadProjectsFromServer(): Observable<Board[]> {
    console.log('API:getProjects:req');
    return this.http.get<any>(`${this.baseUrl}/projects`, this.getAuthOptions()).pipe(
      tap((res: any) => {
        const items = Array.isArray(res?.projects) ? res.projects : (Array.isArray(res) ? res : []);
        console.log('API:getProjects:res', { count: items.length });
        const first = items[0];
        if (first) {
          this.updateCurrentMemberFromProject(first);
        }
      }),
      map((res: any) => {
        const items = Array.isArray(res?.projects) ? res.projects : (Array.isArray(res) ? res : []);
        const boards: Board[] = items.map((p: any) => {
          const id = p?.uuid || p?.id || p?._id || this.generateId();
          const name = p?.name || 'Untitled';
          const createdAt = p?.createdAt ? new Date(p.createdAt) : new Date();
          const updatedAt = p?.updatedAt ? new Date(p.updatedAt) : createdAt;
          return {
            id,
            title: name,
            lists: [],
            backgroundGradiant: this.gradients[Math.floor(Math.random() * this.gradients.length)],
            createdAt,
            updatedAt,
            ownerId: p?.ownerId,
            favorite: typeof p?.favorite === 'boolean' ? p.favorite : undefined,
            visibility: p?.visibility
          } as Board;
        });
        this.boardsSubject.next(boards);
        this.saveToLocalStorage();
        return boards;
      })
    );
  }

  private updateCurrentMemberFromProject(project: any): void {
    const members = Array.isArray(project?.members) ? project.members : [];
    const userId = this.getUserIdFromToken();
    if (!userId) {
      this.currentMemberSubject.next(null);
      return;
    }
    const m = members.find((mm: any) => (mm?.userId || mm?.id) === userId) || null;
    this.currentMemberSubject.next(m);
  }

  private getUserIdFromToken(): string | null {
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

  updateBoard(board: Board): void {
    const boards = this.boardsSubject.value.map(b => 
      b.id === board.id ? { ...board, updatedAt: new Date() } : b
    );
    
    this.boardsSubject.next(boards);
    this.saveToLocalStorage();
  }

  deleteBoard(id: string): void {
    const listsToDelete = this.listsSubject.value.filter(list => list.boardId === id);
    listsToDelete.forEach(list => this.deleteList(list.id));
    
    const boards = this.boardsSubject.value.filter(board => board.id !== id);
    this.boardsSubject.next(boards);
    this.saveToLocalStorage();
  }

  getLists(boardId: string): List[] {
    return this.listsSubject.value
      .filter(list => list.boardId === boardId)
      .sort((a, b) => a.position - b.position);
  }

  getListById(id: string): List | undefined {
    return this.listsSubject.value.find(list => list.id === id);
  }

  createList(boardId: string, title: string): List {
    const lists = this.getLists(boardId);
    const position = lists.length > 0 ? Math.max(...lists.map(l => l.position)) + 1 : 0;
    
    const newList: List = {
      id: this.generateId(),
      title,
      boardId,
      cards: [],
      position,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const board = this.getBoardById(boardId);
    if (board) {
      const updatedBoard = {
        ...board,
        lists: [...board.lists, newList.id]
      };
      this.updateBoard(updatedBoard);
    }
    
    const updatedLists = [...this.listsSubject.value, newList];
    this.listsSubject.next(updatedLists);
    this.saveToLocalStorage();
    
    return newList;
  }

  updateList(list: List): void {
    const lists = this.listsSubject.value.map(l => 
      l.id === list.id ? { ...list, updatedAt: new Date() } : l
    );
    
    this.listsSubject.next(lists);
    this.saveToLocalStorage();
  }

  deleteList(id: string): void {
    const cardsToDelete = this.cardsSubject.value.filter(card => card.listId === id);
    cardsToDelete.forEach(card => this.deleteCard(card.id));
    
    const list = this.getListById(id);
    if (list) {
      const board = this.getBoardById(list.boardId);
      if (board) {
        const updatedBoard = {
          ...board,
          lists: board.lists.filter(listId => listId !== id)
        };
        this.updateBoard(updatedBoard);
      }
    }
    
    const lists = this.listsSubject.value.filter(list => list.id !== id);
    this.listsSubject.next(lists);
    this.saveToLocalStorage();
  }

  getCards(listId: string): Card[] {
    return this.cardsSubject.value
      .filter(card => card.listId === listId)
      .sort((a, b) => a.position - b.position);
  }

  getCardById(id: string): Card | undefined {
    return this.cardsSubject.value.find(card => card.id === id);
  }

  createCard(listId: string, title: string): Card {
    const cards = this.getCards(listId);
    const position = cards.length > 0 ? Math.max(...cards.map(c => c.position)) + 1 : 0;
    
    const newCard: Card = {
      id: this.generateId(),
      title,
      listId,
      position,
      createdAt: new Date(),
    };
    
    const list = this.getListById(listId);
    if (list) {
      const updatedList = {
        ...list,
        cards: [...list.cards, newCard.id]
      };
      this.updateList(updatedList);
    }
    
    const updatedCards = [...this.cardsSubject.value, newCard];
    this.cardsSubject.next(updatedCards);
    this.saveToLocalStorage();
    
    return newCard;
  }

  updateCard(card: Card): void {
    const cards = this.cardsSubject.value.map(c => 
      c.id === card.id ? { ...card, updatedAt: new Date() } : c
    );
    
    this.cardsSubject.next(cards);
    this.saveToLocalStorage();
  }

  deleteCard(id: string): void {
    const card = this.getCardById(id);
    if (card) {
      const list = this.getListById(card.listId);
      if (list) {
        const updatedList = {
          ...list,
          cards: list.cards.filter(cardId => cardId !== id)
        };
        this.updateList(updatedList);
      }
    }
    
    const cards = this.cardsSubject.value.filter(card => card.id !== id);
    this.cardsSubject.next(cards);
    this.saveToLocalStorage();
  }

  moveCard(cardId: string, targetListId: string, position: number): void {
    const card = this.getCardById(cardId);
    if (!card) return;
    
    const sourceList = this.getListById(card.listId);
    if (sourceList) {
      const updatedSourceList = {
        ...sourceList,
        cards: sourceList.cards.filter(id => id !== cardId)
      };
      this.updateList(updatedSourceList);
    }
    
    const targetList = this.getListById(targetListId);
    if (targetList) {
      const updatedTargetList = {
        ...targetList,
        cards: [...targetList.cards, cardId]
      };
      this.updateList(updatedTargetList);
    }
    
    const updatedCard = {
      ...card,
      listId: targetListId,
      position,
      updatedAt: new Date()
    };
    this.updateCard(updatedCard);
    
    this.reorderCards(targetListId);
  }

  reorderCards(listId: string): void {
    const cards = this.getCards(listId);
    cards.forEach((card, index) => {
      if (card.position !== index) {
        this.updateCard({
          ...card,
          position: index
        });
      }
    });
  }

  reorderLists(boardId: string): void {
    const lists = this.getLists(boardId);
    lists.forEach((list, index) => {
      if (list.position !== index) {
        this.updateList({
          ...list,
          position: index
        });
      }
    });
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private saveToLocalStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = {
        boards: this.boardsSubject.value,
        lists: this.listsSubject.value,
        cards: this.cardsSubject.value
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    }
  }

  private loadFromLocalStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const dataStr = localStorage.getItem(this.STORAGE_KEY);
      if (dataStr) {
        try {
          const data = JSON.parse(dataStr);
          const boards: Board[] = (data.boards || []).map((b: Board) => ({
            ...b
          }));
          this.boardsSubject.next(boards);
          this.listsSubject.next(data.lists || []);
          this.cardsSubject.next(data.cards || []);
        } catch (error) {
          console.error('Error loading data from localStorage:', error);
          this.resetData();
        }
      } else {
        this.resetData();
      }
    } else {
      this.resetData();
    }
  }

  private resetData(): void {
    this.boardsSubject.next([]);
    this.listsSubject.next([]);
    this.cardsSubject.next([]);
  }
}

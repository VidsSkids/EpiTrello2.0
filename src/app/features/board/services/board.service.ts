import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Board } from '../models/board';
import { List } from '../models/list';
import { Card } from '../models/card';

@Injectable({
  providedIn: 'root'
})
export class BoardService {
  private readonly STORAGE_KEY = 'epitrello_data';
  
  private boardsSubject = new BehaviorSubject<Board[]>([]);
  private listsSubject = new BehaviorSubject<List[]>([]);
  private cardsSubject = new BehaviorSubject<Card[]>([]);
  
  boards$ = this.boardsSubject.asObservable();
  lists$ = this.listsSubject.asObservable();
  cards$ = this.cardsSubject.asObservable();

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
  
  constructor() {
    this.loadFromLocalStorage();
  }

  getBoards(): Observable<Board[]> {
    return this.boards$;
  }

  getBoardById(id: string): Board | undefined {
    return this.boardsSubject.value.find(board => board.id === id);
  }

  createBoard(title: string, backgroundGradiant?: string): Board {
    const newBoard: Board = {
      id: this.generateId(),
      title,
      lists: [],
      backgroundGradiant: backgroundGradiant ?? this.gradients[Math.floor(Math.random() * this.gradients.length)],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const boards = [...this.boardsSubject.value, newBoard];
    this.boardsSubject.next(boards);
    this.saveToLocalStorage();
    
    return newBoard;
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
      updatedAt: new Date()
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
            ...b,
            backgroundGradiant: b.backgroundGradiant ?? this.gradients[0]
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

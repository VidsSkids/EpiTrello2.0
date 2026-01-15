export interface List {
  id: string;
  title: string;
  boardId: string;
  cards: string[]; // array of id
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

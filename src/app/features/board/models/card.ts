export interface Card {
  id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
  labels?: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

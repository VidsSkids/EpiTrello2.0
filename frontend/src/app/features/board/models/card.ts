export interface ChecklistItem {
  id: string;
  content: string;
  isChecked: boolean;
  dueDate?: number;
  assignedTo?: string[];

  _hover?: boolean;
}

export interface Checklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  showAddItem?: boolean;
  newChecklistItemContent?: string;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  listId: string;
  position: number;
  tagIds?: string[];
  assignedTo?: string[];
  createdAt: Date;
  checklists?: Checklist[];
}

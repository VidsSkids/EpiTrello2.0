export interface Board {
  id: string;
  title: string;
  lists: string[]; // array of id
  backgroundGradiant: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  favorite?: boolean;
  visibility?: 'private' | 'public';
}

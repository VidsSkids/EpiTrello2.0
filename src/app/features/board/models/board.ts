export interface Board {
  id: string;
  title: string;
  lists: string[]; // array of id
  createdAt: Date;
  updatedAt: Date;
  ownerId?: string;
  favorite?: boolean;
  visibility?: 'private' | 'public' | 'workspace' | 'Workspace';
}

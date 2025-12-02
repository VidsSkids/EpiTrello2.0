import mongoose, { Schema } from 'mongoose';

export interface IProjectCard {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  isDone: boolean; // default false
  dueDate?: Date; // optional due date
  startDate?: Date; // optional start date
  assignedTo?: string[]; // array of user public ids
  tagIds: string[];
  checklists: ICardChecklist[];
  createdAt: Date;
}

export interface ICardChecklist {
  _id: mongoose.Types.ObjectId;
  title: string;
  items: ICardChecklistItem[];
}

export interface ICardChecklistItem {
  _id: mongoose.Types.ObjectId;
  content: string;
  isChecked: boolean;
  dueDate?: Date;
  assignedTo?: string[]; // array of user public ids
}

const ChecklistItemSchema = new Schema<ICardChecklistItem>({
  content: { type: String, required: true },
  isChecked: { type: Boolean, default: false },
  dueDate: { type: Date },
  assignedTo: { type: [String], default: [] },
}, { _id: true });

const ChecklistSchema = new Schema<ICardChecklist>({
  title: { type: String, required: true },
  items: { type: [ChecklistItemSchema], default: [] },
}, { _id: true });

const CardSchema = new Schema<IProjectCard>({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  isDone: { type: Boolean, default: false },
  dueDate: { type: Date },
  startDate: { type: Date },
  assignedTo: { type: [String], default: [] },
  tagIds: { type: [String], default: [] }, // will hold IProjectTag objects
  checklists: { type: [ChecklistSchema], default: [] }, // will hold ICardChecklist objects
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

export const ProjectCardModel = mongoose.model<IProjectCard>('ProjectCard', CardSchema);

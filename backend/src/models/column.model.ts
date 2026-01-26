import { Schema, Types, model } from 'mongoose';
import { ProjectCardModel, IProjectCard } from './card.model';

export interface IProjectColumn {
  _id: Types.ObjectId;
  name: string;
  cards?: IProjectCard[];
  createdAt: Date;
}

const ColumnSchema = new Schema<IProjectColumn>({
  name: { type: String, required: true },
  cards: { type: [ProjectCardModel.schema], default: [] }, // will hold IProjectCard objects
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

export const ProjectColumnModel = model<IProjectColumn>('ProjectColumn', ColumnSchema);

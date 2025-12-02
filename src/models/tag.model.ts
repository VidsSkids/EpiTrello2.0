import mongoose, { Schema } from 'mongoose';

export interface IProjectTag {
  _id: mongoose.Types.ObjectId;
  name: string;
  color: string; // hex color code
  createdAt: Date;
}

const TagSchema = new Schema<IProjectTag>({
  name: { type: String, required: true },
  color: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

export const ProjectTagModel = mongoose.model<IProjectTag>('ProjectTag', TagSchema);

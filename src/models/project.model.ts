import mongoose, { Schema, Document } from 'mongoose';

export type ProjectRole = 'Reader' | 'Contributer' | 'Administrator' | 'Owner';

export interface IProjectMember {
  userId: string; // public id (uuid) or mongo _id string
  role: ProjectRole;
}

export interface IProjectInvitation {
  name: string; // invited user's name
  invitedBy: string; // inviter public id
  createdAt: Date;
}

export interface IProjectColumn {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
}

export interface IProject extends Document {
  uuid: string;
  name: string;
  ownerId: string;
  members: IProjectMember[];
  invitations: IProjectInvitation[];
  createdAt?: Date;
  updatedAt?: Date;
  columns: IProjectColumn[];
}

const MemberSchema = new Schema<IProjectMember>({
  userId: { type: String, required: true },
  role: { type: String, required: true, enum: ['Reader', 'Contributer', 'Administrator', 'Owner'] },
}, { _id: false });

const InvitationSchema = new Schema<IProjectInvitation>({
  name: { type: String, required: true },
  invitedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const ColumnSchema = new Schema<IProjectInvitation>({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const ProjectSchema = new Schema<IProject>({
  uuid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  members: { type: [MemberSchema], default: [] },
  invitations: { type: [InvitationSchema], default: [] },
  columns: { type: [ColumnSchema], default: [] },
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema);

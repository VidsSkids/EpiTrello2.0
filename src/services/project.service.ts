import { v4 as uuidv4 } from 'uuid';
import ProjectModel, { IProject, IProjectMember, ProjectRole } from '../models/project.model';
import UserModel from '../models/user.model';
import { ConflictError, NotFoundError, ForbiddenError, BadRequestError } from '../errors';
import { Types } from 'mongoose';

function hasPermission(role: ProjectRole | undefined, needed: 'invite' | 'manage') {
  if (!role) return false;
  if (needed === 'invite') return role === 'Owner' || role === 'Administrator';
  if (needed === 'manage') return role === 'Owner' || role === 'Administrator';
  return false;
}

export class ProjectService {
  async createProject(name: string, ownerId: string) {
    if (!name) throw new BadRequestError('Project name is required');
    const uuid = uuidv4();
    const project = await ProjectModel.create({
      uuid,
      name,
      ownerId,
      members: [{ userId: ownerId, role: 'Owner' as ProjectRole }],
    });
    return {
      id: project.uuid,
      name: project.name,
      ownerId: project.ownerId,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  async getProject(projectId: string) {
    let project = await ProjectModel.findOne({ uuid: projectId });
    if (!project && Types.ObjectId.isValid(projectId)) {
      project = await ProjectModel.findById(projectId);
    }

    if (!project) throw new NotFoundError('Project not found');
    return project;
  }

  async getAllProjectsForUser(userId: string) {
    const projects = await ProjectModel.find({ 'members.userId': userId });
    return projects;
  }

  private findMember(project: IProject, userId: string): IProjectMember | undefined {
    return project.members.find(m => m.userId === userId);
  }

  async inviteUser(projectId: string, inviterId: string, inviteeName: string) {
    const project = await this.getProject(projectId);
    const inviter = this.findMember(project, inviterId);
    if (!hasPermission(inviter?.role, 'invite')) throw new ForbiddenError('Not allowed to invite');

    // check if user with that name exists
    const existingUser = await UserModel.findOne({ name: inviteeName });
    if (existingUser === null) {
      throw new NotFoundError('Invited user not found');
    }

    // check if already a member
    const userUuid = existingUser.get('uuid') ?? (existingUser._id?.toString() ?? '');
    const alreadyMember = project.members.find(m => m.userId === userUuid);
    if (alreadyMember) throw new ConflictError('User already a member');

    // don't duplicate invitations by name
    if (project.invitations.some(inv => inv.name === inviteeName)) {
      throw new ConflictError('Invitation already sent');
    }

    project.invitations.push({ name: inviteeName, invitedBy: inviterId, createdAt: new Date() });
    await project.save();
    return { message: 'Invitation sent', inviteeName };
  }

  async acceptInvitation(projectId: string, userId: string) {
    const project = await this.getProject(projectId);
    const user = await UserModel.findOne({ $or: [{ uuid: userId }, { _id: userId }] });
    if (!user) throw new NotFoundError('User not found');

    const invitationIndex = project.invitations.findIndex(inv => inv.name === user.name);
    if (invitationIndex === -1) throw new NotFoundError('Invitation not found');

    // remove invitation
    project.invitations.splice(invitationIndex, 1);

    // add member as Reader by default
    const publicId = (user.get('uuid') as string | undefined) ?? (user._id ? String(user._id) : '');
    if (project.members.some(m => m.userId === publicId)) {
      // already member (race)
      await project.save();
      return { message: 'Already a member' };
    }
    const username = user.get('username') as string | undefined || 'Unnamed';
    project.members.push({ userId: publicId, username, role: 'Reader' });
    await project.save();
    return { message: 'Invitation accepted', projectId: project.uuid };
  }

  async changeRole(projectId: string, changerId: string, targetUserId: string, newRole: ProjectRole) {
    if (newRole === 'Owner') throw new BadRequestError('Owner role cannot be assigned');

    const project = await this.getProject(projectId);
    const changer = this.findMember(project, changerId);
    if (!changer || !hasPermission(changer.role, 'manage')) throw new ForbiddenError('Not allowed to change roles');

    const target = project.members.find(m => m.userId === targetUserId);
    if (!target) throw new NotFoundError('Target member not found');

    // admins cannot demote other admins
    if (changer.role === 'Administrator' && target.role === 'Administrator' && newRole !== 'Administrator') {
      throw new ForbiddenError('Administrator cannot demote another administrator');
    }

    target.role = newRole;
    await project.save();
    return { message: 'Role updated', userId: targetUserId, role: newRole };
  }

  async deleteProject(projectId: string) {
    const project = await this.getProject(projectId);
    await ProjectModel.deleteOne({ _id: project._id });
    return { message: 'Project deleted', projectId: project.uuid };
  }

  async getInvitationsForUser(userId: string) {
    const user = await UserModel.findOne({ $or: [{ uuid: userId }, { _id: userId }] });
    if (!user) throw new NotFoundError('User not found');

    // find all projects where this user has an invitation
    const projects = await ProjectModel.find({ 'invitations.name': user.name });

    // map to invitation details
    const invitations = projects.map(proj => {

      // find the invitation for this user
      const invitation = proj.invitations.find(inv => inv.name === user.name);
      return invitation ? {
        projectId: proj.uuid,
        projectName: proj.name,
        invitedBy: invitation.invitedBy,
        createdAt: invitation.createdAt,
      } : null;
    }).filter(Boolean);
    return invitations;
  }

  async getSentInvitationsByUser(userId: string) {
    const user = await UserModel.findOne({ $or: [{ uuid: userId }, { _id: userId }] });
    if (!user) throw new NotFoundError('User not found');

    // find all projects where this user has sent invitations
    const projects = await ProjectModel.find({ 'invitations.invitedBy': userId });
    const sentInvitations = projects.flatMap(proj => {
      return proj.invitations.filter(inv => inv.invitedBy === userId).map(inv => ({
        projectId: proj.uuid,
        projectName: proj.name,
        inviteeName: inv.name,
        createdAt: inv.createdAt,
      }));
    });

    return sentInvitations;
  }

  async declineInvitation(projectId: string, userId: string) {
    const project = await this.getProject(projectId);

    // check if user exists
    const user = await UserModel.findOne({ $or: [{ uuid: userId }, { _id: userId }] });
    if (!user) throw new NotFoundError('User not found');

    // find invitation
    const invitationIndex = project.invitations.findIndex(inv => inv.name === user.name);
    if (invitationIndex === -1) throw new NotFoundError('Invitation not found');

    // remove invitation
    project.invitations.splice(invitationIndex, 1);
    await project.save();
    return { message: 'Invitation declined', projectId: project.uuid };
  }

  async revokeInvitation(projectId: string, inviterId: string, inviteeName: string) {
    const project = await this.getProject(projectId);

    // check inviter permissions
    const inviter = this.findMember(project, inviterId);
    if (!hasPermission(inviter?.role, 'invite')) throw new ForbiddenError('Not allowed to revoke invitations');

    // find invitation
    const invitationIndex = project.invitations.findIndex(inv => inv.name === inviteeName);
    if (invitationIndex === -1) throw new NotFoundError('Invitation not found');

    // remove invitation
    project.invitations.splice(invitationIndex, 1);
    await project.save();
    return { message: 'Invitation revoked', inviteeName };
  }

  async removeMember(projectId: string, removerId: string, targetUserId: string) {
    const project = await this.getProject(projectId);

    // check remover permissions
    const remover = this.findMember(project, removerId);
    if (!remover || !hasPermission(remover.role, 'manage')) throw new ForbiddenError('Not allowed to remove members');

    // check target member exists
    const targetIndex = project.members.findIndex(m => m.userId === targetUserId);
    if (targetIndex === -1) throw new NotFoundError('Target member not found');

    // admins cannot remove owners
    const targetMember = project.members[targetIndex];
    if (targetMember.role === 'Owner') {
      throw new ForbiddenError('Cannot remove the owner of the project');
    }

    // admins cannot remove other admins
    if (remover.role === 'Administrator' && targetMember.role === 'Administrator') {
      throw new ForbiddenError('Administrator cannot remove another administrator');
    }

    // remove member
    project.members.splice(targetIndex, 1);
    await project.save();
    return { message: 'Member removed', userId: targetUserId };
  }

  async leaveProject(projectId: string, userId: string) {
    const project = await this.getProject(projectId);

    // check if the user is a member of the project
    const memberIndex = project.members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) throw new NotFoundError('You are not a member of this project');

    // prevent owner from leaving
    const member = project.members[memberIndex];
    if (member.role === 'Owner') {
      throw new ForbiddenError('Owner cannot leave the project. Transfer ownership or delete the project.');
    }

    // remove member
    project.members.splice(memberIndex, 1);
    await project.save();
    return { message: 'Left the project', projectId: project.uuid };
  }

}

export default new ProjectService();

import { Request, Response, NextFunction } from 'express';
import ProjectService from '../services/project.service';

class ProjectController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body ?? {};
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const project = await ProjectService.createProject(name, user.id);
      return res.status(201).json({ message: 'Project created', project });
    } catch (err) {
      next(err);
    }
  }

  async invite(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const { name } = req.body ?? {};
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const result = await ProjectService.inviteUser(projectId, user.id, name);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const result = await ProjectService.acceptInvitation(projectId, user.id);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async changeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      const targetUserId = req.params.memberId;
      const { role } = req.body ?? {};
      const result = await ProjectService.changeRole(projectId, user.id, targetUserId, role);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getProject(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const project = await ProjectService.getProject(projectId);
      return res.status(200).json({ project });
    } catch (err) {
      next(err);
    }
  }

  async getAllProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const projects = await ProjectService.getAllProjectsForUser(user.id);
      return res.status(200).json({ projects });
    } catch (err) {
      next(err);
    }
  }

  async deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const ownerCheck = await ProjectService.getProject(projectId);
      if (ownerCheck.ownerId !== user.id) {
        return res.status(403).json({ message: 'Forbidden: Only owner can delete the project' });
      }
      const result = await ProjectService.deleteProject(projectId);
      return res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async getInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const invitations = await ProjectService.getInvitationsForUser(user.id);
      return res.status(200).json({ invitations });
    }
    catch (err) {
      next(err);
    }
  }

  async getSentInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const invitations = await ProjectService.getSentInvitationsByUser(user.id);
      return res.status(200).json({ invitations });
    }
    catch (err) {
      next(err);
    }
  }

  async decline(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const result = await ProjectService.declineInvitation(projectId, user.id);
      return res.status(200).json(result);
    }
    catch (err) {
      next(err);
    }
  }

  async revokeInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const { name } = req.body ?? {};
      const result = await ProjectService.revokeInvitation(projectId, user.id, name);
      return res.status(200).json(result);
    }
    catch (err) {
      next(err);
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const memberId = req.params.memberId;
      const result = await ProjectService.removeMember(projectId, user.id, memberId);
      return res.status(200).json(result);
    }
    catch (err) {
      next(err);
    }
  }

  async leaveProject(req: Request, res: Response, next: NextFunction) {
    try {
      const projectId = req.params.id;
      const user = (req as any).user;
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const result = await ProjectService.leaveProject(projectId, user.id);
      return res.status(200).json(result);
    }
    catch (err) {
      next(err);
    }
  }
}

export default ProjectController;

import { Request, Response, NextFunction } from 'express';
import { ProjectRole } from '../models/project.model';
import { ProjectService } from '../services/project.service';

interface AuthPayload {
    id: string;
    name: string;
}

interface AuthRequest extends Request {
    user?: AuthPayload;
}

function hasPermission(role: ProjectRole | undefined, action: 'read' | 'write') {
    if (!role) return false;
    if (action === 'write') {
        return role === 'Owner' || role === 'Administrator' || role === 'Contributer';
    }
    if (action === 'read') {
        return true; // all roles can read
    }
    return false;
}

export const permissionMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const projectId = req.params.projectId;
    const action = req.method === 'GET' ? 'read' : 'write';

    // Get project
    const projectService = new ProjectService();
    const project = await projectService.getProject(projectId);
    const member = project.members.find(m => m.userId === user.id);
    if (!hasPermission(member?.role, action)) {
        return res.status(403).json({ message: 'Forbidden: You do not have the required permissions' });
    }
    next();
};

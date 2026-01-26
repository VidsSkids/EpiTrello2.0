import { Request, Response, NextFunction } from 'express';

export const validateCreateProject = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Project name is required' });
  }
  next();
};

export const validateInvite = (req: Request, res: Response, next: NextFunction) => {
  const { name } = req.body ?? {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Invitee name is required' });
  }
  next();
};

export const validateChangeRole = (req: Request, res: Response, next: NextFunction) => {
  const { role } = req.body ?? {};
  const valid = ['Reader', 'Contributer', 'Administrator'];
  if (!role || typeof role !== 'string' || !valid.includes(role)) {
    return res.status(400).json({ message: 'role must be one of: Reader, Contributer, Administrator' });
  }
  next();
};

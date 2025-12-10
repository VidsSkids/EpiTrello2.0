import { Request, Response, NextFunction } from 'express';

function isValidHexColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

export const validateCreateTag = (req: Request, res: Response, next: NextFunction) => {
  const { name, color } = req.body ?? {};
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({ message: 'Tag name is required' });
  }
    if (!color || typeof color !== 'string' || color.trim().length === 0) {
    return res.status(400).json({ message: 'Tag color is required' });
  }
  if (!isValidHexColor(color)) {
    return res.status(400).json({ message: 'Tag color must be a valid hex color code' });
  }
  next();
};

export const validateUpdateTag = (req: Request, res: Response, next: NextFunction) => {
  const { name, color } = req.body ?? {};
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
    return res.status(400).json({ message: 'Tag name must be a non-empty string' });
  }
    if (color !== undefined && (typeof color !== 'string' || color.trim().length === 0)) {
    return res.status(400).json({ message: 'Tag color must be a non-empty string' });
  }
  if (color !== undefined && !isValidHexColor(color)) {
    return res.status(400).json({ message: 'Tag color must be a valid hex color code' });
  }
  next();
};

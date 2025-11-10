import { Request, Response, NextFunction } from 'express';

export const validateColumnCreate = (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body ?? {};
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Column name is required' });
    }
    next();
};

export const validateColumnReorder = (req: Request, res: Response, next: NextFunction) => {
    const { newIndex } = req.body ?? {};
    if (newIndex === undefined || typeof newIndex !== 'number' || newIndex < 0) {
        return res.status(400).json({ message: 'newIndex must be a non-negative number' });
    }
    next();
};

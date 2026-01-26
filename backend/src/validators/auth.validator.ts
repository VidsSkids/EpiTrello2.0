import { Request, Response, NextFunction } from 'express';

export const validateRegister = (req: Request, res: Response, next: NextFunction) => {
    const { name, password } = req.body ?? {};
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ message: 'Name is required' });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
    const { name, password } = req.body ?? {};
    if (!name || !password) return res.status(400).json({ message: 'Name and password are required' });
    next();
};

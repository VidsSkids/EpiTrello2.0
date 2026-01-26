import { Request, Response, NextFunction } from 'express';

export const validateCardCreate = (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.body ?? {};
    if (title === undefined || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: 'Title is required' });
    }
    next();
};

export const validateCardUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { title, description, isDone, dueDate, startDate, assignedTo, tags } = req.body ?? {};

    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
        return res.status(400).json({ message: 'If provided, title must be a non-empty string' });
    }
    if (description !== undefined && typeof description !== 'string') {
        return res.status(400).json({ message: 'If provided, description must be a string' });
    }
    if (isDone !== undefined && typeof isDone !== 'boolean') {
        return res.status(400).json({ message: 'If provided, isDone must be a boolean' });
    }
    if (dueDate !== undefined && isNaN(Date.parse(dueDate))) {
        return res.status(400).json({ message: 'If provided, dueDate must be a valid date' });
    }
    if (startDate !== undefined && isNaN(Date.parse(startDate))) {
        return res.status(400).json({ message: 'If provided, startDate must be a valid date' });
    }
    if (assignedTo !== undefined && !Array.isArray(assignedTo)) {
        return res.status(400).json({ message: 'If provided, assignedTo must be an array of user IDs' });
    }
    if (tags !== undefined && !Array.isArray(tags)) {
        return res.status(400).json({ message: 'If provided, tags must be an array of tag objects' });
    }
    next();
};

export const validateCardReorder = (req: Request, res: Response, next: NextFunction) => {
    const { newIndex, newColumnId } = req.body ?? {};
    if (newIndex === undefined || typeof newIndex !== 'number' || newIndex < 0) {
        return res.status(400).json({ message: 'newIndex must be a non-negative number' });
    }
    if (newColumnId !== undefined && typeof newColumnId !== 'string') {
        return res.status(400).json({ message: 'newColumnId is must be a string if provided' });
    }
    next();
}

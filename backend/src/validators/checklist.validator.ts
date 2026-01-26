import { Request, Response, NextFunction } from 'express';

export const validateChecklistCreate = (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.body ?? {};
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({ message: 'Title is required' });
    }
    next();
};

export const validateChecklistUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { title } = req.body ?? {};
    if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
        return res.status(400).json({ message: 'Title must be a non-empty string' });
    }
    next();
};

export const validateChecklistItemCreate = (req: Request, res: Response, next: NextFunction) => {
    const { content } = req.body ?? {};
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ message: 'Content is required' });
    }
    next();
};

export const validateChecklistItemUpdate = (req: Request, res: Response, next: NextFunction) => {
    const { content, isChecked, dueDate, assignedTo } = req.body ?? {};
    if (content !== undefined && (typeof content !== 'string' || content.trim().length === 0)) {
        return res.status(400).json({ message: 'Content must be a non-empty string' });
    }
    if (isChecked !== undefined && typeof isChecked !== 'boolean') {
        return res.status(400).json({ message: 'isChecked must be a boolean' });
    }
    if (dueDate !== undefined && isNaN(Date.parse(dueDate))) {
        return res.status(400).json({ message: 'dueDate must be a valid date' });
    }
    if (assignedTo !== undefined && !Array.isArray(assignedTo)) {
        return res.status(400).json({ message: 'assignedTo must be an array of user IDs' });
    }
    next();
};

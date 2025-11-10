import { Request, Response, NextFunction } from 'express';
import { ColumnService } from '../services/column.service';

class ColumnController {
    private columnService: ColumnService;

    constructor() {
        this.columnService = new ColumnService();
    }

    public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = req.params.projectId;
            const { name } = req.body;
            const column = await this.columnService.createColumn(projectId, name);
            res.status(201).json({ message: 'Column created successfully', column });
        } catch (error) {
            next(error);
        }
    }

    public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            await this.columnService.deleteColumn(projectId, columnId);
            res.status(200).json({ message: 'Column deleted successfully' });
        } catch (error) {
            next(error);
        }
    }

    public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const { name } = req.body;
            const updatedColumn = await this.columnService.updateColumn(projectId, columnId, name);
            res.status(200).json(updatedColumn);
        } catch (error) {
            next(error);
        }
    }

    public async reorder(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const { newIndex } = req.body;
            const reorderedColumn = await this.columnService.reorderColumn(projectId, columnId, newIndex);
            res.status(200).json({ message: 'Column reordered successfully', reorderedColumn });
        } catch (error) {
            next(error);
        }
    }
}

export default new ColumnController();

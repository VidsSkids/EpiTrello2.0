import { Request, Response, NextFunction } from 'express';
import { ChecklistService } from "../services/checklist.service";
import { UserService } from '../services/user.service';
import { ICardChecklistItem } from '../models/card.model';

class CheckListController {

    private checklistService: ChecklistService;
    private userService: UserService;

    constructor() {
        this.checklistService = new ChecklistService();
        this.userService = new UserService();
    }

    async createChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            const { title } = req.body;
            const newChecklist = await this.checklistService.createChecklist(projectId, columnId, cardId, title);
            res.status(201).json({ message: 'Checklist successfully created', newChecklist });
        } catch (err: unknown) {
            next(err);
        }
    }

    async deleteChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            const checklistId = req.params.checklistId;
            await this.checklistService.deleteChecklist(projectId, columnId, cardId, checklistId);
            res.status(204).send();
        } catch (err: unknown) {
            next(err);
        }
    }

    async updateChecklist(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            const checklistId = req.params.checklistId;
            const updateData = req.body;
            const updatedChecklist = await this.checklistService.updateChecklist(projectId, columnId, cardId, checklistId, updateData);
            res.status(200).json({ message: 'Checklist successfully updated', updatedChecklist });
        }
        catch (err: unknown) {
            next(err);
        }
    }

    async createChecklistItem(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            const checklistId = req.params.checklistId;
            const { content } = req.body;
            const newItem = await this.checklistService.createChecklistItem(projectId, columnId, cardId, checklistId, content);
            res.status(201).json({ message: 'Checklist item successfully created', newItem });
        } catch (err: unknown) {
            next(err);
        }
    }

    async updateChecklistItem(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            const checklistId = req.params.checklistId;
            const itemId = req.params.itemId;
            const updateData: Partial<ICardChecklistItem> = req.body;
            if (updateData.assignedTo !== undefined) {
                for (const userId of updateData.assignedTo) {
                    try {
                        await this.userService.getUserById(userId);
                    } catch (err) {
                        return next(err);
                    }
                }
            }
            const updatedItem = await this.checklistService.updateChecklistItem(projectId, columnId, cardId, checklistId, itemId, updateData);
            res.status(200).json({ message: 'Checklist item successfully updated', updatedItem });
        } catch (err: unknown) {
            next(err);
        }
    }

    async deleteChecklistItem(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            const checklistId = req.params.checklistId;
            const itemId = req.params.itemId;
            await this.checklistService.deleteChecklistItem(projectId, columnId, cardId, checklistId, itemId);
            res.status(204).send();
        } catch (err: unknown) {
            next(err);
        }
    }

}

export default CheckListController;

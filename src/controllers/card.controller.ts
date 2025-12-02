import { Request, Response, NextFunction } from 'express';
import { CardService } from '../services/card.service';
import { UserService } from '../services/user.service';
import { IProjectCard } from '../models/card.model';

class CardController {
    private cardService: CardService;
    private userService: UserService;

    constructor() {
        this.cardService = new CardService();
        this.userService = new UserService();
    }

    async create(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const { title } = req.body;
            const newCard = await this.cardService.createCard(projectId, columnId, title);
            res.status(201).json({ message: 'Card successfully created', newCard });
        } catch (err: unknown) {
            next(err);
        }
    }

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            await this.cardService.deleteCard(projectId, columnId, cardId);
            res.status(204).send();
        } catch (err: unknown) {
            next(err);
        }
    }

    async update(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            const updateData: Partial<IProjectCard> = req.body;
            if (updateData.assignedTo !== undefined) {
                for (const userId of updateData.assignedTo) {
                    try {
                        await this.userService.getUserById(userId);
                    } catch (err) {
                        return next(err);
                    }
                }
            }
            const updatedCard = await this.cardService.updateCard(projectId, columnId, cardId, updateData);
            res.status(200).json({ message: 'Card successfully updated', updatedCard });
        } catch (err: unknown) {
            next(err);
        }
    }

    async toggleDone(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            const updatedCard = await this.cardService.toggleCardDone(projectId, columnId, cardId);
            res.status(200).json({ message: 'Card status successfully toggled', updatedCard });
        } catch (err: unknown) {
            next(err);
        }
    }

    async reorder(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const columnId = req.params.columnId;
            const cardId = req.params.cardId;
            const { newIndex, newColumnId } = req.body;
            await this.cardService.reorderCard(projectId, columnId, cardId, newIndex, newColumnId);
            res.status(200).json({ message: 'Card successfully reordered' });
        } catch (err: unknown) {
            next(err);
        }
    }
}

export default CardController

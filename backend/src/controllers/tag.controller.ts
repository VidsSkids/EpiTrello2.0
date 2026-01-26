import { NextFunction, Request, Response } from "express";
import { TagService } from "../services/tag.service";

class TagController {
    private tagService: TagService;

    constructor() {
        this.tagService = new TagService();
    }

    async createTag(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const { name, color } = req.body;
            const newTag = await this.tagService.createTag(projectId, name, color);
            res.status(201).json({ message: 'Tag successfully created', newTag });
        } catch (err: unknown) {
            next(err);
        }
    }

    async updateTag(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const tagId = req.params.tagId;
            const updateData = req.body;
            const updatedTag = await this.tagService.updateTag(projectId, tagId, updateData);
            res.status(200).json({ message: 'Tag successfully updated', updatedTag });
        } catch (err: unknown) {
            next(err);
        }
    }

    async deleteTag(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const tagId = req.params.tagId;
            await this.tagService.deleteTag(projectId, tagId);
            res.status(200).json({ message: 'Tag successfully deleted' });
        } catch (err: unknown) {
            next(err);
        }
    }

    async assignTagToCard(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const cardId = req.params.cardId;
            const tagId = req.params.tagId;
            const result = await this.tagService.assignTagToCard(projectId, cardId, tagId);
            res.status(200).json({ message: 'Tag successfully assigned to card', result });
        } catch (err: unknown) {
            next(err);
        }
    }

    async removeTagFromCard(req: Request, res: Response, next: NextFunction) {
        try {
            const projectId = req.params.projectId;
            const cardId = req.params.cardId;
            const tagId = req.params.tagId;
            const result = await this.tagService.removeTagFromCard(projectId, cardId, tagId);
            res.status(200).json({ message: 'Tag successfully removed from card', result });
        } catch (err: unknown) {
            next(err);
        }
    }
}

export default TagController;

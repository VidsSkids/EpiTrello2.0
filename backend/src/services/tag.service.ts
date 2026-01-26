import { Types } from "mongoose";
import { ProjectService } from "./project.service";
import { ConflictError, NotFoundError } from "../errors";


export class TagService {

    private ProjectService: ProjectService;

    constructor() {
        this.ProjectService = new ProjectService();
    }

    async createTag(projectId: string, name: string, color: string) {
        const project = await this.ProjectService.getProject(projectId);
        if (!project) {
            throw new NotFoundError('Project not found');
        }
        if (project.tags.some(t => t.name === name)) {
            throw new ConflictError('Tag name already exists');
        }
        const newTag = {
            _id: new Types.ObjectId(),
            name,
            color,
            createdAt: new Date()
        };
        project.tags.push(newTag);
        project.save();
        return newTag;
    }

    async deleteTag(projectId: string, tagId: string) {
        const project = await this.ProjectService.getProject(projectId);
        project.tags = project.tags.filter(tag => tag._id.toString() !== tagId);

        // Also remove the tag from all cards
        for (const column of project.columns) {
            for (const card of column.cards || []) {
                card.tagIds = card.tagIds.filter(tid => tid !== tagId);
            }
        }
        await project.save();
    }

    async updateTag(projectId: string, tagId: string, updateData: Partial<{ name: string; color: string }>) {
        const project = await this.ProjectService.getProject(projectId);
        const tag = project.tags.find(t => t._id.toString() === tagId);
        if (!tag) {
            throw new Error('Tag not found');
        }
        if (updateData.name !== undefined) {
            tag.name = updateData.name;
        }
        if (updateData.color !== undefined) {
            tag.color = updateData.color;
        }
        await project.save();
        return tag;
    }

    async assignTagToCard(projectId: string, cardId: string, tagId: string) {
        const project = await this.ProjectService.getProject(projectId);
        for (const column of project.columns) {
            const card = column.cards?.find(c => c._id.toString() === cardId);
            if (card) {
                if (!card.tagIds.includes(tagId)) {
                    // Check if tag exists in project
                    const tagExists = project.tags.some(t => t._id.toString() === tagId);
                    if (!tagExists) {
                        throw new NotFoundError('Tag not found in project');
                    }
                    card.tagIds.push(tagId);
                    await project.save();
                }
            }
        }
    }

    async removeTagFromCard(projectId: string, cardId: string, tagId: string) {
        const project = await this.ProjectService.getProject(projectId);
        for (const column of project.columns) {
            const card = column.cards?.find(c => c._id.toString() === cardId);
            if (card) {
                card.tagIds = card.tagIds.filter(tid => tid !== tagId);
                await project.save();
            }
        }
    }
}

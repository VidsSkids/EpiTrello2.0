import { NotFoundError } from "../errors";
import { IProjectCard } from "../models/card.model";
import { ProjectService } from "./project.service"
import mongoose from "mongoose";

export class CardService {

    private projectService: ProjectService;

    constructor() {
        this.projectService = new ProjectService();
    }

    // Helper to get project and column
    private async getProjectWithColumn(projectId: string, columnId: string) {

        // Fetch the project
        const project = await this.projectService.getProject(projectId);

        // Find the column
        const column = project.columns.find(col => col._id.toString() === columnId);
        if (!column) {
            throw new NotFoundError('Column not found');
        }
        return { project, column };
    }

    // Create a new card in a project's column
    async createCard(projectId: string, columnId: string, cardName: string) {
        const { project, column } = await this.getProjectWithColumn(projectId, columnId);
        // Add the new card
        const newCard: IProjectCard = {
            title: cardName,
            description: '',
            isDone: false,
            tagIds: [],
            checklists: [],
            createdAt: new Date(),
            _id: new mongoose.Types.ObjectId()
        };
        column.cards!.push(newCard);
        await project.save();
        return column.cards![column.cards!.length - 1];
    }

    async getCard(projectId: string, columnId: string, cardId: string) {
        const { column } = await this.getProjectWithColumn(projectId, columnId);
        const card = column.cards!.find(card => card._id.toString() === cardId);
        if (!card) {
            throw new NotFoundError('Card not found');
        }
        return card;
    }

    // Delete a card from a project's column
    async deleteCard(projectId: string, columnId: string, cardId: string) {
        const { project, column } = await this.getProjectWithColumn(projectId, columnId);

        column.cards = column.cards!.filter(card => card._id.toString() !== cardId);
        await project.save();
    }

    async reorderCard(projectId: string, columnId: string, cardId: string, newIndex: number, newColumnId?: string) {
        const { project, column } = await this.getProjectWithColumn(projectId, columnId);

        // Find the card to move
        const cardIndex = column.cards!.findIndex(card => card._id.toString() === cardId);
        if (cardIndex === -1) {
            throw new NotFoundError('Card not found');
        }
        const [cardToMove] = column.cards!.splice(cardIndex, 1);

        if (newColumnId && newColumnId !== columnId) {
            // Moving to a different column
            const newColumn = project.columns.find(col => col._id.toString() === newColumnId);
            if (!newColumn) {
                throw new NotFoundError('Target column not found');
            }
            newColumn.cards!.splice(newIndex, 0, cardToMove);
        } else {
            // Reordering within the same column
            column.cards!.splice(newIndex, 0, cardToMove);
        }
        await project.save();
    }

    // Update card details
    async updateCard(projectId: string, columnId: string, cardId: string, updates: Partial<IProjectCard>) {
        const { project, column } = await this.getProjectWithColumn(projectId, columnId);
        const card = column.cards!.find(card => card._id.toString() === cardId);
        if (!card) {
            throw new NotFoundError('Card not found');
        }
        // Apply updates
        Object.assign(card, updates);
        await project.save();
        return card;
    }

    async toggleCardDone(projectId: string, columnId: string, cardId: string) {
        const { project, column } = await this.getProjectWithColumn(projectId, columnId);
        const card = column.cards!.find(card => card._id.toString() === cardId);
        if (!card) {
            throw new NotFoundError('Card not found');
        }
        card.isDone = !card.isDone;
        await project.save();
        return card;
    }
}

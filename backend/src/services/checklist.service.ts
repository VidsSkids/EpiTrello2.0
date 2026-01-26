import { Types } from "mongoose";

import { ICardChecklist, ICardChecklistItem } from "../models/card.model";
import { CardService } from "./card.service";

export class ChecklistService {

    private cardService: CardService;

    constructor() {
        this.cardService = new CardService();
    }

    async createChecklist(projectId: string, columnId: string, cardId: string, title: string) {
        const card = await this.cardService.getCard(projectId, columnId, cardId);
        const newChecklist: ICardChecklist = {
            _id: new Types.ObjectId(),
            title,
            items: []
        };
        card.checklists.push(newChecklist);
        await this.cardService.updateCard(projectId, columnId, cardId, { checklists: card.checklists });
        return newChecklist;
    }

    async deleteChecklist(projectId: string, columnId: string, cardId: string, checklistId: string) {
        const card = await this.cardService.getCard(projectId, columnId, cardId);
        card.checklists = card.checklists.filter(checklist => checklist._id.toString() !== checklistId);
        await this.cardService.updateCard(projectId, columnId, cardId, { checklists: card.checklists });
    }

    async updateChecklist(projectId: string, columnId: string, cardId: string, checklistId: string, updateData: Partial<ICardChecklist>) {
        const card = await this.cardService.getCard(projectId, columnId, cardId);
        const checklist = card.checklists.find(cl => cl._id.toString() === checklistId);
        if (!checklist) {
            throw new Error('Checklist not found');
        }
        Object.assign(checklist, updateData);
        await this.cardService.updateCard(projectId, columnId, cardId, { checklists: card.checklists });
        return checklist;
    }

    async createChecklistItem(projectId: string, columnId: string, cardId: string, checklistId: string, content: string) {
        const card = await this.cardService.getCard(projectId, columnId, cardId);
        const checklist = card.checklists.find(cl => cl._id.toString() === checklistId);
        if (!checklist) {
            throw new Error('Checklist not found');
        }
        const newItem: ICardChecklistItem = {
            _id: new Types.ObjectId(),
            content,
            isChecked: false
        };
        checklist.items.push(newItem);
        await this.cardService.updateCard(projectId, columnId, cardId, { checklists: card.checklists });
        return newItem;
    }

    async updateChecklistItem(projectId: string, columnId: string, cardId: string, checklistId: string, itemId: string, updateData: Partial<ICardChecklistItem>) {
        const card = await this.cardService.getCard(projectId, columnId, cardId);
        const checklist = card.checklists.find(cl => cl._id.toString() === checklistId);
        if (!checklist) {
            throw new Error('Checklist not found');
        }
        const item = checklist.items.find(i => i._id.toString() === itemId);
        if (!item) {
            throw new Error('Checklist item not found');
        }
        Object.assign(item, updateData);
        await this.cardService.updateCard(projectId, columnId, cardId, { checklists: card.checklists });
        return item;
    }

    async deleteChecklistItem(projectId: string, columnId: string, cardId: string, checklistId: string, itemId: string) {
        const card = await this.cardService.getCard(projectId, columnId, cardId);
        const checklist = card.checklists.find(cl => cl._id.toString() === checklistId);
        if (!checklist) {
            throw new Error('Checklist not found');
        }
        checklist.items = checklist.items.filter(i => i._id.toString() !== itemId);
        await this.cardService.updateCard(projectId, columnId, cardId, { checklists: card.checklists });
    }
}

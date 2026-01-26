import { ProjectService } from "./project.service"
import mongoose from "mongoose";

export class ColumnService {

    private projectService: ProjectService;

    constructor() {
        this.projectService = new ProjectService();
    }

    // Create a new column in a project
    async createColumn(projectId: string, columnName: string) {

        // Fetch the project
        const project = await this.projectService.getProject(projectId);

        // Add the new column
        project.columns.push({ name: columnName, createdAt: new Date(), _id: new mongoose.Types.ObjectId() });
        await project.save();
        return project.columns[project.columns.length - 1];
    }

    // Delete a column from a project
    async deleteColumn(projectId: string, columnId: string) {
        const project = await this.projectService.getProject(projectId);
        project.columns = project.columns.filter(col => col._id.toString() !== columnId);
        await project.save();
    }

    // Update a column's name in a project
    async updateColumn(projectId: string, columnId: string, newName: string) {
        const column = (await this.projectService.getProject(projectId)).columns.find(col => col._id.toString() === columnId);
        if (column) {
            column.name = newName;
            await (await this.projectService.getProject(projectId)).save();
        } else {
            throw new Error('Column not found');
        }
        return column;
    }

    async reorderColumn(projectId: string, columnId: string, newPosition: number) {
        const project = await this.projectService.getProject(projectId);
        const columnIndex = project.columns.findIndex(col => col._id.toString() === columnId);
        if (columnIndex === -1) {
            throw new Error('Column not found');
        }
        if (newPosition < 0 || newPosition >= project.columns.length) {
            throw new Error('Invalid new position');
        }
        const [column] = project.columns.splice(columnIndex, 1);
        project.columns.splice(newPosition, 0, column);
        await project.save();
        return project.columns;
    }
}

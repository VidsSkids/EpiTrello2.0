import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule
  ],
  template: `
    <h2 mat-dialog-title>Create New Board</h2>
    <div mat-dialog-content>
      <mat-form-field appearance="outline" style="width: 100%;">
        <mat-label>Board Title</mat-label>
        <input matInput [(ngModel)]="boardTitle" placeholder="Enter board title" required>
      </mat-form-field>
    </div>
    <div mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!boardTitle" (click)="onSubmit()">Create</button>
    </div>
  `
})
export class CreateBoardDialogComponent {
  boardTitle: string = '';

  constructor(
    public dialogRef: MatDialogRef<CreateBoardDialogComponent>
  ) {}

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.boardTitle.trim()) {
      this.dialogRef.close(this.boardTitle);
    }
  }
}
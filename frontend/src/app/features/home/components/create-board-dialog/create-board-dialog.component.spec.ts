import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CreateBoardDialogComponent } from './create-board-dialog.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '@features/auth/services/auth.service';

describe('CreateBoardDialogComponent', () => {
  let component: CreateBoardDialogComponent;
  let fixture: ComponentFixture<CreateBoardDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBoardDialogComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), { provide: AuthService, useValue: { getToken: () => null } }, { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } }, { provide: MAT_DIALOG_DATA, useValue: {} }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateBoardDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

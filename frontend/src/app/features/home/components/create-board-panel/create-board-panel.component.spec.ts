import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CreateBoardPanelComponent } from './create-board-panel.component';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '@features/auth/services/auth.service';

describe('CreateBoardPanelComponent', () => {
  let component: CreateBoardPanelComponent;
  let fixture: ComponentFixture<CreateBoardPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateBoardPanelComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), { provide: AuthService, useValue: { getToken: () => null } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateBoardPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

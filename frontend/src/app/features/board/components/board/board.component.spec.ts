import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { BoardComponent } from './board.component';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '@features/auth/services/auth.service';
import { provideRouter } from '@angular/router';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), { provide: AuthService, useValue: { getToken: () => null } }, provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

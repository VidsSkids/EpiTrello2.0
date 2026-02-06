import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { CardComponent } from './card.component';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '@features/auth/services/auth.service';

describe('CardComponent', () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), { provide: AuthService, useValue: { getToken: () => null } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    (component as any).card = { id: 'c1', title: 'Test', description: '', listId: 'l1', priority: 0 } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

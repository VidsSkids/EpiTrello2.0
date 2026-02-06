import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '@features/auth/services/auth.service';

import { BoardService } from './board.service';

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), { provide: AuthService, useValue: { getToken: () => null } }]
    });
    service = TestBed.inject(BoardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

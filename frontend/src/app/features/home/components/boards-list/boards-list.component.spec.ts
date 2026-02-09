import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';

import { BoardsListComponent } from './boards-list.component';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '@features/auth/services/auth.service';
import { BoardService } from '@features/board/services/board.service';
import { of } from 'rxjs';

describe('BoardsListComponent', () => {
  let component: BoardsListComponent;
  let fixture: ComponentFixture<BoardsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardsListComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        { provide: AuthService, useValue: { getToken: () => null } },
        { provide: BoardService, useValue: { boards$: of([]), loadBoards: jasmine.createSpy('loadBoards').and.returnValue(of([])), loadProjectsFromServer: jasmine.createSpy('loadProjectsFromServer').and.returnValue(of([])) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

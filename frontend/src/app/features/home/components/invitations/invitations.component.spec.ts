import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, EMPTY } from 'rxjs';
import { InvitationsComponent } from './invitations.component';
import { BoardService } from '@features/board/services/board.service';
import { provideHttpClient } from '@angular/common/http';

describe('InvitationsComponent Integration', () => {
  let component: InvitationsComponent;
  let fixture: ComponentFixture<InvitationsComponent>;
  let boardSpy: any;

  beforeEach(async () => {
    boardSpy = {
      invitationsReceived$: EMPTY,
      invitationsSent$: EMPTY,
      loadInvitationsReceived: jasmine.createSpy('loadInvitationsReceived').and.returnValue(of([])),
      loadInvitationsSent: jasmine.createSpy('loadInvitationsSent').and.returnValue(of([])),
      acceptInvitation: jasmine.createSpy('acceptInvitation').and.returnValue(of({})),
      declineInvitation: jasmine.createSpy('declineInvitation').and.returnValue(of({})),
      revokeInvitation: jasmine.createSpy('revokeInvitation').and.returnValue(of({}))
    };

    await TestBed.configureTestingModule({
      imports: [InvitationsComponent],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), { provide: BoardService, useValue: boardSpy }]
    , teardown: { destroyAfterEach: false } }).compileComponents();

    fixture = TestBed.createComponent(InvitationsComponent);
    component = fixture.componentInstance;
    (component as any).cdr = { detectChanges: () => {} } as any;
    fixture.detectChanges();
  });

  it('loads invitations on init', () => {
    expect(boardSpy.loadInvitationsReceived).toHaveBeenCalled();
    expect(boardSpy.loadInvitationsSent).toHaveBeenCalled();
  });

  it('accepts an invitation and updates list', () => {
    component.received = [{ projectId: 'p1', id: 'i1', projectName: 'Proj' }];
    component.accept({ projectId: 'p1', id: 'i1' });
    expect(boardSpy.acceptInvitation).toHaveBeenCalledWith('p1');
  });

  it('declines an invitation', () => {
    component.received = [{ projectId: 'p2', id: 'i2', projectName: 'Proj2' }];
    component.decline({ projectId: 'p2', id: 'i2' });
    expect(boardSpy.declineInvitation).toHaveBeenCalledWith('p2');
  });

  it('revokes a sent invitation', () => {
    component.sent = [{ projectId: 'p3', id: 'i3', projectName: 'Proj3' }];
    component.revoke({ projectId: 'p3', id: 'i3' });
    expect(boardSpy.revokeInvitation).toHaveBeenCalledWith('p3');
  });
});

import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { environment } from '@environments/environment.development';
import { lastValueFrom } from 'rxjs';
import { BoardService } from '@features/board/services/board.service';

interface InvitationItem {
  id?: string;
  projectId?: string;
  projectName?: string;
  inviteeName?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-invitations',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatGridListModule
  ],
  templateUrl: './invitations.component.html',
  styleUrl: './invitations.component.css'
})
export class InvitationsComponent {
  loading = false;
  error: string | null = null;
  received: InvitationItem[] = [];
  sent: InvitationItem[] = [];

  private readonly baseUrl = `${environment.apiURL}/projects`;

  constructor(private http: HttpClient, private boardService: BoardService, private cdr: ChangeDetectorRef) {
    this.boardService.invitationsReceived$.subscribe((list) => {
      this.received = list || [];
      this.cdr.detectChanges();
    });
    this.boardService.invitationsSent$.subscribe((list) => {
      this.sent = list || [];
      this.cdr.detectChanges();
    });
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = null;
    Promise.all([
      lastValueFrom(this.boardService.loadInvitationsReceived()),
      lastValueFrom(this.boardService.loadInvitationsSent())
    ])
      .then(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
      .catch((err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Échec du chargement des invitations';
        console.error('Failed to load invitations', err);
        this.cdr.detectChanges();
      });
  }

  accept(item: InvitationItem): void {
    const id = item.projectId || '';
    if (!id) return;
    this.boardService.acceptInvitation(id).subscribe({
      next: () => {
        this.received = this.received.filter((it) => it !== item);
        this.cdr.detectChanges();
        this.refresh();
      },
      error: (err) => {
        this.error = err?.error?.message || "Échec de l'acceptation";
        console.error('Failed to accept invitation', err);
        this.cdr.detectChanges();
      }
    });
  }

  decline(item: InvitationItem): void {
    const id = item.projectId || '';
    if (!id) return;
    this.boardService.declineInvitation(id).subscribe({
      next: () => {
        this.received = this.received.filter((it) => it !== item);
        this.cdr.detectChanges();
        this.refresh();
      },
      error: (err) => {
        this.error = err?.error?.message || "Échec du refus";
        console.error('Failed to decline invitation', err);
        this.cdr.detectChanges();
      }
    });
  }

  revoke(item: InvitationItem): void {
    const id = item.projectId || '';
    console.log('revoke', { id, item });
    if (!id) return;
    this.boardService.revokeInvitation(id).subscribe({
      next: () => { 
        this.sent = this.sent.filter((it) => it !== item);
        this.cdr.detectChanges();
        this.refresh(); 
      },
      error: (err) => {
        this.error = err?.error?.message || "Échec de la révocation";
        console.error('Failed to revoke invitation', err);
        this.cdr.detectChanges();
      }
    });
  }
}

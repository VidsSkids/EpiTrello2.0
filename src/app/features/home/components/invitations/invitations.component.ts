import { Component } from '@angular/core';
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

  constructor(private http: HttpClient, private boardService: BoardService) {
    this.boardService.invitationsReceived$.subscribe((list) => (this.received = list || []));
    this.boardService.invitationsSent$.subscribe((list) => (this.sent = list || []));
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
      })
      .catch((err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Échec du chargement des invitations';
      });
  }

  accept(item: InvitationItem): void {
    const id = item.projectId || '';
    if (!id) return;
    this.http.post(`${this.baseUrl}/${id}/accept`, {}).subscribe({
      next: () => this.refresh(),
      error: (err) => (this.error = err?.error?.message || "Échec de l'acceptation")
    });
  }

  decline(item: InvitationItem): void {
    const id = item.projectId || '';
    if (!id) return;
    this.http.post(`${this.baseUrl}/${id}/decline`, {}).subscribe({
      next: () => this.refresh(),
      error: (err) => (this.error = err?.error?.message || "Échec du refus")
    });
  }

  revoke(item: InvitationItem): void {
    const id = item.projectId || '';
    if (!id) return;
    this.http.post(`${this.baseUrl}/projects/${id}/revokeInvitation`, {}).subscribe({
      next: () => this.refresh(),
      error: (err) => (this.error = err?.error?.message || "Échec de la révocation")
    });
  }
}

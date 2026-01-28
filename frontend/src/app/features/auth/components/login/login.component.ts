import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service';
import { BoardService } from '@features/board/services/board.service';
import { LoginRequest } from '../../models/auth';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  name = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router, private route: ActivatedRoute, private boardService: BoardService) { }

  loginWithGoogle(): void {
    window.location.href = `${this.auth.getApiUrl()}/auth/google`;
  }

  submit(): void {
    this.error = null;
    const payload: LoginRequest = { name: this.name, password: this.password };
    this.loading = true;
    this.auth.login(payload).subscribe({
      next: () => {
        this.loading = false;
        this.boardService.preloadWorkspaceData().subscribe({
          next: () => {
            const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
            this.router.navigate([redirectTo || '/']);
          },
          error: () => {
            const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo');
            this.router.navigate([redirectTo || '/']);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Échec de la connexion';
      }
    });
  }
}

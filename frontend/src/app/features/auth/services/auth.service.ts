import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../models/auth';
import { environment } from '@environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly baseUrl = `${environment.apiURL}/auth`;
  private readonly http = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  getApiUrl(): string {
    return environment.apiURL;
  }

  login(payload: LoginRequest): Observable<LoginResponse> {
    console.log('API:login:req');
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/login`, payload)
      .pipe(
        tap((res) => {
          if (res?.token) {
            this.setToken(res.token);
          }
          console.log('API:login:success');
        }),
        catchError((err) => {
          console.error('API:login:error', err);
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    this.clearToken();
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    console.log('API:register:req');
    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/register`, payload)
      .pipe(
        tap((res) => {
          if (res?.token) {
            this.setToken(res.token);
          }
          console.log('API:register:success');
        })
      );
  }
 
  loginWithGoogle(): void {
    if (!this.isBrowser) return;
    window.location.href = `${this.baseUrl}/google`;
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError((err) => {
        console.error('API:deleteUser:error', err);
        return throwError(() => err);
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const parts = token.split('.');
    if (parts.length < 2) return false;
    try {
      // eslint-disable-next-line no-undef
      if (typeof atob === 'undefined') return false;
      const payload = JSON.parse(atob(parts[1]));
      const exp = payload?.exp;
      if (typeof exp !== 'number') return false;
      const nowSec = Math.floor(Date.now() / 1000);
      return exp > nowSec;
    } catch {
      return false;
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private clearToken(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(this.TOKEN_KEY);
  }
}

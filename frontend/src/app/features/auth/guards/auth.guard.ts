import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isTokenValid()) {
    return true;
  }
  auth.logout();
  return router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
};

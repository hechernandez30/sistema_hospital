import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowed = route.data['roles'] as string[] | undefined;
  if (!allowed?.length) {
    return true;
  }
  if (auth.hasAnyRole(allowed)) {
    return true;
  }
  void router.navigate(['/app/panel']);
  return false;
};

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ShellStateService } from '../services/shell-state.service';

export const authGuard: CanActivateFn = () => {
  const shell  = inject(ShellStateService);
  const router = inject(Router);

  if (shell.usuarioActivo() !== null) {
    return true;
  }

  // Sin sesión → redirigir a página de login (pendiente en MVP)
  return router.createUrlTree(['/login']);
};

import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import type { RolSlug } from '../../pages/modules/accesos/models/acceso.model';
import { ShellStateService } from '../services/shell-state.service';
import { ToastService } from '../../shared/ui/toast/toast.service';

/**
 * Guard funcional de fábrica para control de roles.
 *
 * Uso en rutas:
 * ```typescript
 * canActivate: [roleGuard('admin-sistema')]
 * ```
 *
 * Si el rol del usuario no coincide, redirige a /admin/dashboard.
 * Regla: un rol más permisivo incluye los roles menos permisivos.
 * Jerarquía: admin-sistema > admin-general > supervisor-area
 */
export function roleGuard(rolRequerido: RolSlug): CanActivateFn {
  return () => {
    const shell  = inject(ShellStateService);
    const router = inject(Router);
    const toast  = inject(ToastService);

    const usuario = shell.usuarioActivo();

    if (!usuario) {
      return router.createUrlTree(['/login']);
    }

    const jerarquia: RolSlug[] = [
      'admin-sistema',
      'admin-general',
      'supervisor-area',
    ];

    const indexUsuario   = jerarquia.indexOf(usuario.rol);
    const indexRequerido = jerarquia.indexOf(rolRequerido);

    // El usuario tiene el nivel requerido o superior
    if (indexUsuario !== -1 && indexUsuario <= indexRequerido) {
      return true;
    }

    // Sin permiso → aviso + redirigir a dashboard (F2-06)
    toast.advertencia(
      'Acceso denegado',
      'No tienes permisos para acceder a esta sección.'
    );
    return router.createUrlTree(['/inicio/dashboard']);
  };
}

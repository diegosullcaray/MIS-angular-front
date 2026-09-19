import type { UsuarioActivo } from '../../core/interfaces/shell-state.model';

/** Cambios de identidad, permisos o fecha invalidan datos mantenidos por una fachada. */
export function identidadConsulta(usuario: UsuarioActivo | null): string {
  return JSON.stringify([
    usuario?.id,
    usuario?.email,
    usuario?.codBt,
    usuario?.rol,
    usuario?.fechaCorte,
  ]);
}

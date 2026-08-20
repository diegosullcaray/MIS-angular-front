import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';

export interface SesionPersistida {
    token: string; // El session_id o token devuelto por Winder
    usuario: UsuarioActivo;
    /** Epoch ms a partir del cual la sesión deja de ser válida. */
    expiraEn: number;
    /** Usuarios alternos disponibles para `usuario` (backend, `alternates`). */
    alternates?: AlternateUsuario[];
    /** Identidad original mientras `usuario` es un usuario alterno (ver `cambiarAUsuarioAlterno`). */
    usuarioOriginal?: UsuarioActivo;
}

export interface AlternateUsuario {
  email: string;
  nombre: string;
  cargo?: string;
}

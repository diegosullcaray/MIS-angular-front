/**
 * Un "usuario alterno" al que el usuario actual está autorizado a cambiarse
 * (`login_response.alternates` del backend Ant, ver `ModSysLoginService.altLogin`).
 * Migrado del STG (`AltUserDialogComponent`, `UserService.get('alternates')`).
 */
export interface AlternateUsuario {
  email: string;
  nombre: string;
  cargo?: string;
}

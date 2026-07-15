import { Injectable, computed, signal } from '@angular/core';

// ─── Contrato de tipos con el Host (copia 1:1 de ShellStateService) ──────────
// Fuente: mis-host/src/app/core/services/shell-state.service.ts
// Cuando exista el paquete compartido `@confianza/mis-shell` (guía 08 §4.6),
// estos tipos y este servicio se reemplazan por los del paquete.

export type RolSlug = 'admin-sistema' | 'admin-general' | 'supervisor-area';

export interface UsuarioActivo {
  id: string;
  nombre: string;
  email: string;
  rol: RolSlug;
  /** Slugs de Remotes habilitados para este usuario */
  subsistemas: string[];
  avatarUrl?: string;
}

interface SesionPersistida {
  token: string;
  usuario: UsuarioActivo;
}

/** Clave que usa el AuthService del Host para persistir la sesión (F5-safe). */
const SESSION_KEY = 'mis.sesion';

/**
 * ★ SLUG de este subsistema — DEBE coincidir con el `name` de
 * federation.config.mjs y con el registro en Gestión de Sistemas del Host.
 * AL CLONAR LA PLANTILLA: reemplazar por el slug asignado.
 */
export const SLUG_SUBSISTEMA = 'subsistema-plantilla';

/**
 * ShellContractService — lado REMOTE del contrato Host ↔ Remote (RN-03).
 *
 * El remote SOLO LEE el estado publicado por el Host; jamás lo muta.
 * Mecanismo oficial mientras no exista `@confianza/mis-shell`: el Host
 * persiste `{ token, usuario }` en sessionStorage (`mis.sesion`) del dominio
 * de la shell; como el remote se ejecuta embebido en ese mismo dominio
 * (loadRemoteModule — sin iframes, RN-04), puede leerla de forma segura.
 *
 * PROHIBIDO (revisión de integración):
 *  - Escribir/borrar `mis.sesion` u otro estado del Host.
 *  - Invocar setters del ShellStateService del Host.
 *  - Llamar APIs del Host (/api/v1/*) desde el remote.
 */
@Injectable({ providedIn: 'root' })
export class ShellContractService {

  // ─── Estado (solo lectura hacia fuera) ───────────────────────────────────

  private readonly _token = signal<string | null>(null);
  private readonly _usuarioActivo = signal<UsuarioActivo | null>(null);

  /** JWT emitido por el Host — adjuntarlo SOLO al backend propio (§4.7 guía 08). */
  readonly token = this._token.asReadonly();

  /** Usuario autenticado en la shell (null en desarrollo aislado sin sesión). */
  readonly usuarioActivo = this._usuarioActivo.asReadonly();

  // ─── Computed (mismos nombres que el ShellStateService del Host) ─────────

  readonly esAdminSistema = computed(
    () => this._usuarioActivo()?.rol === 'admin-sistema'
  );

  readonly esAdmin = computed(() =>
    ['admin-sistema', 'admin-general'].includes(this._usuarioActivo()?.rol ?? '')
  );

  /** Subsistemas habilitados para el usuario según su rol/cuenta. */
  readonly subsistemas = computed(
    () => this._usuarioActivo()?.subsistemas ?? []
  );

  /** Verificación defensiva: ¿el usuario tiene habilitado ESTE subsistema? */
  readonly tieneAccesoPropio = computed(
    () => this.subsistemas().includes(SLUG_SUBSISTEMA)
  );

  readonly inicialesUsuario = computed(() => {
    const nombre = this._usuarioActivo()?.nombre ?? '';
    return nombre
      .split(' ')
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('');
  });

  constructor() {
    this.leerSesionDelHost();
  }

  /**
   * Relee la sesión publicada por el Host. Idempotente y sin efectos sobre
   * el estado de la shell — puede invocarse al recibir un 401 del backend
   * propio para descartar una sesión expirada.
   */
  leerSesionDelHost(): void {
    try {
      const crudo = sessionStorage.getItem(SESSION_KEY);
      if (!crudo) {
        this._token.set(null);
        this._usuarioActivo.set(null);
        return;
      }
      const sesion = JSON.parse(crudo) as SesionPersistida;
      this._token.set(sesion.token ?? null);
      this._usuarioActivo.set(sesion.usuario ?? null);
    } catch {
      this._token.set(null);
      this._usuarioActivo.set(null);
    }
  }
}

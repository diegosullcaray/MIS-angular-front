import { Injectable, signal, computed } from '@angular/core';
import { timer } from 'rxjs';
import type {
  Rol,
  Usuario,
  UsuarioRequest,
  RolRequest,
  PageResponse,
} from '../models/acceso.model';

// ─── Datos Mock ────────────────────────────────────────────────────────────────

const MOCK_ROLES: Rol[] = [
  {
    id: 'rol-001',
    nombre: 'Administrador del Sistema',
    slug: 'admin-sistema',
    subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh'],
  },
  {
    id: 'rol-002',
    nombre: 'Administrador General',
    slug: 'admin-general',
    subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh'],
  },
  {
    id: 'rol-003',
    nombre: 'Supervisor de Área',
    slug: 'supervisor-area',
    subsistemas: ['subsistema-rrhh'],
  },
];

const MOCK_USUARIOS: Usuario[] = [
  {
    id: 'usr-001',
    nombre: 'Diego Sullcarayra',
    email: 'diego@confianza.pe',
    rol: 'admin-sistema',
    subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh'],
    activo: true,
    creadoEn: '2026-01-15T00:00:00Z',
  },
  {
    id: 'usr-002',
    nombre: 'Ana García',
    email: 'ana.garcia@confianza.pe',
    rol: 'admin-general',
    subsistemas: ['subsistema-contabilidad', 'subsistema-rrhh'],
    activo: true,
    creadoEn: '2026-02-20T00:00:00Z',
  },
  {
    id: 'usr-003',
    nombre: 'Carlos Mendoza',
    email: 'carlos.mendoza@confianza.pe',
    rol: 'supervisor-area',
    subsistemas: ['subsistema-rrhh'],
    activo: true,
    creadoEn: '2026-03-10T00:00:00Z',
  },
  {
    id: 'usr-004',
    nombre: 'Laura Torres',
    email: 'laura.torres@confianza.pe',
    rol: 'supervisor-area',
    subsistemas: ['subsistema-contabilidad'],
    activo: false,
    creadoEn: '2026-04-05T00:00:00Z',
  },
];

// ─── AccesosService ───────────────────────────────────────────────────────────

/**
 * Servicio de Gestión de Accesos (IAM) con Signals reactivos.
 *
 * ⚠️ MODO MOCK: Los métodos usan timer() para simular latencia.
 * Al integrar el backend, reemplazar por HttpClient.
 */
@Injectable({ providedIn: 'root' })
export class AccesosService {

  // ─── Estado reactivo ────────────────────────────────────────────────────

  readonly isLoadingUsuarios = signal<boolean>(false);
  readonly isLoadingRoles    = signal<boolean>(false);
  readonly errorUsuarios     = signal<string | null>(null);
  readonly errorRoles        = signal<string | null>(null);
  readonly usuarios          = signal<Usuario[]>([]);
  readonly roles             = signal<Rol[]>([]);

  // ─── Computed ────────────────────────────────────────────────────────────

  readonly totalUsuariosActivos = computed(
    () => this.usuarios().filter(u => u.activo).length
  );
  readonly totalRoles = computed(() => this.roles().length);

  // ─── Usuarios ─────────────────────────────────────────────────────────────

  cargarUsuarios(q?: string): void {
    this.isLoadingUsuarios.set(true);
    this.errorUsuarios.set(null);

    timer(700).subscribe(() => {
      let data = [...MOCK_USUARIOS];
      if (q) {
        const query = q.toLowerCase();
        data = data.filter(
          u => u.nombre.toLowerCase().includes(query) ||
               u.email.toLowerCase().includes(query)
        );
      }
      this.usuarios.set(data);
      this.isLoadingUsuarios.set(false);
    });
  }

  getUsuarioById(id: string): Usuario | undefined {
    return MOCK_USUARIOS.find(u => u.id === id);
  }

  crearUsuario(request: UsuarioRequest): Promise<Usuario> {
    return new Promise(resolve => {
      timer(600).subscribe(() => {
        const rol = MOCK_ROLES.find(r => r.id === request.rolId);
        const nuevo: Usuario = {
          id:          `usr-${Date.now()}`,
          nombre:      request.nombre,
          email:       request.email,
          rol:         rol?.slug ?? 'supervisor-area',
          subsistemas: request.subsistemas,
          activo:      true,
          creadoEn:    new Date().toISOString(),
        };
        MOCK_USUARIOS.push(nuevo);
        this.usuarios.update(list => [...list, nuevo]);
        resolve(nuevo);
      });
    });
  }

  actualizarUsuario(id: string, request: Omit<UsuarioRequest, 'password'>): Promise<Usuario> {
    return new Promise(resolve => {
      timer(500).subscribe(() => {
        const idx = MOCK_USUARIOS.findIndex(u => u.id === id);
        if (idx !== -1) {
          const rol = MOCK_ROLES.find(r => r.id === request.rolId);
          const updated: Usuario = {
            ...MOCK_USUARIOS[idx],
            nombre:      request.nombre,
            email:       request.email,
            rol:         rol?.slug ?? MOCK_USUARIOS[idx].rol,
            subsistemas: request.subsistemas,
          };
          MOCK_USUARIOS[idx] = updated;
          this.usuarios.update(list => list.map(u => u.id === id ? updated : u));
          resolve(updated);
        }
      });
    });
  }

  cambiarEstadoUsuario(id: string, activo: boolean): Promise<void> {
    return new Promise(resolve => {
      timer(400).subscribe(() => {
        const idx = MOCK_USUARIOS.findIndex(u => u.id === id);
        if (idx !== -1) {
          MOCK_USUARIOS[idx] = { ...MOCK_USUARIOS[idx], activo };
          this.usuarios.update(list =>
            list.map(u => u.id === id ? { ...u, activo } : u)
          );
        }
        resolve();
      });
    });
  }

  // ─── Roles ────────────────────────────────────────────────────────────────

  cargarRoles(): void {
    this.isLoadingRoles.set(true);
    this.errorRoles.set(null);

    timer(500).subscribe(() => {
      this.roles.set([...MOCK_ROLES]);
      this.isLoadingRoles.set(false);
    });
  }

  getRolById(id: string): Rol | undefined {
    return MOCK_ROLES.find(r => r.id === id);
  }

  crearRol(request: RolRequest): Promise<Rol> {
    return new Promise(resolve => {
      timer(500).subscribe(() => {
        const nuevo: Rol = {
          id:          `rol-${Date.now()}`,
          nombre:      request.nombre,
          slug:        request.slug as any,
          subsistemas: request.subsistemas,
        };
        MOCK_ROLES.push(nuevo);
        this.roles.update(list => [...list, nuevo]);
        resolve(nuevo);
      });
    });
  }

  actualizarRol(id: string, request: RolRequest): Promise<Rol> {
    return new Promise(resolve => {
      timer(500).subscribe(() => {
        const idx = MOCK_ROLES.findIndex(r => r.id === id);
        if (idx !== -1) {
          const updated: Rol = { ...MOCK_ROLES[idx], ...request, slug: request.slug as any };
          MOCK_ROLES[idx] = updated;
          this.roles.update(list => list.map(r => r.id === id ? updated : r));
          resolve(updated);
        }
      });
    });
  }

  eliminarRol(id: string): Promise<void> {
    return new Promise(resolve => {
      timer(400).subscribe(() => {
        const idx = MOCK_ROLES.findIndex(r => r.id === id);
        if (idx !== -1) MOCK_ROLES.splice(idx, 1);
        this.roles.update(list => list.filter(r => r.id !== id));
        resolve();
      });
    });
  }
}

import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, delay, dematerialize, materialize, of, throwError } from 'rxjs';
import { fakeDb, FAKE_CREDENCIALES } from './fake-db';
import type {
  PageResponse,
  Rol,
  RolRequest,
  RolSlug,
  Usuario,
  UsuarioRequest,
} from '../../pages/modules/admin/models/acceso.model';
import type {
  PermisoRolSistema,
  Seccion,
  Sistema,
  SistemaRequest,
  SistemaResumen,
} from '../../pages/modules/admin/models/sistema.model';

/**
 * Fake API — Interceptor HTTP que simula el backend REST del Host
 * según el contrato definido en `docs_proyecto/04_BACKEND_SCHEMA.md`.
 *
 * Atiende todas las rutas bajo `/api/v1/*` con una base de datos en memoria
 * y una latencia simulada. Cualquier otra petición pasa al backend real.
 *
 * ✅ Para conectar el backend real: eliminar `fakeApiInterceptor` de
 *    `provideHttpClient(withInterceptors([...]))` en `app.config.ts`.
 */

const API_PREFIX = '/api/v1';
const LATENCIA_MS = 450;

export const fakeApiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const url = new URL(req.url, location.origin);

  if (!url.pathname.startsWith(API_PREFIX)) {
    return next(req);
  }

  const segmentos = url.pathname.slice(API_PREFIX.length).split('/').filter(Boolean);

  // materialize/dematerialize para que también los errores respeten la latencia
  return manejarRuta(req, segmentos, url.searchParams).pipe(
    materialize(),
    delay(LATENCIA_MS),
    dematerialize()
  );
};

// ─── Router de la Fake API ─────────────────────────────────────────────────────

function manejarRuta(
  req: HttpRequest<unknown>,
  seg: string[],
  query: URLSearchParams
): Observable<HttpEvent<unknown>> {
  const metodo = req.method.toUpperCase();
  const [recurso, p1, p2] = seg;

  switch (recurso) {
    case 'auth':
      if (p1 === 'login' && metodo === 'POST')         return login(req.body);
      if (p1 === 'verificar-otp' && metodo === 'POST') return verificarOtp(req.body);
      break;

    case 'usuarios':
      if (!p1 && metodo === 'GET')  return conRol(req, ['admin-sistema'], () => listarUsuarios(query));
      if (p1 && !p2 && metodo === 'GET') return conRol(req, ['admin-sistema'], () => obtenerUsuario(p1));
      if (!p1 && metodo === 'POST') return conRol(req, ['admin-sistema'], () => crearUsuario(req.body as UsuarioRequest));
      if (p1 && !p2 && metodo === 'PUT') return conRol(req, ['admin-sistema'], () => actualizarUsuario(p1, req.body as UsuarioRequest));
      if (p1 && p2 === 'estado' && metodo === 'PATCH') return conRol(req, ['admin-sistema'], () => cambiarEstado(p1, req.body as { activo: boolean }));
      break;

    case 'roles':
      if (!p1 && metodo === 'GET')  return ok(fakeDb.roles);
      if (p1 && p2 === 'usuarios' && metodo === 'GET') return conRol(req, ['admin-sistema'], () => usuariosDeRol(p1));
      if (p1 && p2 === 'permisos' && metodo === 'GET') return conRol(req, ['admin-sistema'], () => permisosDeRol(p1));
      if (p1 && !p2 && metodo === 'GET')   return obtenerRol(p1);
      if (!p1 && metodo === 'POST') return conRol(req, ['admin-sistema'], () => crearRol(req.body as RolRequest));
      if (p1 && metodo === 'PUT')   return conRol(req, ['admin-sistema'], () => actualizarRol(p1, req.body as RolRequest));
      if (p1 && metodo === 'DELETE') return conRol(req, ['admin-sistema'], () => eliminarRol(p1));
      break;

    case 'sistemas':
      if (!p1 && metodo === 'GET')       return ok(listarSistemas());
      if (p1 && !p2 && metodo === 'GET') return obtenerSistema(p1);
      if (!p1 && metodo === 'POST')      return conRol(req, ['admin-sistema'], () => crearSistema(req.body as SistemaRequest));
      if (p1 && !p2 && metodo === 'PUT') return conRol(req, ['admin-sistema'], () => actualizarSistema(p1, req.body as SistemaRequest));
      if (p1 && !p2 && metodo === 'DELETE') return conRol(req, ['admin-sistema'], () => eliminarSistema(p1));
      if (p1 && p2 === 'estructura' && metodo === 'PUT') return conRol(req, ['admin-sistema'], () => actualizarEstructura(p1, req.body as Seccion[]));
      if (p1 && p2 === 'permisos' && metodo === 'GET')   return conRol(req, ['admin-sistema'], () => permisosDeSistema(p1));
      if (p1 && p2 === 'permisos' && seg[3] && metodo === 'PUT') {
        return conRol(req, ['admin-sistema'], () => guardarPermisos(p1, seg[3], req.body as { modulos: string[] }));
      }
      break;
  }

  return error(404, `Endpoint no encontrado: ${metodo} ${req.url}`);
}

// ─── Helpers de respuesta ──────────────────────────────────────────────────────

function ok<T>(body: T, status = 200): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status, body }));
}

function error(status: number, message: string): Observable<never> {
  return throwError(
    () =>
      new HttpErrorResponse({
        status,
        error: { status, message, timestamp: new Date().toISOString() },
        statusText: message,
      })
  );
}

/** Valida el rol del token simulado (header X-User-Role del authInterceptor). */
function conRol(
  req: HttpRequest<unknown>,
  rolesPermitidos: RolSlug[],
  handler: () => Observable<HttpEvent<unknown>>
): Observable<HttpEvent<unknown>> {
  if (!req.headers.has('Authorization')) {
    return error(401, 'No autenticado: falta el token de sesión.');
  }
  const rol = req.headers.get('X-User-Role') as RolSlug | null;
  if (!rol || !rolesPermitidos.includes(rol)) {
    return error(403, 'No tienes permisos para realizar esta operación.');
  }
  return handler();
}

// ─── Auth (login + MFA OTP, CA-07) ────────────────────────────────────────────

/** Código OTP fijo de la Fake API (solo demo — el backend real genera el suyo). */
const FAKE_OTP = '123456';

function login(body: unknown): Observable<HttpEvent<unknown>> {
  const { email, password } = (body ?? {}) as { email?: string; password?: string };

  const credencial = FAKE_CREDENCIALES.find(
    c => c.email === email?.toLowerCase().trim() && c.password === password
  );
  if (!credencial) {
    return error(401, 'Correo electrónico o contraseña incorrectos.');
  }

  const usuario = fakeDb.usuarios.find(u => u.id === credencial.usuarioId);
  if (!usuario || !usuario.activo) {
    return error(403, 'El usuario está desactivado. Contacta al administrador.');
  }

  // Credenciales válidas → desafío MFA (la sesión se emite al verificar el OTP)
  return ok({
    mfaRequerido: true,
    mfaToken: `fake-mfa.${btoa(usuario.id)}.${Date.now()}`,
    email: usuario.email,
  });
}

function verificarOtp(body: unknown): Observable<HttpEvent<unknown>> {
  const { mfaToken, otp } = (body ?? {}) as { mfaToken?: string; otp?: string };

  const usuarioId = decodificarMfaToken(mfaToken);
  const usuario = usuarioId ? fakeDb.usuarios.find(u => u.id === usuarioId) : undefined;
  if (!usuario || !usuario.activo) {
    return error(401, 'La sesión de verificación expiró. Vuelve a iniciar sesión.');
  }

  if (otp !== FAKE_OTP) {
    return error(401, 'El código de verificación es incorrecto.');
  }

  return ok({
    token: `fake-jwt.${btoa(usuario.id)}.${Date.now()}`,
    usuario,
  });
}

function decodificarMfaToken(token: string | undefined): string | null {
  if (!token?.startsWith('fake-mfa.')) return null;
  try {
    return atob(token.split('.')[1] ?? '');
  } catch {
    return null;
  }
}

// ─── Usuarios (IAM) ───────────────────────────────────────────────────────────

function listarUsuarios(query: URLSearchParams): Observable<HttpEvent<unknown>> {
  const page = Number(query.get('page') ?? 1);
  const pageSize = Number(query.get('pageSize') ?? 20);
  const q = query.get('q')?.toLowerCase();
  const activo = query.get('activo');

  let usuarios = [...fakeDb.usuarios];
  if (q) {
    usuarios = usuarios.filter(
      u => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }
  if (activo !== null) {
    usuarios = usuarios.filter(u => u.activo === (activo === 'true'));
  }

  const respuesta: PageResponse<Usuario> = {
    page,
    pageSize,
    total: usuarios.length,
    items: usuarios.slice((page - 1) * pageSize, page * pageSize),
  };
  return ok(respuesta);
}

function obtenerUsuario(id: string): Observable<HttpEvent<unknown>> {
  const usuario = fakeDb.usuarios.find(u => u.id === id);
  return usuario ? ok(usuario) : error(404, `El usuario '${id}' no existe.`);
}

function crearUsuario(body: UsuarioRequest): Observable<HttpEvent<unknown>> {
  if (!body?.nombre?.trim() || !body?.email?.trim() || !body?.rolId) {
    return error(400, 'Nombre, email y rol son requeridos.');
  }
  if (fakeDb.usuarios.some(u => u.email.toLowerCase() === body.email.toLowerCase())) {
    return error(409, `Ya existe un usuario con el email '${body.email}'.`);
  }
  const rol = fakeDb.roles.find(r => r.id === body.rolId);
  if (!rol) return error(400, `El rol '${body.rolId}' no existe.`);

  const nuevo: Usuario = {
    id: fakeDb.nextId('usr'),
    nombre: body.nombre.trim(),
    email: body.email.trim().toLowerCase(),
    rol: rol.slug,
    subsistemas: body.subsistemas ?? [],
    activo: true,
    creadoEn: new Date().toISOString(),
  };
  fakeDb.usuarios.push(nuevo);
  return ok(nuevo, 201);
}

function actualizarUsuario(id: string, body: UsuarioRequest): Observable<HttpEvent<unknown>> {
  const idx = fakeDb.usuarios.findIndex(u => u.id === id);
  if (idx === -1) return error(404, `El usuario '${id}' no existe.`);

  const rol = fakeDb.roles.find(r => r.id === body.rolId);
  if (!rol) return error(400, `El rol '${body.rolId}' no existe.`);

  const actualizado: Usuario = {
    ...fakeDb.usuarios[idx],
    nombre: body.nombre?.trim() ?? fakeDb.usuarios[idx].nombre,
    email: body.email?.trim().toLowerCase() ?? fakeDb.usuarios[idx].email,
    rol: rol.slug,
    subsistemas: body.subsistemas ?? fakeDb.usuarios[idx].subsistemas,
  };
  fakeDb.usuarios[idx] = actualizado;
  return ok(actualizado);
}

function cambiarEstado(id: string, body: { activo: boolean }): Observable<HttpEvent<unknown>> {
  const usuario = fakeDb.usuarios.find(u => u.id === id);
  if (!usuario) return error(404, `El usuario '${id}' no existe.`);

  usuario.activo = body?.activo ?? !usuario.activo;
  return ok({ activo: usuario.activo });
}

// ─── Roles (IAM) ──────────────────────────────────────────────────────────────

function obtenerRol(id: string): Observable<HttpEvent<unknown>> {
  const rol = fakeDb.roles.find(r => r.id === id);
  return rol ? ok(rol) : error(404, `El rol '${id}' no existe.`);
}

function crearRol(body: RolRequest): Observable<HttpEvent<unknown>> {
  if (!body?.nombre?.trim() || !body?.slug?.trim()) {
    return error(400, 'Nombre y slug son requeridos.');
  }
  if (fakeDb.roles.some(r => r.slug === body.slug)) {
    return error(409, `Ya existe un rol con el slug '${body.slug}'.`);
  }

  const nuevo: Rol = {
    id: fakeDb.nextId('rol'),
    nombre: body.nombre.trim(),
    slug: body.slug.trim() as RolSlug,
    subsistemas: body.subsistemas ?? [],
  };
  fakeDb.roles.push(nuevo);
  return ok(nuevo, 201);
}

function actualizarRol(id: string, body: RolRequest): Observable<HttpEvent<unknown>> {
  const idx = fakeDb.roles.findIndex(r => r.id === id);
  if (idx === -1) return error(404, `El rol '${id}' no existe.`);

  const actualizado: Rol = {
    ...fakeDb.roles[idx],
    nombre: body.nombre?.trim() ?? fakeDb.roles[idx].nombre,
    subsistemas: body.subsistemas ?? fakeDb.roles[idx].subsistemas,
  };
  fakeDb.roles[idx] = actualizado;
  return ok(actualizado);
}

function usuariosDeRol(id: string): Observable<HttpEvent<unknown>> {
  const rol = fakeDb.roles.find(r => r.id === id);
  if (!rol) return error(404, `El rol '${id}' no existe.`);
  return ok(fakeDb.usuarios.filter(u => u.rol === rol.slug));
}

function permisosDeRol(id: string): Observable<HttpEvent<unknown>> {
  if (!fakeDb.roles.some(r => r.id === id)) return error(404, `El rol '${id}' no existe.`);
  return ok(fakeDb.permisos.filter(p => p.rolId === id));
}

function eliminarRol(id: string): Observable<HttpEvent<unknown>> {
  const rol = fakeDb.roles.find(r => r.id === id);
  if (!rol) return error(404, `El rol '${id}' no existe.`);

  // Regla del contrato: 409 si el rol tiene usuarios asignados
  if (fakeDb.usuarios.some(u => u.rol === rol.slug)) {
    return error(409, `No se puede eliminar: el rol '${rol.nombre}' tiene usuarios asignados.`);
  }

  fakeDb.roles.splice(fakeDb.roles.indexOf(rol), 1);
  return ok(null, 204);
}

// ─── Sistemas registrados ─────────────────────────────────────────────────────

function contarModulos(s: Sistema): number {
  return s.secciones.reduce(
    (acc, sec) => acc + sec.subsecciones.reduce((a, sub) => a + sub.modulos.length, 0),
    0
  );
}

function aResumen(s: Sistema): SistemaResumen {
  return {
    id: s.id,
    nombre: s.nombre,
    slug: s.slug,
    descripcion: s.descripcion,
    icono: s.icono,
    version: s.version,
    estado: s.estado,
    totalSecciones: s.secciones.length,
    totalModulos: contarModulos(s),
    rolesAsignados: fakeDb.roles.filter(r => r.subsistemas.includes(s.slug)).length,
    actualizadoEn: s.actualizadoEn,
  };
}

function buscarSistema(idOSlug: string): Sistema | undefined {
  return fakeDb.sistemas.find(s => s.id === idOSlug || s.slug === idOSlug);
}

function listarSistemas(): SistemaResumen[] {
  return fakeDb.sistemas.map(aResumen);
}

function obtenerSistema(idOSlug: string): Observable<HttpEvent<unknown>> {
  const sistema = buscarSistema(idOSlug);
  return sistema ? ok(sistema) : error(404, `El sistema '${idOSlug}' no existe.`);
}

function crearSistema(body: SistemaRequest): Observable<HttpEvent<unknown>> {
  if (!body?.nombre?.trim() || !body?.slug?.trim()) {
    return error(400, 'Nombre y slug son requeridos.');
  }
  if (fakeDb.sistemas.some(s => s.slug === body.slug)) {
    return error(409, `Ya existe un sistema con el slug '${body.slug}'.`);
  }

  const ahora = new Date().toISOString();
  const nuevo: Sistema = {
    id: fakeDb.nextId('sis'),
    nombre: body.nombre.trim(),
    slug: body.slug.trim(),
    descripcion: body.descripcion?.trim() ?? '',
    icono: body.icono?.trim() || 'pi pi-th-large',
    url: body.url?.trim() ?? '',
    version: body.version?.trim() || '1.0.0',
    estado: body.estado ?? 'inactivo',
    secciones: [],
    creadoEn: ahora,
    actualizadoEn: ahora,
  };
  fakeDb.sistemas.push(nuevo);
  return ok(nuevo, 201);
}

function actualizarSistema(id: string, body: SistemaRequest): Observable<HttpEvent<unknown>> {
  const idx = fakeDb.sistemas.findIndex(s => s.id === id);
  if (idx === -1) return error(404, `El sistema '${id}' no existe.`);

  const actual = fakeDb.sistemas[idx];
  const actualizado: Sistema = {
    ...actual,
    nombre: body.nombre?.trim() ?? actual.nombre,
    descripcion: body.descripcion?.trim() ?? actual.descripcion,
    icono: body.icono?.trim() || actual.icono,
    url: body.url?.trim() ?? actual.url,
    version: body.version?.trim() || actual.version,
    estado: body.estado ?? actual.estado,
    actualizadoEn: new Date().toISOString(),
  };
  fakeDb.sistemas[idx] = actualizado;
  return ok(actualizado);
}

function eliminarSistema(id: string): Observable<HttpEvent<unknown>> {
  const sistema = fakeDb.sistemas.find(s => s.id === id);
  if (!sistema) return error(404, `El sistema '${id}' no existe.`);

  const rolesConSistema = fakeDb.roles.filter(r => r.subsistemas.includes(sistema.slug));
  if (rolesConSistema.length > 0) {
    return error(409, `No se puede eliminar: el sistema está asignado a ${rolesConSistema.length} rol(es).`);
  }

  fakeDb.sistemas.splice(fakeDb.sistemas.indexOf(sistema), 1);
  // Limpiar permisos huérfanos
  for (let i = fakeDb.permisos.length - 1; i >= 0; i--) {
    if (fakeDb.permisos[i].sistemaId === id) fakeDb.permisos.splice(i, 1);
  }
  return ok(null, 204);
}

function actualizarEstructura(id: string, secciones: Seccion[]): Observable<HttpEvent<unknown>> {
  const sistema = fakeDb.sistemas.find(s => s.id === id);
  if (!sistema) return error(404, `El sistema '${id}' no existe.`);
  if (!Array.isArray(secciones)) return error(400, 'La estructura debe ser una lista de secciones.');

  sistema.secciones = secciones;
  sistema.actualizadoEn = new Date().toISOString();

  // Depurar permisos que apunten a módulos que ya no existen
  const modulosValidos = new Set(
    secciones.flatMap(sec => sec.subsecciones.flatMap(sub => sub.modulos.map(m => m.id)))
  );
  for (const permiso of fakeDb.permisos) {
    if (permiso.sistemaId === id) {
      permiso.modulos = permiso.modulos.filter(m => modulosValidos.has(m));
    }
  }
  return ok(sistema);
}

function permisosDeSistema(id: string): Observable<HttpEvent<unknown>> {
  const sistema = buscarSistema(id);
  if (!sistema) return error(404, `El sistema '${id}' no existe.`);
  return ok(fakeDb.permisos.filter(p => p.sistemaId === sistema.id));
}

function guardarPermisos(sistemaId: string, rolId: string, body: { modulos: string[] }): Observable<HttpEvent<unknown>> {
  const sistema = buscarSistema(sistemaId);
  if (!sistema) return error(404, `El sistema '${sistemaId}' no existe.`);
  if (!fakeDb.roles.some(r => r.id === rolId)) return error(404, `El rol '${rolId}' no existe.`);

  const modulos = Array.isArray(body?.modulos) ? body.modulos : [];
  const existente = fakeDb.permisos.find(p => p.sistemaId === sistema.id && p.rolId === rolId);

  const permiso: PermisoRolSistema = existente
    ? Object.assign(existente, { modulos })
    : { rolId, sistemaId: sistema.id, modulos };

  if (!existente) fakeDb.permisos.push(permiso);
  return ok(permiso);
}

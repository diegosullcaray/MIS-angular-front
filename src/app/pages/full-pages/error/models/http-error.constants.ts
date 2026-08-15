import type { HttpErrorInfo, KnownHttpErrorCode } from './http-error.model';

/**
 * Mapeo único de errores HTTP conocidos → cómo se muestran en el Host.
 * Centralizado dentro del módulo de errores.
 */
export const HTTP_ERROR_MESSAGES: Record<KnownHttpErrorCode, HttpErrorInfo> = {
  0: {
    code: 0,
    titulo: 'Sin conexión',
    mensaje: 'No se pudo contactar al servidor. Verifica tu conexión a internet e inténtalo de nuevo.',
    icono: 'lucideWifiOff',
    accion: 'retry',
    esFatal: true,
  },
  400: {
    code: 400,
    titulo: 'Solicitud inválida',
    mensaje: 'La solicitud contiene datos inválidos. Revisa el formulario e inténtalo nuevamente.',
    icono: 'lucideCircleAlert',
    accion: 'back',
    esFatal: false,
  },
  401: {
    code: 401,
    titulo: 'Sesión expirada',
    mensaje: 'Tu sesión venció o no es válida. Inicia sesión nuevamente para continuar.',
    icono: 'lucideLock',
    accion: 'login',
    esFatal: false,
  },
  403: {
    code: 403,
    titulo: 'Acceso denegado',
    mensaje: 'No tienes permisos para acceder a este recurso. Contacta al Administrador del Sistema.',
    icono: 'lucideShieldAlert',
    accion: 'home',
    esFatal: false,
  },
  404: {
    code: 404,
    titulo: 'No encontrado',
    mensaje: 'El recurso solicitado no existe o fue eliminado.',
    icono: 'lucideCompass',
    accion: 'back',
    esFatal: false,
  },
  408: {
    code: 408,
    titulo: 'Tiempo de espera agotado',
    mensaje: 'El servidor tardó demasiado en responder. Inténtalo de nuevo en unos segundos.',
    icono: 'lucideTimer',
    accion: 'retry',
    esFatal: true,
  },
  409: {
    code: 409,
    titulo: 'Conflicto',
    mensaje: 'La operación entra en conflicto con el estado actual del recurso.',
    icono: 'lucideCircleAlert',
    accion: 'back',
    esFatal: false,
  },
  422: {
    code: 422,
    titulo: 'Datos no procesables',
    mensaje: 'Algunos datos enviados no pasaron las validaciones del servidor.',
    icono: 'lucideCircleAlert',
    accion: 'back',
    esFatal: false,
  },
  429: {
    code: 429,
    titulo: 'Demasiadas solicitudes',
    mensaje: 'Se alcanzó el límite de solicitudes. Espera un momento antes de volver a intentarlo.',
    icono: 'lucideTimer',
    accion: 'retry',
    esFatal: false,
  },
  500: {
    code: 500,
    titulo: 'Error del servidor',
    mensaje: 'Ocurrió un error inesperado en el servidor. Ya fue notificado al equipo técnico.',
    icono: 'lucideServerCrash',
    accion: 'retry',
    esFatal: true,
  },
  502: {
    code: 502,
    titulo: 'Servidor no disponible',
    mensaje: 'El servidor no respondió correctamente. Inténtalo de nuevo en unos minutos.',
    icono: 'lucideServerCrash',
    accion: 'retry',
    esFatal: true,
  },
  503: {
    code: 503,
    titulo: 'Servicio en mantenimiento',
    mensaje: 'El servicio no está disponible temporalmente por mantenimiento.',
    icono: 'lucideServerCrash',
    accion: 'retry',
    esFatal: true,
  },
  504: {
    code: 504,
    titulo: 'Tiempo de espera del servidor agotado',
    mensaje: 'El servidor tardó demasiado en responder. Inténtalo de nuevo en unos minutos.',
    icono: 'lucideServerCrash',
    accion: 'retry',
    esFatal: true,
  },
};

/**
 * Fallback para códigos HTTP no mapeados explícitamente.
 */
export const HTTP_ERROR_FALLBACK: HttpErrorInfo = {
  code: 500,
  titulo: 'Algo salió mal',
  mensaje: 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.',
  icono: 'lucideCircleAlert',
  accion: 'retry',
  esFatal: false,
};

/**
 * Rutas que nunca deben ser interceptadas globalmente (login, backend
 * Ant/Winder). El backend Ant/Winder (`/cores2/ant/`) es la excepción más
 * importante: cada componente de `reportes` (y otros módulos) ya maneja sus
 * propios errores de bloque/tabla con su propio toast — un solo bloque roto
 * en un reporte no debería tirar abajo toda la app con un redirect global a
 * `/error/500` (confirmado: `PLANMOV_03`/`_04` devuelven 500 cuando no hay
 * datos para un asesor/fecha, algo esperable y ya tolerado a nivel de
 * servicio, no un error fatal de la aplicación).
 */
export const HTTP_ERROR_IGNORED_URL_PATTERNS = ['/auth/', 'accounts.google.com', '/cores2/ant/'];

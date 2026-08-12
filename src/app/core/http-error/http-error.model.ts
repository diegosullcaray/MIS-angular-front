/** Códigos HTTP conocidos con una página/mensaje mapeado en el Host. */
export type KnownHttpErrorCode =
  | 400
  | 401
  | 403
  | 404
  | 408
  | 409
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504
  | 0;

/** Acción principal que ofrece la página de error al usuario. */
export type HttpErrorAction = 'retry' | 'login' | 'home' | 'back';

/** Descripción de un error HTTP mapeado: cómo se ve y qué puede hacer el usuario. */
export interface HttpErrorInfo {
  code: KnownHttpErrorCode;
  /** Título corto mostrado en la página/toast de error. */
  titulo: string;
  /** Mensaje explicativo en lenguaje de negocio (nunca el mensaje crudo del backend). */
  mensaje: string;
  /** Nombre de ícono registrado en `@ng-icons/lucide`. */
  icono: string;
  /** Acción principal ofrecida al usuario. */
  accion: HttpErrorAction;
  /** Si es `true`, el interceptor global redirige a la página de error de fullpages en vez de dejar que el llamador maneje el error localmente. */
  esFatal: boolean;
}

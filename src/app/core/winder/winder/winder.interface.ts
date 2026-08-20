import type { Strand } from './strand.class';

/** Respuesta estándar del backend Ant (protocolo Winder). */
export interface IWinderResponse {
  code: string;
  headers: unknown;
  body: unknown;
  errors?: unknown;
}

/** Conexión a un módulo del backend Ant; cada uno tiene su propio `port`, `secret` y `appId`. */
export interface IWinderConnectionConf {
  /** Puerto lógico del módulo en el backend (ej: 6300 = session). */
  port: number;
  /** Clave AES de 128 bits (hex) para cifrar la config de la request. */
  secret: string;
  /** Identificador del módulo de aplicación en el backend. */
  appId: string;
}

/** Configuración de una request individual (`resource` = blob). */
export interface IWinderRequestConfig {
  responseType: 'JSON' | 'resource';
  options?: Record<string, unknown>;
  strands: Strand[] | Strand;
}

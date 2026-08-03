import type { Strand } from './strand.class';

/**
 * Respuesta estándar del backend Ant (Winder protocol).
 *
 * - `code`: código de resultado devuelto por el backend.
 * - `headers`: metadatos de la respuesta.
 * - `body`: payload principal (datos de negocio).
 * - `errors`: detalle de errores si los hay.
 */
export interface IWinderResponse {
  code: string;
  headers: unknown;
  body: unknown;
  errors?: unknown;
}

/**
 * Configuración de conexión al módulo del backend Ant.
 *
 * Cada módulo de negocio (login, admin, reporting…) tiene su
 * propio `port`, `secret` y `appId`.
 */
export interface IWinderConnectionConf {
  /** Puerto lógico del módulo en el backend (ej: 6300 = session). */
  port: number;
  /** Clave AES de 128 bits (hex) para cifrar la config de la request. */
  secret: string;
  /** Identificador del módulo de aplicación en el backend. */
  appId: string;
}

/**
 * Configuración de una request individual.
 *
 * - `responseType`: `'JSON'` | `'resource'` (blob).
 * - `strands`: uno o varios Strands que componen la petición.
 * - `options`: opciones adicionales de HttpClient (headers, etc.).
 */
export interface IWinderRequestConfig {
  responseType: 'JSON' | 'resource';
  options?: Record<string, unknown>;
  strands: Strand[] | Strand;
}

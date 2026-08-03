import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Strand } from './strand.class';
import { WinderService } from './winder.service';
import type { IWinderConnectionConf, IWinderRequestConfig, IWinderResponse } from './winder.interface';

/**
 * AntService — Clase base para los módulos de negocio del backend Ant.
 *
 * Cada módulo de negocio (login, admin, reporting…) extiende esta clase
 * e inyecta su `IWinderConnectionConf` (port + secret + appId).
 *
 * Los métodos protegidos proveen un API de alto nivel que oculta
 * los detalles del protocolo Winder a las subclases.
 *
 * ## Ejemplo de módulo
 * ```typescript
 * \@Injectable({ providedIn: 'root' })
 * export class ModSysAdminService extends AntService {
 *   constructor() {
 *     super({ port: 6301, secret: environment.moduleSecrets.admin, appId: 'admin' });
 *   }
 *
 *   getMenuItems(email: string): Observable<IWinderResponse> {
 *     return this.getSimpleResponseString('list_sec', { email }, 'menu_response');
 *   }
 * }
 * ```
 *
 * Migrado del STG (stg-app-mis-r22) al stack Angular 22.
 */
export abstract class AntService {
  private readonly connectionConf: IWinderConnectionConf;
  protected readonly winderService = inject(WinderService);

  constructor(conn: IWinderConnectionConf) {
    this.connectionConf = conn;
  }

  // ─── GET helpers ──────────────────────────────────────────────────────────

  protected get(requestConf: IWinderRequestConfig): Observable<IWinderResponse> {
    return this.winderService.prepare(this.connectionConf, requestConf).get().pipe(first());
  }

  protected getResponseString(s: Strand | Strand[]): Observable<IWinderResponse> {
    return this.get({ responseType: 'JSON', strands: s });
  }

  protected getResponseResource(s: Strand | Strand[]): Observable<IWinderResponse> {
    return this.get({ responseType: 'resource', strands: s });
  }

  /**
   * Shortcut para GET con un solo Strand, parámetros simples y respuesta JSON.
   *
   * @param strandName   Nombre del actionRoute en el backend (ej: `'list_sec'`).
   * @param params       Objeto con los parámetros del payload.
   * @param responseName Nombre del campo de respuesta (default: `'response'`).
   */
  protected getSimpleResponseString(
    strandName: string,
    params: Record<string, unknown>,
    responseName = 'response'
  ): Observable<IWinderResponse> {
    const s = new Strand(strandName, responseName);
    Object.keys(params).forEach((v) => s.pushToPayload(v, params[v]));
    return this.getResponseString(s);
  }

  /**
   * Shortcut para GET sin parámetros de payload.
   */
  protected getSimpleResponseStringNP(
    strandName: string,
    responseName = 'response'
  ): Observable<IWinderResponse> {
    const s = new Strand(strandName, responseName);
    return this.getResponseString(s);
  }

  /**
   * Shortcut para GET de recurso binario (blob).
   */
  protected getSimpleResponseResource(
    strandName: string,
    params: Record<string, unknown>,
    responseName = 'response'
  ): Observable<IWinderResponse> {
    const s = new Strand(strandName, responseName);
    Object.keys(params).forEach((v) => s.pushToPayload(v, params[v]));
    return this.getResponseResource(s);
  }

  // ─── POST helpers ─────────────────────────────────────────────────────────

  protected post(requestConf: IWinderRequestConfig): Observable<unknown> {
    return this.winderService.prepare(this.connectionConf, requestConf).post();
  }

  protected postResponseString(s: Strand | Strand[]): Observable<unknown> {
    return this.post({ responseType: 'JSON', strands: s }).pipe(first());
  }

  /**
   * Shortcut para POST con un solo Strand y parámetros simples.
   */
  protected postSimpleResponseString(
    strandName: string,
    params: Record<string, unknown>
  ): Observable<unknown> {
    const s = new Strand(strandName);
    Object.keys(params).forEach((v) => s.pushToPayload(v, params[v]));
    return this.postResponseString(s);
  }

  /**
   * Shortcut para POST de archivo con parámetros adicionales.
   */
  protected postFileSimpleResponseString(
    strandName: string,
    params: Record<string, unknown>,
    fileId: string,
    file: File
  ): Observable<unknown> {
    const s = new Strand(strandName);
    Object.keys(params).forEach((v) => s.pushToPayload(v, params[v]));
    s.setFile(file, fileId);
    return this.postResponseString(s);
  }

  /**
   * Shortcut para POST de archivo sin parámetros adicionales.
   */
  protected postFileSimpleResponseStringNP(
    strandName: string,
    fileId: string,
    file: File
  ): Observable<unknown> {
    const s = new Strand(strandName);
    s.setFile(file, fileId);
    return this.postResponseString(s);
  }
}

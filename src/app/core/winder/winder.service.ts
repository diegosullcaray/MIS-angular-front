import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Strand } from './strand.class';
import { CypherService } from './cypher.service';
import { RESTService } from './rest.service';
import { RESTPacket } from './rest-packet.class';
import type { IWinderConnectionConf, IWinderRequestConfig, IWinderResponse } from './winder.interface';

/**
 * WinderService — Orquestador del protocolo Winder/Ant.
 *
 * Responsabilidades:
 * 1. Recibe la configuración de conexión (módulo) y la configuración de la request.
 * 2. Serializa los Strands como JSON en el header HTTP `Winder-Params`.
 * 3. Cifra el objeto `{key, port, id, responseType}` con AES-128-CBC → parámetro `w`.
 * 4. Delega la ejecución HTTP a `RESTService`.
 *
 * ## Rutas generadas
 * | Tipo        | URL                                          |
 * |-------------|----------------------------------------------|
 * | GET (JSON)  | `/v1/g?w=<cipher>`                           |
 * | POST (JSON) | `/v1/p` body: `{w: <cipher>}`                |
 * | POST (file) | `/v1/pf` multipart, campo `w` + `winder-file`|
 *
 * ## Ejemplo de uso
 * ```typescript
 * const strand = new Strand('list_sec', 'menu_response');
 * strand.pushToPayload('email', 'user@confianza.pe');
 * winderService
 *   .prepare(connectionConf, { responseType: 'JSON', strands: strand })
 *   .get()
 *   .subscribe(res => console.log(res.body));
 * ```
 *
 * Migrado del STG (stg-app-mis-r22) al stack Angular 22 (zoneless, signals).
 */
@Injectable({ providedIn: 'root' })
export class WinderService {
  private readonly cypher = inject(CypherService);
  private readonly restService = inject(RESTService);

  // Estado interno de la request en preparación
  private strands: Strand[] = [];
  private formData: FormData | undefined;
  private options: Record<string, unknown> = {};
  private config: Record<string, unknown> = {};

  /**
   * Prepara el servicio para ejecutar una request.
   *
   * @param conn  Configuración del módulo de conexión (port, secret, appId).
   * @param conf  Configuración de la request (strands, responseType, options).
   * @returns     La misma instancia para encadenar `.get()` o `.post()`.
   */
  public prepare(conn: IWinderConnectionConf, conf: IWinderRequestConfig): WinderService {
    this.strands = [];
    this.formData = undefined;

    // Registrar strands
    if (conf.strands instanceof Strand) {
      this.addStrand(conf.strands);
    } else {
      conf.strands.forEach((s) => this.addStrand(s));
    }

    this.init(conn, conf);
    return this;
  }

  // ─── HTTP Methods ────────────────────────────────────────────────────────

  /**
   * Ejecuta un GET al backend Ant.
   * URL: `<rootUrl>/v1/g?w=<cipher>`
   * Header: `Winder-Params: <strands_json>`
   */
  public get(): Observable<IWinderResponse> {
    const rp = new RESTPacket();
    rp.baseRoute = 'v1/g';
    rp.pushRouteParam('w', this.winderConfig());
    rp.setOptions(this.options);
    return this.restService.get<IWinderResponse>(rp);
  }

  /**
   * Ejecuta un POST al backend Ant.
   * - Sin archivo: `<rootUrl>/v1/p` body JSON `{w: <cipher>}`
   * - Con archivo:  `<rootUrl>/v1/pf` multipart, campo `w` + `winder-file`
   */
  public post<T = unknown>(): Observable<T> {
    const rp = new RESTPacket();

    if (this.formData) {
      const fd = this.formData;
      rp.baseRoute = 'v1/pf';
      fd.append('w', this.winderConfig());
      rp.setFormData(fd);
    } else {
      rp.baseRoute = 'v1/p';
      rp.pushPostParam('w', this.winderConfig());
    }

    rp.setOptions(this.options);
    return this.restService.post<T>(rp);
  }

  // ─── Privados ─────────────────────────────────────────────────────────────

  private init(conn: IWinderConnectionConf, conf: IWinderRequestConfig): void {
    this.config = {
      key: conn.secret,
      port: conn.port,
      id: conn.appId,
      responseType: conf.responseType,
    };

    // Serializar Strands en JSON (excluyendo la propiedad formData)
    const strandsJson = JSON.stringify(this.strands, (k, v) => {
      if (k === 'formData') return undefined;
      return v;
    });

    this.options = conf.options ? { ...conf.options } : {};

    // Modo recurso (descarga de archivos) → responseType blob
    if (this.config['responseType'] === 'resource') {
      this.options['responseType'] = 'blob';
    }

    // Inyectar Strands en el header HTTP
    const existingHeaders = this.options['headers'] as Record<string, string> | undefined;
    if (existingHeaders) {
      existingHeaders['Winder-Params'] = strandsJson;
    } else {
      this.options['headers'] = { 'Winder-Params': strandsJson };
    }
  }

  private addStrand(strand: Strand): void {
    if (strand.haveFormData()) {
      this.formData = strand.getFormData();
    }
    this.strands.push(strand);
  }

  /**
   * Cifra la config del módulo y la deja lista para ser enviada como
   * parámetro URL `w`. Los `+` se reemplazan por `$` para evitar
   * que el browser los interprete como espacios en la query string.
   */
  private winderConfig(): string {
    const encrypted = this.cypher.encrypt(JSON.stringify(this.config));
    return encrypted.replace(/\+/gi, '$');
  }
}

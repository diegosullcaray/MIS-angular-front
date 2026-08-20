import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Strand } from './strand.class';
import { CypherService } from '../../services/cypher.service';
import { RESTService } from '../rest/rest.service';
import { RESTPacket } from '../rest/rest-packet.class';
import type { IWinderConnectionConf, IWinderRequestConfig, IWinderResponse } from './winder.interface';

/** Protocolo Winder/Ant: serializa los Strands en el header `Winder-Params`, cifra la config en el parámetro `w` y delega el HTTP a `RESTService`. */
@Injectable({ providedIn: 'root' })
export class WinderService {
  private readonly cypher = inject(CypherService);
  private readonly restService = inject(RESTService);

  private strands: Strand[] = [];
  private formData: FormData | undefined;
  private options: Record<string, unknown> = {};
  private config: Record<string, unknown> = {};

  /** Prepara la request y devuelve la instancia para encadenar `.get()` o `.post()`. */
  public prepare(conn: IWinderConnectionConf, conf: IWinderRequestConfig): WinderService {
    this.strands = [];
    this.formData = undefined;

    if (conf.strands instanceof Strand) {
      this.addStrand(conf.strands);
    } else {
      conf.strands.forEach((s) => this.addStrand(s));
    }

    this.init(conn, conf);
    return this;
  }

  /** GET a `<rootUrl>/v1/g?w=<cipher>`. */
  public get(): Observable<IWinderResponse> {
    const rp = new RESTPacket();
    rp.baseRoute = 'v1/g';
    rp.pushRouteParam('w', this.winderConfig());
    rp.setOptions(this.options);
    return this.restService.get<IWinderResponse>(rp);
  }

  /** POST a `/v1/p` (JSON) o a `/v1/pf` (multipart) si hay archivo. */
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

  private init(conn: IWinderConnectionConf, conf: IWinderRequestConfig): void {
    this.config = {
      key: conn.secret,
      port: conn.port,
      id: conn.appId,
      responseType: conf.responseType,
    };

    // `formData` viaja en el multipart, no en el header.
    const strandsJson = JSON.stringify(this.strands, (k, v) => (k === 'formData' ? undefined : v));

    this.options = conf.options ? { ...conf.options } : {};

    if (this.config['responseType'] === 'resource') {
      this.options['responseType'] = 'blob';
    }

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

  /** Cifra la config para el parámetro `w`; los `+` van como `$` para que el browser no los lea como espacios. */
  private winderConfig(): string {
    const encrypted = this.cypher.encrypt(JSON.stringify(this.config));
    return encrypted.replace(/\+/gi, '$');
  }
}

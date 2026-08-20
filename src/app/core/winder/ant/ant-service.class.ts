import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { Strand } from '../winder/strand.class';
import { WinderService } from '../winder/winder.service';
import type { IWinderConnectionConf, IWinderRequestConfig, IWinderResponse } from '../winder/winder.interface';

/** Clase base de los módulos del backend Ant: cada uno la extiende con su `IWinderConnectionConf` y usa estos helpers, que ocultan el protocolo Winder. */
export abstract class AntService {
  private readonly connectionConf: IWinderConnectionConf;
  protected readonly winderService = inject(WinderService);

  constructor(conn: IWinderConnectionConf) {
    this.connectionConf = conn;
  }

  protected get(requestConf: IWinderRequestConfig): Observable<IWinderResponse> {
    return this.winderService.prepare(this.connectionConf, requestConf).get().pipe(first());
  }

  protected getResponseString(s: Strand | Strand[]): Observable<IWinderResponse> {
    return this.get({ responseType: 'JSON', strands: s });
  }

  protected getResponseResource(s: Strand | Strand[]): Observable<IWinderResponse> {
    return this.get({ responseType: 'resource', strands: s });
  }

  /** GET con un solo Strand, parámetros simples y respuesta JSON. */
  protected getSimpleResponseString(
    strandName: string,
    params: Record<string, unknown>,
    responseName = 'response'
  ): Observable<IWinderResponse> {
    const s = new Strand(strandName, responseName);
    Object.keys(params).forEach((v) => s.pushToPayload(v, params[v]));
    return this.getResponseString(s);
  }

  /** GET sin parámetros de payload. */
  protected getSimpleResponseStringNP(
    strandName: string,
    responseName = 'response'
  ): Observable<IWinderResponse> {
    const s = new Strand(strandName, responseName);
    return this.getResponseString(s);
  }

  /** GET de recurso binario (blob). */
  protected getSimpleResponseResource(
    strandName: string,
    params: Record<string, unknown>,
    responseName = 'response'
  ): Observable<IWinderResponse> {
    const s = new Strand(strandName, responseName);
    Object.keys(params).forEach((v) => s.pushToPayload(v, params[v]));
    return this.getResponseResource(s);
  }

  protected post(requestConf: IWinderRequestConfig): Observable<unknown> {
    return this.winderService.prepare(this.connectionConf, requestConf).post();
  }

  protected postResponseString(s: Strand | Strand[]): Observable<unknown> {
    return this.post({ responseType: 'JSON', strands: s }).pipe(first());
  }

  /** POST con un solo Strand y parámetros simples. */
  protected postSimpleResponseString(
    strandName: string,
    params: Record<string, unknown>
  ): Observable<unknown> {
    const s = new Strand(strandName);
    Object.keys(params).forEach((v) => s.pushToPayload(v, params[v]));
    return this.postResponseString(s);
  }

  /** POST de archivo con parámetros adicionales. */
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

  /** POST de archivo sin parámetros adicionales. */
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

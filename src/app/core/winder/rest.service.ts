import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RESTPacket } from './rest-packet.class';
import type { IWinderResponse } from './winder.interface';

/**
 * RESTService — Capa HTTP de bajo nivel que ejecuta las peticiones al backend Ant.
 *
 * Wrappea `HttpClient` de Angular 22 y opera sobre `RESTPacket`
 * para construir las URLs y el body correctamente.
 *
 * En Angular 22 los servicios son `providedIn: 'root'` por defecto.
 * Se usa `inject()` en lugar del constructor para compatibilidad con Zoneless.
 *
 * Migrado del STG (stg-app-mis-r22).
 */
@Injectable({ providedIn: 'root' })
export class RESTService {
  private readonly http = inject(HttpClient);

  public get<T = IWinderResponse>(config: RESTPacket): Observable<T> {
    const url = config.computeURL();
    const options = config.getOptions() as Parameters<typeof this.http.get>[1];
    return this.http.get<T>(url, options);
  }

  public post<T>(config: RESTPacket): Observable<T> {
    const url = config.computeURL();
    let body: FormData | string;

    if (config.haveFormData()) {
      body = config.getFormData()!;
    } else {
      body = JSON.stringify(config.getPostParams());
    }

    const options = config.getOptions() as Parameters<typeof this.http.post>[2];
    return this.http.post<T>(url, body, options);
  }
}

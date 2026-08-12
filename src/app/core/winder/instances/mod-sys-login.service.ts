import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/** Módulo de Sesión/Login del backend Ant (puerto 6300, appId `session`). */
@Injectable({ providedIn: 'root' })
export class ModSysLoginService extends AntService {
  constructor() {
    super({
      port: 6300,
      secret: environment.moduleSecrets.session,
      appId: 'session',
    });
  }

  /**
   * Login principal: valida el email del usuario contra el backend Ant.
   *
   * @param email Email corporativo del usuario (ej: `oscar.sanchez@confianza.pe`).
   */
  public login(email: string): Observable<IWinderResponse> {
    const s = new Strand('login', 'login_response');
    s.pushToPayload('email', email);
    s.pushToPayload('alt', 0);
    return this.getResponseString(s);
  }

  /**
   * Login alternativo (Google OAuth / segundo factor).
   *
   * @param email Email corporativo del usuario.
   */
  public altLogin(email: string): Observable<IWinderResponse> {
    const s = new Strand('login', 'login_response');
    s.pushToPayload('email', email);
    s.pushToPayload('alt', 1);
    return this.getResponseString(s);
  }

  /**
   * Registra metadatos del dispositivo/cliente en el backend.
   *
   * @param email Email del usuario autenticado.
   * @param meta  Objeto con metadatos (IP, user-agent, geolocalización, etc.).
   */
  public postMeta(email: string, meta: Record<string, unknown>): Observable<unknown> {
    return this.postSimpleResponseString('meta', {
      email,
      meta: JSON.stringify(meta),
    });
  }
}

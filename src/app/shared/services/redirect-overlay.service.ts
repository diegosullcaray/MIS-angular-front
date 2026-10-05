import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface RedirectOverlayState {
  visible: boolean;
  titulo: string;
  subtitulo: string;
  url: string;
  mascotaUrl: string;
}

@Injectable({ providedIn: 'root' })
export class RedirectOverlayService {
  readonly state = signal<RedirectOverlayState>({
    visible: false,
    titulo: 'Redirigiendo...',
    subtitulo: 'Te estamos redirigiendo a la plataforma externa',
    url: '',
    mascotaUrl: '/assets/images/fc/modules/kaypacha/pumas-productivos.png',
  });

  redirigir(destino: string, urlDirecta?: string): void {
    const key = destino.toLowerCase().trim();
    const externalMap = (environment.externalLinks || {}) as Record<string, string>;

    let targetUrl = urlDirecta || externalMap[key];

    if (!targetUrl) targetUrl = key.includes('jira') ? externalMap['jira'] : 'https://stg.confianza.pe';

    const nombre = key.includes('jira') ? 'Mesa de Ayuda Jira' : destino;

    this.state.set({
      visible: true,
      titulo: 'Redirigiendo...',
      subtitulo: `Te estamos redirigiendo a ${nombre}`,
      url: targetUrl,
      mascotaUrl: '/assets/images/fc/modules/kaypacha/pumas-productivos.png',
    });

    setTimeout(() => {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => {
        this.state.update((s) => ({ ...s, visible: false }));
      }, 400);
    }, 1500);
  }
}

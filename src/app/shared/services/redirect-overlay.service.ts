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

  /**
   * Dispara el flujo de redirección con loader, avatar de mascota y fallback a environment.
   * @param destino Nombre o identificador del destino (ej. 'imparables', 'jira')
   * @param urlDirecta URL opcional proveniente del backend (si no existe, usa environment)
   */
  redirigir(destino: string, urlDirecta?: string): void {
    const key = destino.toLowerCase().trim();
    const externalMap = (environment.externalLinks || {}) as Record<string, string>;

    // 1. Resolver URL: prioridad a urlDirecta del backend -> fallback a environment -> fallback default imparables
    let targetUrl = urlDirecta || externalMap[key];

    if (!targetUrl) {
      if (key.includes('imparable')) {
        targetUrl = externalMap['imparables'];
      } else if (key.includes('jira')) {
        targetUrl = externalMap['jira'];
      } else if (key.includes('helpdesk')) {
        targetUrl = externalMap['helpdesk'];
      } else {
        targetUrl = externalMap['imparables'] || 'https://stg.confianza.pe';
      }
    }

    // Nombre amigable para mostrar en el subtítulo del loader
    const nombre = key.includes('jira')
      ? 'Mesa de Ayuda Jira'
      : key.includes('helpdesk')
      ? 'Portal Helpdesk Confianza'
      : key.includes('imparable')
      ? 'Portal Imparables'
      : destino;

    this.state.set({
      visible: true,
      titulo: 'Redirigiendo...',
      subtitulo: `Te estamos redirigiendo a ${nombre}`,
      url: targetUrl,
      mascotaUrl: '/assets/images/fc/modules/kaypacha/pumas-productivos.png',
    });

    // Mostrar loader 1.5s para feedback visual con la mascota antes de redirigir
    setTimeout(() => {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => {
        this.state.update((s) => ({ ...s, visible: false }));
      }, 400);
    }, 1500);
  }
}

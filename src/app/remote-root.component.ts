import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { EjemploComponent } from './pages/ejemplo/ejemplo.component';
import { SLUG_SUBSISTEMA } from './core/shell-contract/shell-contract.service';

type Vista = 'dashboard' | 'ejemplo';

/**
 * ★ Componente RAÍZ EXPUESTO al Host como './Component' (federation.config.mjs).
 *
 * Contrato con el RemoteWrapperComponent del Host:
 *  - Debe exportarse como `default` (también acepta `AppComponent` o
 *    `RemoteRootComponent` como export nombrado).
 *  - Renderiza SOLO el área de contenido: sin header, sidebar ni chrome
 *    propios (RN-01) — el Host es dueño del marco visual.
 *
 * Deep-linking: el Host enruta `/{slug}/**` a este componente. La vista
 * inicial se decide leyendo la URL activa (p. ej. `/subsistema-plantilla/ejemplo`);
 * la navegación interna se maneja con signals y `router.navigate` a subrutas
 * del mismo slug — el breadcrumb del Host las muestra automáticamente (HD-02).
 */
@Component({
  selector: 'remote-root',
  standalone: true,
  imports: [DashboardComponent, EjemploComponent],
  template: `
    <!-- SOLO área de contenido: sin header/sidebar propios (RN-01) -->
    @switch (vista()) {
      @case ('dashboard') { <remote-dashboard (irA)="navegar($event)" /> }
      @case ('ejemplo')   { <remote-ejemplo (volver)="navegar('dashboard')" /> }
    }
  `,
})
export default class RemoteRootComponent {
  private readonly router = inject(Router);

  protected readonly vista = signal<Vista>(this.vistaInicial());

  /** Deriva la vista inicial de la URL profunda (/{slug}/<vista>). */
  private vistaInicial(): Vista {
    const url = this.router.url.split('?')[0];
    const segmentos = url.split('/').filter(Boolean);
    const idx = segmentos.indexOf(SLUG_SUBSISTEMA);
    const interna = idx >= 0 ? segmentos[idx + 1] : undefined;
    return interna === 'ejemplo' ? 'ejemplo' : 'dashboard';
  }

  protected navegar(vista: Vista): void {
    this.vista.set(vista);
    // Refleja la vista en la URL (subruta del mismo slug) para que el
    // breadcrumb del Host la muestre y el deep-link sea compartible.
    // En desarrollo aislado no existe el slug en la URL: se omite.
    const url = this.router.url.split('?')[0];
    if (url.includes(SLUG_SUBSISTEMA)) {
      const base = `/${SLUG_SUBSISTEMA}`;
      this.router.navigate(vista === 'dashboard' ? [base] : [base, vista]);
    }
  }
}

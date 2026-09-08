import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { PreferenciasService } from '../../../full-pages/layout/services/preferencias.service';
import { MenuStgService } from '../../../full-pages/layout/services/menu-stg.service';
import { SEGMENTO_LABELS } from '../../../full-pages/layout/interfaces/navigation.constants';

/** Rutas que no son un reporte y no tienen por qué figurar en los accesos rápidos. */
const NO_SON_REPORTE = ['dashboard', 'login', 'error'];

/**
 * Anota en las preferencias cada reporte que el usuario abre, para los accesos
 * rápidos del Home.
 *
 * Escucha al router en vez de a los componentes: así cubre las 91 pantallas sin
 * que ninguna tenga que colaborar, y el título sale de la misma fuente que ya
 * usa el breadcrumb del header — el árbol del STG cuando cargó, y las etiquetas
 * del Host si no.
 */
@Injectable({ providedIn: 'root' })
export class RecientesService {
  private readonly router = inject(Router);
  private readonly preferencias = inject(PreferenciasService);
  private readonly menuStg = inject(MenuStgService);

  /** Lo arranca `app.config.ts`; a partir de ahí trabaja solo. */
  iniciar(): void {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.registrar(e.urlAfterRedirects));
  }

  private registrar(url: string): void {
    const limpia = url.split('?')[0].split('#')[0];
    const segmentos = limpia.split('/').filter(Boolean);

    if (segmentos[0] !== 'app' || segmentos.length < 3) return;
    if (NO_SON_REPORTE.includes(segmentos[1])) return;

    const { titulo, categoria } = this.describir(limpia, segmentos.slice(1));
    if (titulo) this.preferencias.registrarReporteReciente(limpia, titulo, categoria);
  }

  /** Título y categoría de la pantalla, con la misma lógica que el breadcrumb. */
  private describir(url: string, resto: string[]): { titulo: string; categoria?: string } {
    const hallazgo = this.menuStg.buscarPorRuta(url);
    if (hallazgo?.nodos.length) {
      const nodos = hallazgo.nodos;
      const padre = nodos.length > 1 ? nodos[nodos.length - 2].etiqueta : undefined;
      return { titulo: nodos[nodos.length - 1].etiqueta, categoria: padre };
    }

    const ultimo = resto[resto.length - 1];
    return {
      titulo: SEGMENTO_LABELS[ultimo] ?? this.legible(ultimo),
      categoria: SEGMENTO_LABELS[resto[0]] ?? this.legible(resto[0]),
    };
  }

  private legible(segmento: string): string {
    const texto = segmento.replace(/[-_]/g, ' ').trim();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}

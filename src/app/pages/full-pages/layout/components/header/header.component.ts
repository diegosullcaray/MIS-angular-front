import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown, lucideUser, lucideSettings,
  lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle
} from '@ng-icons/lucide';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import type { MenuItem } from 'primeng/api';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { AuthService } from '../../../auth/service/auth.service';
import { MenuStgService } from '../../services/menu-stg.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';

/** Etiquetas de los segmentos de ruta conocidos del Host. */
const SEGMENTO_LABELS: Record<string, string> = {
  dashboard: 'Mi espacio',
  'ranking-k': 'Ranking Kaypacha',
  'Kaypacha__': 'Kaypacha',
  categoria: 'Categoría',
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIconComponent, BreadcrumbModule, DialogModule, ButtonModule],
  viewProviders: [provideIcons({
    lucideChevronDown, lucideUser, lucideSettings,
    lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle,
  })],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  protected readonly shell = inject(ShellStateService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly menuStg = inject(MenuStgService);
  private readonly kaypacha = inject(KaypachaService);
  protected readonly dropdownOpen = signal(false);
  protected readonly confirmarSalirOpen = signal(false);

  /** URL actual como signal (zoneless-friendly). */
  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** Ítem raíz del breadcrumb (Host). */
  protected readonly breadcrumbHome: MenuItem = {
    icon: 'pi pi-home',
    routerLink: '/app/dashboard',
  };

  /** Modelo del p-breadcrumb derivado de la ruta activa. */
  protected readonly breadcrumbItems = computed<MenuItem[]>(() => {
    const url = this.urlActual().split('?')[0].split('#')[0];
    const segmentos = url.split('/').filter(Boolean);

    // Solo rutas del shell: /app/...
    if (segmentos[0] !== 'app') return [];

    const resto = segmentos.slice(1);
    if (resto.length === 0) return [];

    // Si el primer segmento no es una ruta propia del Host, es un remote:
    // sus subsegmentos son rutas internas del subsistema, no vistas del Host.
    const esRemote = !(resto[0] in SEGMENTO_LABELS);

    return esRemote ? this.breadcrumbRemote(resto, url) : this.breadcrumbHost(resto);
  });

  /** Breadcrumb de las rutas propias del Host, a partir de `SEGMENTO_LABELS`. */
  private breadcrumbHost(resto: string[]): MenuItem[] {
    const items: MenuItem[] = [];
    let rutaAcumulada = '/app';

    for (let i = 0; i < resto.length; i++) {
      const seg = resto[i];
      rutaAcumulada += `/${seg}`;

      let label = SEGMENTO_LABELS[seg];

      if (!label && resto[i - 1] === 'categoria') {
        // El segmento es el :id (rdestip) de la categoría de Kaypacha.
        label = this.kaypacha.buscarCategoria(seg)?.name ?? 'Detalle';
      }

      if (!label) {
        label = 'Detalle';
      }

      const esUltimo = i === resto.length - 1;
      items.push(esUltimo ? { label } : { label, routerLink: rutaAcumulada });
    }

    return items;
  }

  /**
   * Breadcrumb de un sistema de STG (backend Ant) todavía no migrado a un
   * módulo propio del Host. El resto de la URL es la ruta interna
   * (`act_sec`) de la hoja activa — el slug real del sistema (`cod_sec`) no
   * aparece como segmento propio, va embebido ahí. Por eso no se puede leer
   * el sistema de `resto[0]`: se busca la hoja completa en el árbol de STG
   * (`MenuStgService`, a través de todos los sistemas) y de ahí salen tanto
   * el sistema real como las etiquetas de sus ancestros.
   */
  private breadcrumbRemote(resto: string[], url: string): MenuItem[] {
    const hallazgo = this.menuStg.buscarPorRuta(url);

    if (hallazgo) {
      const items: MenuItem[] = [{ label: this.labelDeRemote(hallazgo.sistemaId) }];
      hallazgo.etiquetas.forEach((label) => items.push({ label }));
      return items;
    }

    // El árbol de STG todavía no cargó o no encontró la hoja: se muestra
    // igual el último segmento (mejor que nada), legible en vez de crudo.
    const items: MenuItem[] = [{ label: this.labelDeRemote(resto[0]) }];
    if (resto.length > 1) {
      items.push({ label: this.prettify(resto[resto.length - 1]) });
    }
    return items;
  }

  protected readonly rolLabel = computed(() => {
    const labels: Record<string, string> = {
      'admin-sistema': 'Admin Sistema',
      'admin-general': 'Admin General',
      'supervisor-area': 'Supervisor',
    };
    return labels[this.shell.usuarioActivo()?.rol ?? ''] ?? '';
  });

  protected toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  protected pedirConfirmacionSalir(): void {
    this.dropdownOpen.set(false);
    this.confirmarSalirOpen.set(true);
  }

  protected async confirmarCerrarSesion(): Promise<void> {
    this.confirmarSalirOpen.set(false);
    // El overlay se pinta desde AppComponent (raíz) para no quedar atrapado
    // dentro del contenedor del header, que tiene backdrop-blur y por lo
    // tanto rompe el "position: fixed" del spinner (crea un containing block).
    this.shell.setCerrandoSesion(true);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    this.auth.cerrarSesion();
  }

  private labelDeRemote(slug: string): string {
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    return stg?.etiqueta ?? this.prettify(slug.replace('subsistema-', ''));
  }

  /** kebab-case → texto legible: 'reportes-operativos' → 'Reportes operativos' */
  private prettify(seg: string): string {
    const texto = seg.replace(/-/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}

import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown, lucideChevronRight, lucideUser, lucideSettings,
  lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle, lucideHome,
} from '@ng-icons/lucide';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { AuthService } from '../../../auth/service/auth.service';
import { SistemasService } from '../../../../modules/admin/sistemas/services/sistemas.service';
import { MenuStgService } from '../../services/menu-stg.service';

/** Etiquetas de los segmentos de ruta conocidos del Host. */
const SEGMENTO_LABELS: Record<string, string> = {
  dashboard: 'Mi espacio',
  usuarios:  'Usuarios',
  roles:     'Roles',
  sistemas:  'Sistemas',
  help:      'Ayuda',
  faq:       'Preguntas frecuentes',
  guias:     'Guías de uso',
  contacto:  'Contacto',
  nuevo:     'Nuevo',
  editar:    'Editar',
};

/** Ítem de breadcrumb — reemplaza a `MenuItem` de `primeng/api`. */
interface BreadcrumbItem {
  label: string;
  routerLink?: string;
  icon?: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIconComponent, RouterLink],
  viewProviders: [provideIcons({
    lucideChevronDown, lucideChevronRight, lucideUser, lucideSettings,
    lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle, lucideHome,
  })],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  protected readonly shell = inject(ShellStateService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sistemasService = inject(SistemasService);
  private readonly menuStg = inject(MenuStgService);
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
  protected readonly breadcrumbHome: BreadcrumbItem = {
    label: 'Inicio',
    icon: 'lucideHome',
    routerLink: '/admin/dashboard',
  };

  /** Modelo del breadcrumb derivado de la ruta activa. */
  protected readonly breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const url = this.urlActual().split('?')[0].split('#')[0];
    const segmentos = url.split('/').filter(Boolean);

    // Solo rutas del shell: /admin/...
    if (segmentos[0] !== 'admin') return [];

    const resto = segmentos.slice(1);
    if (resto.length === 0) return [];

    // Si el primer segmento no es una ruta propia del Host, es un remote:
    // sus subsegmentos son rutas internas del subsistema, no vistas del Host.
    const esRemote = !(resto[0] in SEGMENTO_LABELS);

    return esRemote ? this.breadcrumbRemote(resto, url) : this.breadcrumbHost(resto);
  });

  /** Breadcrumb de las rutas propias del Host, a partir de `SEGMENTO_LABELS`. */
  private breadcrumbHost(resto: string[]): BreadcrumbItem[] {
    const items: BreadcrumbItem[] = [];
    let rutaAcumulada = '/admin';

    for (let i = 0; i < resto.length; i++) {
      const seg = resto[i];
      rutaAcumulada += `/${seg}`;

      let label = SEGMENTO_LABELS[seg];

      if (!label) {
        if (resto[i + 1] === 'editar') {
          // Un :id seguido de /editar no aporta al breadcrumb
          continue;
        }
        // /usuarios/:id es edición; /roles/:id y /sistemas/:id son detalle
        label = resto[i - 1] === 'usuarios' ? 'Editar' : 'Detalle';
      }

      const esUltimo = i === resto.length - 1;
      items.push(esUltimo ? { label } : { label, routerLink: rutaAcumulada });
    }

    return items;
  }

  /**
   * Breadcrumb de un sistema remoto (STG). El remote de Module Federation
   * se llama siempre "app" (ver RemoteWrapperComponent) y el resto de la
   * URL es la ruta interna (`act_sec`) de la hoja activa — el slug real del
   * sistema (`cod_sec`) no aparece como segmento propio, va embebido ahí.
   * Por eso no se puede leer el sistema de `resto[0]`: se busca la hoja
   * completa en el árbol de STG (`MenuStgService`, a través de todos los
   * sistemas) y de ahí salen tanto el sistema real como las etiquetas de
   * sus ancestros.
   */
  private breadcrumbRemote(resto: string[], url: string): BreadcrumbItem[] {
    const hallazgo = this.menuStg.buscarPorRuta(url);

    if (hallazgo) {
      const items: BreadcrumbItem[] = [{ label: this.labelDeRemote(hallazgo.sistemaId) }];
      hallazgo.etiquetas.forEach((label) => items.push({ label }));
      return items;
    }

    // El árbol de STG todavía no cargó o no encontró la hoja: se muestra
    // igual el último segmento (mejor que nada), legible en vez de crudo.
    const items: BreadcrumbItem[] = [{ label: this.labelDeRemote(resto[0]) }];
    if (resto.length > 1) {
      items.push({ label: this.prettify(resto[resto.length - 1]) });
    }
    return items;
  }

  protected readonly rolLabel = computed(() => {
    const labels: Record<string, string> = {
      'admin-sistema':   'Admin Sistema',
      'admin-general':   'Admin General',
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
    if (stg) return stg.etiqueta;

    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.nombre ?? this.prettify(slug.replace('subsistema-', ''));
  }

  /** kebab-case → texto legible: 'reportes-operativos' → 'Reportes operativos' */
  private prettify(seg: string): string {
    const texto = seg.replace(/-/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}

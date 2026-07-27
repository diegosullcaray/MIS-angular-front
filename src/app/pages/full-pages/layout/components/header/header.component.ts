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
import { SistemasService } from '../../../../modules/admin/sistemas/services/sistemas.service';

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
  private readonly sistemasService = inject(SistemasService);
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
    routerLink: '/admin/dashboard',
  };

  /** Modelo del p-breadcrumb derivado de la ruta activa. */
  protected readonly breadcrumbItems = computed<MenuItem[]>(() => {
    const url = this.urlActual().split('?')[0].split('#')[0];
    const segmentos = url.split('/').filter(Boolean);

    // Solo rutas del shell: /admin/...
    if (segmentos[0] !== 'admin') return [];

    const items: MenuItem[] = [];
    let rutaAcumulada = '/admin';

    const resto = segmentos.slice(1);
    // Si el primer segmento no es una ruta propia del Host, es un remote:
    // sus subsegmentos son rutas internas del subsistema, no vistas del Host.
    const esRemote = !(resto[0] in SEGMENTO_LABELS);

    for (let i = 0; i < resto.length; i++) {
      const seg = resto[i];
      rutaAcumulada += `/${seg}`;

      let label: string | undefined;

      if (esRemote) {
        label = i === 0 ? this.labelDeRemote(seg) : this.prettify(seg);
      } else {
        label = SEGMENTO_LABELS[seg];

        if (!label) {
          if (resto[i + 1] === 'editar') {
            // Un :id seguido de /editar no aporta al breadcrumb
            continue;
          }
          // /usuarios/:id es edición; /roles/:id y /sistemas/:id son detalle
          label = resto[i - 1] === 'usuarios' ? 'Editar' : 'Detalle';
        }
      }

      const esUltimo = i === resto.length - 1;
      items.push(esUltimo ? { label } : { label, routerLink: rutaAcumulada });
    }

    return items;
  });

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
    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    return sistema?.nombre ?? this.prettify(slug.replace('subsistema-', ''));
  }

  /** kebab-case → texto legible: 'reportes-operativos' → 'Reportes operativos' */
  private prettify(seg: string): string {
    const texto = seg.replace(/-/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}

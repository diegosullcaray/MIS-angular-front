import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown, lucideUser, lucideSettings,
  lucideLogOut, lucideBell, lucideSearch
} from '@ng-icons/lucide';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import type { MenuItem } from 'primeng/api';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { AuthService } from '../../../auth/service/auth.service';
import { SistemasService } from '../../../../modules/sistemas/services/sistemas.service';

/** Etiquetas de los segmentos de ruta conocidos del Host. */
const SEGMENTO_LABELS: Record<string, string> = {
  dashboard: 'Mi espacio',
  accesos:   'Accesos',
  usuarios:  'Usuarios',
  roles:     'Roles',
  sistemas:  'Sistemas',
  nuevo:     'Nuevo',
  editar:    'Editar',
};

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIconComponent, BreadcrumbModule],
  viewProviders: [provideIcons({
    lucideChevronDown, lucideUser, lucideSettings,
    lucideLogOut, lucideBell, lucideSearch,
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
    for (let i = 0; i < resto.length; i++) {
      const seg = resto[i];
      rutaAcumulada += `/${seg}`;

      let label = SEGMENTO_LABELS[seg];

      if (!label) {
        if (i === 0) {
          // /admin/:remoteName → nombre del sistema embebido
          label = this.labelDeRemote(seg);
        } else if (resto[i + 1] === 'editar') {
          // Un :id seguido de /editar no aporta al breadcrumb
          continue;
        } else {
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

  protected cerrarSesion(): void {
    // Limpia estado + sessionStorage y redirige al login
    this.auth.cerrarSesion();
    this.dropdownOpen.set(false);
  }

  private labelDeRemote(slug: string): string {
    const sistema = this.sistemasService.sistemas().find(s => s.slug === slug);
    if (sistema) return sistema.nombre;
    const limpio = slug.replace('subsistema-', '');
    return limpio.charAt(0).toUpperCase() + limpio.slice(1);
  }
}

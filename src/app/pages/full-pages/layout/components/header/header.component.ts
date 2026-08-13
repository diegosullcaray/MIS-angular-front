import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

// Iconos
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown, lucideUser, lucideSettings,
  lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle,
  lucideUsers, lucideSun, lucideMoon
} from '@ng-icons/lucide';

// PrimeNG
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import type { MenuItem } from 'primeng/api';

// Servicios y Componentes
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { ThemeService } from '../../../../../core/services/theme.service';
import { AuthService } from '../../../auth/service/auth.service';
import { MenuStgService } from '../../services/menu-stg.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import { CambiarUsuarioDialogComponent } from '../dialogs/cambiar-usuario-dialog/cambiar-usuario-dialog.component';
import { SEGMENTO_LABELS } from '../../interfaces/navigation.constants';



@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIconComponent, BreadcrumbModule, DialogModule, ButtonModule, CambiarUsuarioDialogComponent],
  viewProviders: [
    provideIcons({
      lucideChevronDown, lucideUser, lucideSettings,
      lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle,
      lucideUsers, lucideSun, lucideMoon
    })
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  // ─── Dependencias ──────────────────────────────────────────────────────────
  protected readonly shell = inject(ShellStateService);
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly menuStg = inject(MenuStgService);
  private readonly kaypacha = inject(KaypachaService);

  // ─── Estado Local (Signals) ───────────────────────────────────────────────
  protected readonly dropdownOpen = signal(false);
  protected readonly confirmarSalirOpen = signal(false);
  protected readonly cambiarUsuarioOpen = signal(false);

  /** URL actual capturada para reaccionar a cambios de ruta. */
  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  // ─── Estado Computado ─────────────────────────────────────────────────────
  protected readonly logoMis = computed(() =>
    this.theme.oscuro() ? 'assets/images/fc/logos/mis_white.png' : 'assets/images/fc/logos/mis.png'
  );

  protected readonly rolLabel = computed(() => {
    const roles: Record<string, string> = {
      'admin-sistema': 'Admin Sistema',
      'admin-general': 'Admin General',
      'supervisor-area': 'Supervisor',
    };
    return roles[this.shell.usuarioActivo()?.rol ?? ''] ?? '';
  });

  // ─── Configuración de Breadcrumb ──────────────────────────────────────────
  protected readonly breadcrumbHome: MenuItem = { icon: 'pi pi-home', routerLink: '/app/dashboard' };

  /** Construye la ruta de navegación superior basándose en la URL activa. */
  protected readonly breadcrumbItems = computed<MenuItem[]>(() => {
    const url = this.urlActual().split('?')[0].split('#')[0];
    const segmentos = url.split('/').filter(Boolean);

    // Ignora rutas que no sean del shell principal (/app/...)
    if (segmentos[0] !== 'app' || segmentos.length < 2) return [];

    const resto = segmentos.slice(1);
    const esRemote = !(resto[0] in SEGMENTO_LABELS);

    return esRemote ? this.breadcrumbRemote(resto, url) : this.breadcrumbHost(resto);
  });

  // ─── Acciones de la Vista ─────────────────────────────────────────────────
  protected toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  protected pedirConfirmacionSalir(): void {
    this.cerrarDropdownYAbrir(this.confirmarSalirOpen);
  }

  protected abrirCambiarUsuario(): void {
    this.cerrarDropdownYAbrir(this.cambiarUsuarioOpen);
  }

  protected volverAUsuarioOriginal(): void {
    this.dropdownOpen.set(false);
    this.auth.volverAUsuarioOriginal();
  }

  protected async confirmarCerrarSesion(): Promise<void> {
    this.confirmarSalirOpen.set(false);
    // El overlay de carga (spinner) se maneja a nivel raíz para evitar problemas de z-index
    this.shell.setCerrandoSesion(true);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    this.auth.cerrarSesion();
  }

  // ─── Métodos Privados ─────────────────────────────────────────────────────

  /** Helper para cerrar el menú y abrir un dialog específico. */
  private cerrarDropdownYAbrir(modalSignal: typeof this.confirmarSalirOpen): void {
    this.dropdownOpen.set(false);
    modalSignal.set(true);
  }

  /** Genera el breadcrumb mapeando los segmentos nativos. */
  private breadcrumbHost(resto: string[]): MenuItem[] {
    let rutaAcumulada = '/app';

    return resto.map((seg, index) => {
      rutaAcumulada += `/${seg}`;
      let label = SEGMENTO_LABELS[seg];

      // Excepción: Búsqueda dinámica de nombre de categoría para Kaypacha
      if (!label && resto[index - 1] === 'categoria') {
        label = this.kaypacha.buscarCategoria(seg)?.name ?? 'Detalle';
      }

      label = label || 'Detalle';
      const esUltimo = index === resto.length - 1;

      return esUltimo ? { label } : { label, routerLink: rutaAcumulada };
    });
  }

  /** Genera el breadcrumb dinámico extrayendo datos del árbol del menú STG (sistemas remotos). */
  private breadcrumbRemote(resto: string[], url: string): MenuItem[] {
    const hallazgo = this.menuStg.buscarPorRuta(url);

    if (hallazgo) {
      return [
        { label: this.labelDeRemote(hallazgo.sistemaId) },
        ...hallazgo.etiquetas.map(label => ({ label }))
      ];
    }

    // Fallback: Muestra el último segmento limpio si el árbol aún no cargó.
    const items: MenuItem[] = [{ label: this.labelDeRemote(resto[0]) }];
    if (resto.length > 1) {
      items.push({ label: this.prettify(resto[resto.length - 1]) });
    }
    return items;
  }

  private labelDeRemote(slug: string): string {
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    return stg?.etiqueta ?? this.prettify(slug.replace('subsistema-', ''));
  }

  /** Convierte formato URL a texto legible (ej: 'cartera-credito' -> 'Cartera credito'). */
  private prettify(seg: string): string {
    const texto = seg.replace(/-/g, ' ');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
}
import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

// Iconos
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown, lucideUser, lucideSettings,
  lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle,
  lucideUsers, lucideSun, lucideMoon, lucideMenu
} from '@ng-icons/lucide';

// PrimeNG
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import type { MenuItem } from 'primeng/api';

// Servicios y Componentes
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { ThemeService } from '../../../../../shared/services/theme.service';
import { PreferenciasService } from '../../../../../core/preferencias/aplicacion/preferencias.service';
import { AnunciosService } from '../../../../../core/preferencias/aplicacion/anuncios.service';
import { AuthService } from '../../../auth/service/auth.service';
import { MenuStgService } from '../../services/menu-stg.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import { CambiarUsuarioDialogComponent } from '../dialogs/cambiar-usuario-dialog/cambiar-usuario-dialog.component';
import { ConfiguracionDialogComponent } from '../dialogs/configuracion-dialog/configuracion-dialog.component';
import { SEGMENTO_LABELS } from '../../interfaces/navigation.constants';



@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgIconComponent, BreadcrumbModule, DialogModule, ButtonModule, CambiarUsuarioDialogComponent, ConfiguracionDialogComponent],
  viewProviders: [
    provideIcons({
      lucideChevronDown, lucideUser, lucideSettings,
      lucideLogOut, lucideBell, lucideSearch, lucideAlertTriangle,
      lucideUsers, lucideSun, lucideMoon, lucideMenu
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
  protected readonly anuncios = inject(AnunciosService);
  private readonly preferencias = inject(PreferenciasService);
  private readonly router = inject(Router);
  private readonly menuStg = inject(MenuStgService);
  private readonly navegacion = inject(NavegacionSistemasService);
  private readonly kaypacha = inject(KaypachaService);

  // ─── Estado Local (Signals) ───────────────────────────────────────────────
  protected readonly dropdownOpen = signal(false);
  protected readonly confirmarSalirOpen = signal(false);
  protected readonly cambiarUsuarioOpen = signal(false);
  protected readonly configuracionOpen = signal(false);

  /** URL actual capturada para reaccionar a cambios de ruta. */
  private readonly urlActual = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(e => e.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  // ─── Estado Computado ─────────────────────────────────────────────────────

  /** En modo superpuesto el rail no está anclado: el header es su único disparador. */
  protected readonly menuSuperpuesto = computed(
    () => this.preferencias.estructura().modoSidebar === 'superpuesto',
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

  /** Ruta de navegación superior. Mientras está a la vista el explorador del sistema, refleja la carpeta abierta ahí (que no es una URL); si no, se deriva de la URL activa. */
  protected readonly breadcrumbItems = computed<MenuItem[]>(() => {
    if (this.shell.contenidoPendienteSeleccion()) return this.breadcrumbExplorador();

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

  protected alternarRail(): void {
    this.shell.setRailSuperpuestoAbierto(!this.shell.railSuperpuestoAbierto());
  }

  protected pedirConfirmacionSalir(): void {
    this.cerrarDropdownYAbrir(this.confirmarSalirOpen);
  }

  protected abrirCambiarUsuario(): void {
    this.cerrarDropdownYAbrir(this.cambiarUsuarioOpen);
  }

  protected abrirConfiguracion(): void {
    this.cerrarDropdownYAbrir(this.configuracionOpen);
  }

  /** El tema se cambia por preferencias: `ThemeService` solo pinta, no guarda. */
  protected alternarTema(): void {
    this.preferencias.alternarTema();
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
    await this.auth.cerrarSesion();
  }

  // ─── Métodos Privados ─────────────────────────────────────────────────────

  /** Helper para cerrar el menú y abrir un dialog específico. */
  private cerrarDropdownYAbrir(modalSignal: typeof this.confirmarSalirOpen): void {
    this.dropdownOpen.set(false);
    modalSignal.set(true);
  }

  /** Ubicación dentro del explorador; cada miga vuelve a su nivel. */
  private breadcrumbExplorador(): MenuItem[] {
    const panel = this.navegacion.panelActivo();
    if (!panel) return [];

    return [
      { label: panel.titulo, command: () => this.navegacion.irANivel(-1) },
      ...this.navegacion.rutaExplorador().map((carpeta, i) => ({
        label: carpeta.etiqueta,
        command: () => this.navegacion.irANivel(i),
      })),
    ];
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
      const carpetas = hallazgo.nodos.slice(0, -1);
      return [
        { label: this.labelDeRemote(hallazgo.sistemaId), command: () => this.navegacion.abrirEnCarpeta(hallazgo.sistemaId, []) },
        ...carpetas.map((nodo, i) => ({
          label: nodo.etiqueta,
          command: () => this.navegacion.abrirEnCarpeta(hallazgo.sistemaId, carpetas.slice(0, i + 1)),
        })),
        { label: hallazgo.nodos[hallazgo.nodos.length - 1].etiqueta },
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

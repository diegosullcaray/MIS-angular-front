import { Component, inject, effect, signal, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuStgService } from '../../services/menu-stg.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import { RedirectOverlayService } from '../../../../../shared/services/redirect-overlay.service';
import type { SidebarIcon } from '../../interfaces/sidebar.model';

/** Duración de la transición (esqueleto) al cambiar de sistema. */
const DURACION_TRANSICION_PANEL_MS = 300;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [SidebarNavPanelComponent, TooltipModule, SkeletonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent implements AfterViewInit {
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLDivElement>;

  protected readonly shell = inject(ShellStateService);
  private readonly menuStg = inject(MenuStgService);
  private readonly navegacion = inject(NavegacionSistemasService);
  private readonly kaypacha = inject(KaypachaService);
  private readonly redirect = inject(RedirectOverlayService);
  private readonly router = inject(Router);

  /** Indica si el panel está en transición (muestra el esqueleto de carga). */
  protected readonly cambiandoPanel = signal(false);
  
  protected readonly iconActivoId = this.shell.sidebarIconActivo;

  /** Estado de visibilidad de las flechas de scroll horizontal en mobile. */
  protected readonly puedeScrollIzquierda = signal(false);
  protected readonly puedeScrollDerecha = signal(false);

  constructor() {
    this.kaypacha.cargarCategorias();

    // Re-evalúa visibilidad de flechas cuando la lista de íconos se actualice.
    effect(() => {
      this.iconos();
      setTimeout(() => this.verificarScroll(), 150);
    });

    // Sincroniza el estado del header: oculta el botón de menú si el sistema actual no tiene panel.
    effect(() => {
      this.shell.setSidebarTienePanel(this.panelActivo() !== null);
    });

    // Recarga el árbol del menú STG si el usuario activo cambia (ej. modo alterno).
    effect(() => {
      const email = this.shell.usuarioActivo()?.email;
      if (email) {
        this.menuStg.cargar(email);
      }
    });

    // Apaga `contenidoPendienteSeleccion` cuando el Router termina de resolver la navegación.
    this.router.events
      .pipe(
        filter(
          (evento) =>
            evento instanceof NavigationEnd ||
            evento instanceof NavigationCancel ||
            evento instanceof NavigationError ||
            evento instanceof NavigationSkipped
        ),
        takeUntilDestroyed()
      )
      .subscribe((evento) => {
        if (evento instanceof NavigationEnd || evento instanceof NavigationError || evento instanceof NavigationSkipped) {
          this.shell.setContenidoPendienteSeleccion(false);
        }

        if (evento instanceof NavigationEnd) {
          const url = evento.urlAfterRedirects || evento.url;
          // `startsWith('/app/dashboard/')` (con la barra) en vez de `includes('/dashboard')`:
          // ese `includes` también hacía match con `/app/dashboards` (Dashboards Integrados,
          // otro sistema con su propio ícono) por ser substring, así que después de navegar
          // ahí este handler pisaba `sidebarIconActivo` de vuelta a "host-inicio".
          const esInicio = url === '/app/dashboard' || url.startsWith('/app/dashboard/') || url.startsWith('/error') || url === '/app';
          if (esInicio) {
            this.shell.setSidebarIconActivo('host-inicio');
          }
        }
      });
  }

  /** Lista combinada de íconos base y los que provienen del backend STG. */
  protected readonly iconos = this.navegacion.iconos;

  /** Navegación del sistema activo. Es `null` si el sistema no tiene subnavegación. */
  protected readonly panelActivo = this.navegacion.panelActivo;

  /** Acción al hacer clic en un ícono de la columna principal (Col 1). */
  protected seleccionarIcono(icon: SidebarIcon): void {
    const eraActivo = this.shell.sidebarIconActivo();
    this.shell.setSidebarIconActivo(icon.id);

    const key = (icon.etiqueta || icon.id || '').toLowerCase();
    const ruta = icon.ruta || '';
    
    // Verificación de enlaces externos
    const esExterno = ['jira', 'imparable', 'helpdesk'].some(ext => key.includes(ext)) || ruta.startsWith('http');
    if (esExterno) {
      this.shell.setContenidoPendienteSeleccion(false);
      this.redirect.redirigir(icon.etiqueta || icon.id, ruta.startsWith('http') ? ruta : undefined);
      return;
    }

    // Transición visual para sistemas con panel. Ya no se fuerza a abrir la
    // Col 2: la navegación pasó al explorador del área de contenido y el panel
    // de links quedó como pane opcional, que el usuario abre si lo quiere.
    if (icon.tienePanel && eraActivo !== icon.id) {
      this.cambiandoPanel.set(true);
      setTimeout(() => this.cambiandoPanel.set(false), DURACION_TRANSICION_PANEL_MS);
    }

    // Caso especial: Inicio navega directamente al dashboard
    if (icon.id === 'host-inicio') {
      this.shell.setContenidoPendienteSeleccion(false);
      this.router.navigateByUrl('/app/dashboard').catch(() => {});
      return;
    }

    // Módulos simples sin panel secundario que tienen ruta propia
    if (!icon.tienePanel && ruta) {
      this.shell.setContenidoPendienteSeleccion(false);
      this.router.navigateByUrl(ruta).catch(() => {
        console.warn(`Ruta no encontrada: ${ruta}`);
      });
      return;
    }

    // Sistemas con subnavegación: el área de contenido muestra el explorador
    // del sistema (`ExploradorSistemaComponent`) hasta que el usuario abra una
    // de sus pantallas. Permanece ahí de forma indefinida (sin
    // auto-redirecciones ni reseteo por tiempo).
    if (icon.tienePanel) {
      this.shell.setContenidoPendienteSeleccion(true);
    }
  }

  /** Acción al seleccionar un sub-ítem del panel (Col 2). */
  protected onRutaSeleccionada(ruta: string): void {
    this.shell.setMenuItemActivo({ ruta, etiqueta: ruta.split('/').pop() ?? '' });
    this.shell.setContenidoPendienteSeleccion(false);

    if (ruta) {
      this.router.navigateByUrl(ruta).catch((err) => {
        console.warn(`Ruta no encontrada: ${ruta}`, err);
      });
    }

    // En pantallas pequeñas, el panel se oculta tras la selección para dejar ver el contenido.
    if (this.esMobil()) {
      this.shell.setNavPanelColapsado(true);
    }
  }

  /** Detecta si el ancho de pantalla corresponde al breakpoint `sm` (640px). */
  private esMobil(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < 640;
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.verificarScroll(), 100);
  }

  @HostListener('window:resize')
  protected onResize(): void {
    this.verificarScroll();
  }

  protected onScrollMobile(): void {
    this.verificarScroll();
  }

  protected desplazarIzquierda(): void {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollBy({ left: -140, behavior: 'smooth' });
    }
  }

  protected desplazarDerecha(): void {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollBy({ left: 140, behavior: 'smooth' });
    }
  }

  private verificarScroll(): void {
    const el = this.scrollContainer?.nativeElement;
    if (!el) return;

    const tieneScroll = el.scrollWidth > el.clientWidth + 2;
    this.puedeScrollIzquierda.set(el.scrollLeft > 2);
    this.puedeScrollDerecha.set(tieneScroll && el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }
}
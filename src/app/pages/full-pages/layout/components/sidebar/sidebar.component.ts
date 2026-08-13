import { Component, inject, computed, effect, signal, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { SidebarNavPanelComponent } from '../sidebar-nav-panel/sidebar-nav-panel.component';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { MenuStgService } from '../../services/menu-stg.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import { RedirectOverlayService } from '../../../../../shared/services/redirect-overlay.service';
import type { SidebarIcon, SidebarNavPanelConfig, SidebarNavRuta, SidebarNavSeccion } from '../../interfaces/sidebar.model';

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
          if (url.includes('/dashboard') || url.startsWith('/error') || url === '/app') {
            this.shell.setSidebarIconActivo('host-inicio');
          }
        }
      });
  }

  /** Lista combinada de íconos base y los que provienen del backend STG. */
  protected readonly iconos = computed<SidebarIcon[]>(() => {
    const base: SidebarIcon[] = [
      { id: 'host-inicio', tipo: 'host-inicio', icono: 'pi pi-home', etiqueta: 'Inicio', tienePanel: true }
    ];

    const sistemasStg = this.menuStg.sistemas().map((sistema) => {
      const forzarPanel = sistema.ruta === this.kaypacha.ruta || this.esAnalista(sistema);
      return forzarPanel ? { ...sistema, tienePanel: true } : sistema;
    });

    return [...base, ...sistemasStg];
  });

  /** Configuración del panel secundario activo (Col 2). Es `null` si no aplica. */
  protected readonly panelActivo = computed<SidebarNavPanelConfig | null>(() => {
    const id = this.shell.sidebarIconActivo();

    if (id === 'host-inicio') return this.getPanelHost();

    const icono = this.iconos().find(i => i.id === id);
    if (!icono?.tienePanel) return null;

    if (icono.ruta === this.kaypacha.ruta) return this.kaypacha.panelPara(icono.etiqueta, icono.icono);
    if (this.esAnalista(icono)) return this.getPanelAnalista(icono.etiqueta, icono.icono);

    return this.getPanelStg(id);
  });

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

    // Transición visual para sistemas con panel
    if (icon.tienePanel && (eraActivo !== icon.id || this.shell.navPanelColapsado())) {
      this.cambiandoPanel.set(true);
      this.shell.setNavPanelColapsado(false);
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

    // Sistemas con panel secundario: abren el panel y muestran el loader/spinner neutro
    // en el área de contenido a la espera de que el usuario elija un sub-ítem.
    // Permanece ahí de forma indefinida (sin auto-redirecciones ni reseteo por tiempo).
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

  private getPanelHost(): SidebarNavPanelConfig {
    return {
      tipo: 'host-admin',
      titulo: 'Host Principal',
      icono: 'pi pi-home',
      secciones: [
        {
          titulo: 'Acceso directo',
          rutas: [{ etiqueta: 'Mi espacio', ruta: '/app/dashboard', icono: 'lucideGrid' }],
        },
      ],
    };
  }

  private esAnalista(icono: SidebarIcon): boolean {
    return (icono.etiqueta || '').trim().toLowerCase() === 'analista';
  }

  private getPanelAnalista(titulo: string, icono: string): SidebarNavPanelConfig {
    return {
      tipo: 'host-admin',
      titulo,
      icono,
      secciones: [
        {
          rutas: [
            { etiqueta: 'Principal', ruta: '/app/analista', icono: 'pi pi-home' },
            { etiqueta: 'Categorización', ruta: '/app/analista/categorizacion', icono: 'pi pi-briefcase' },
            {
              etiqueta: 'Listas',
              icono: 'pi pi-list',
              hijos: [
                { etiqueta: 'Priorización de Leads', ruta: '/app/analista/listas/priorizacion-leads' },
                { etiqueta: 'Becas Financiera Confianza', ruta: '/app/analista/listas/becas' },
              ],
            },
          ],
        },
      ],
    };
  }

  /** Genera el panel para módulos legacy no migrados, basándose en la data del menú STG. */
  private getPanelStg(slug: string): SidebarNavPanelConfig {
    const hijosStg = this.menuStg.hijosPorSistema()[slug] ?? [];
    const stg = this.menuStg.sistemas().find(s => s.id === slug);
    const titulo = stg?.etiqueta ?? slug;

    return {
      tipo: 'remote',
      titulo,
      icono: stg?.icono ?? 'pi pi-th-large',
      secciones: [{ titulo, rutas: hijosStg }],
    };
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
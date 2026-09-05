import { Component, computed, inject, effect, signal, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationSkipped, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { PreferenciasService } from '../../../../../core/preferencias/aplicacion/preferencias.service';
import { TooltipModule } from 'primeng/tooltip';
import { MenuStgService } from '../../services/menu-stg.service';
import { NavegacionSistemasService } from '../../services/navegacion-sistemas.service';
import { KaypachaService } from '../../../../modules/ranking-k/services/kaypacha.service';
import { RedirectOverlayService } from '../../../../../shared/services/redirect-overlay.service';
import type { SidebarIcon } from '../../interfaces/sidebar.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [TooltipModule, RouterLink],
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
  private readonly preferencias = inject(PreferenciasService);
  private readonly router = inject(Router);

  protected readonly iconActivoId = this.shell.sidebarIconActivo;

  /** El rail no está anclado: se abre sobre el contenido y se cierra al elegir. */
  protected readonly superpuesto = computed(() => this.preferencias.estructura().modoSidebar === 'superpuesto');
  protected readonly railAbierto = this.shell.railSuperpuestoAbierto;

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
          // Con la barra final: `includes('/dashboard')` también matcheaba `/app/dashboards`, otro sistema, y le pisaba el ícono activo.
          const esInicio = url === '/app/dashboard' || url.startsWith('/app/dashboard/') || url.startsWith('/error') || url === '/app';
          if (esInicio) {
            this.shell.setSidebarIconActivo('host-inicio');
            this.navegacion.rutaExplorador.set([]);
          }
        }
      });
  }

  /** Lista combinada de íconos base y los que provienen del backend STG. */
  protected readonly iconos = this.navegacion.iconos;

  protected cerrarRail(): void {
    this.shell.setRailSuperpuestoAbierto(false);
  }

  /** Acción al hacer clic en un ícono de la columna principal (Col 1). */
  protected seleccionarIcono(icon: SidebarIcon): void {
    // En superpuesto el rail tapa el contenido: elegir un sistema tiene que
    // devolver la vista, no dejar el panel abierto encima de lo que se abrió.
    this.cerrarRail();

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

    // Al cambiar a un sistema con subnavegación, reinicia el explorador a su raíz.
    if (icon.tienePanel && eraActivo !== icon.id) {
      this.navegacion.rutaExplorador.set([]);
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
      this.router.navigateByUrl(ruta).catch(() => {});
      return;
    }

    // Con subnavegación el área de contenido muestra el explorador del sistema hasta que se abra una pantalla, sin auto-redirección.
    if (icon.tienePanel) {
      this.shell.setContenidoPendienteSeleccion(true);
    }
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
import { Component, DestroyRef, ElementRef, Injector, afterNextRender, computed, contentChild, effect, inject, input, linkedSignal, output, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';
import { ScrollTopModule } from 'primeng/scrolltop';
import { TooltipModule } from 'primeng/tooltip';
import { ShellStateService } from '../../../core/services/shell-state.service';
import { HierSelectorComponent } from '../hier-selector/hier-selector.component';
import { NavegacionSistemasService } from '../../../pages/full-pages/layout/services/navegacion-sistemas.service';

/** Destino de la luz roja: el inicio del shell. */
const RUTA_HOME = '/app/dashboard';

/** Panel de módulo con cromo de ventana macOS; el semáforo navega de verdad: rojo cierra al inicio, amarillo minimiza al explorador del sistema y verde hace zoom. */
@Component({
  selector: 'app-window-panel',
  standalone: true,
  imports: [NgIconComponent, ScrollTopModule, TooltipModule],
  viewProviders: [provideIcons({ lucideRefreshCw })],
  templateUrl: './window-panel.component.html',
  styleUrl: './window-panel.component.css',
})
export class WindowPanelComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly shell = inject(ShellStateService);
  private readonly injector = inject(Injector);

  /** Título de la ventana (centrado en la barra, como en Finder). */
  readonly titulo = input<string>('');
  /** Texto secundario junto al título (ej. "Consultas y referencias"). */
  readonly subtitulo = input<string>('');

  /** Destino explícito del botón amarillo. Vacío = resolverlo solo (ver `onVolver`). */
  readonly volverA = input<string>('');
  /** Tooltip/aria-label del botón amarillo. */
  readonly etiquetaVolver = input<string>('Volver');

  /** Muestra el botón de actualizar en la esquina. */
  readonly permitirActualizar = input<boolean>(true);
  /** Gira el ícono y bloquea el botón mientras la recarga está en curso. */
  readonly actualizando = input<boolean>(false);
  /** Tooltip/aria-label del botón de la esquina. */
  readonly etiquetaActualizar = input<string>('Actualizar');

  /** Habilita el semáforo de ventana (se puede apagar en paneles anidados). */
  readonly mostrarSemaforo = input<boolean>(true);
  /** Padding interno del cuerpo; `false` para contenido a sangre (tablas). */
  readonly conRelleno = input<boolean>(true);

  /** Muestra el botón de filtros en la barra y la franja colapsable que proyecta `[ventana-filtros]`. */
  readonly conFiltros = input<boolean>(false);
  /** Estado inicial de esa franja. */
  readonly filtrosAbiertos = input<boolean>(false);

  readonly actualizar = output<void>();
  /** Se emite al pulsar la luz roja, antes de navegar al inicio. */
  readonly cerrar = output<void>();
  /** Se emite al pulsar la luz amarilla, antes de navegar. */
  readonly volver = output<void>();

  protected readonly pantallaCompleta = signal(false);

  protected readonly filtrosVisibles = linkedSignal(() => this.filtrosAbiertos());
  protected readonly jerarquiaVisible = linkedSignal(() => this.filtrosAbiertos());

  /** El selector de jerarquía del panel (si lo tiene) va con su propio botón, aparte de los filtros. */
  protected readonly conJerarquia = computed(() => !!this.selectorJerarquia());
  private readonly selectorJerarquia = contentChild(HierSelectorComponent);
  private readonly franja = viewChild<ElementRef<HTMLElement>>('franja');
  /** Hay filtros además del selector de jerarquía (se revisa al cambiar la franja: algunos aparecen con datos). */
  protected readonly hayOtrosFiltros = signal(false);

  /** El botón de filtros solo existe si el panel tiene filtros propios (no solo la jerarquía). */
  protected readonly conBotonFiltros = computed(() => this.conFiltros() && this.hayOtrosFiltros());

  protected readonly franjaVisible = computed(
    () => (this.conJerarquia() && this.jerarquiaVisible()) || (this.conBotonFiltros() && this.filtrosVisibles()),
  );

  protected readonly etiquetaZoom = computed(() =>
    this.pantallaCompleta() ? 'Salir de pantalla completa' : 'Ver en pantalla completa',
  );

  protected readonly etiquetaFiltros = computed(() =>
    this.filtrosVisibles() ? 'Ocultar filtros' : 'Mostrar filtros',
  );

  protected readonly etiquetaJerarquia = computed(() =>
    this.jerarquiaVisible() ? 'Ocultar jerarquía' : 'Mostrar jerarquía',
  );

  protected alternarJerarquia(): void {
    this.jerarquiaVisible.update((v) => !v);
  }

  protected alternarFiltros(): void {
    this.filtrosVisibles.update((v) => !v);
  }

  /** Cierra la franja de filtros (p. ej. tras buscar en móvil, donde flota sobre el resultado). */
  cerrarFiltros(): void {
    this.filtrosVisibles.set(false);
  }

  constructor() {
    afterNextRender(() => {
      const franja = this.franja()?.nativeElement;
      if (!franja) return;
      // Hoja visible fuera del selector: lo oculto con CSS (p. ej. `lg:hidden` de la versión móvil) no cuenta.
      const visible = (el: Element) => {
        for (let n: Element | null = el; n && n !== franja; n = n.parentElement) {
          if (getComputedStyle(n).display === 'none') return false;
        }
        return true;
      };
      const revisar = () =>
        this.hayOtrosFiltros.set(
          [...franja.querySelectorAll('*')].some(
            (el) => !el.children.length && !el.matches('app-hier-selector, app-hier-selector *') && visible(el),
          ),
        );
      revisar();
      const observador = new MutationObserver(revisar);
      observador.observe(franja, { childList: true, subtree: true });
      window.addEventListener('resize', revisar);
      this.injector.get(DestroyRef).onDestroy(() => {
        observador.disconnect();
        window.removeEventListener('resize', revisar);
      });
    });

    // `fullscreenchange` es la única fuente fiable del estado real: se puede
    // salir con Esc sin pasar por el botón verde.
    const alCambiar = () => this.pantallaCompleta.set(this.esElementoEnPantallaCompleta());
    document.addEventListener('fullscreenchange', alCambiar);

    effect((onCleanup) => {
      onCleanup(() => document.removeEventListener('fullscreenchange', alCambiar));
    });
  }

  /**
   * Luz amarilla: vuelve al nivel inmediato anterior.
   *
   * El orden importa, y el paso del medio es la corrección de la incidencia:
   *
   * 1. El destino explícito, si la pantalla fijó `volverA`.
   * 2. **El explorador del sistema.** No es una ruta: se pinta sobre el
   *    `<router-outlet>` desde `ShellStateService`, así que abrir un reporte
   *    desde ahí no deja entrada de historial y `location.back()` se saltaba
   *    ese paso entero — devolvía al usuario al Home, que era el destino
   *    anterior de verdad. Cuando el explorador ya está a la vista no se hace:
   *    ahí el paso atrás sí es del historial.
   * 3. El historial, para todo lo demás.
   */
  protected onVolver(): void {
    this.volver.emit();

    const destino = this.volverA();
    if (destino) {
      void this.router.navigateByUrl(destino);
      return;
    }

    // Dentro de una carpeta del explorador (p. ej. Actividad Diaria → Campañas) el
    // paso atrás es subir un nivel; el historial no sabe de carpetas y salía de la app.
    const navegacion = this.injector.get(NavegacionSistemasService);
    if (this.shell.contenidoPendienteSeleccion() && navegacion.rutaExplorador().length) {
      navegacion.irANivel(navegacion.rutaExplorador().length - 2);
      return;
    }

    // Las hojas legacy declaran su sección padre mediante `cod_par`. Resolver
    // ese código abre la carpeta correcta; el historial no conoce ese nivel.
    if (this.injector.get(NavegacionSistemasService).volverAPadreDeRuta(this.router.url)) return;

    if (this.shell.exploradorDisponible() && !this.shell.contenidoPendienteSeleccion()) {
      this.shell.setContenidoPendienteSeleccion(true);
      this.injector.get(NavegacionSistemasService).actualizarUrlExplorador();
      return;
    }

    // Inicio no tiene explorador: volver lleva a su pantalla (accesos recientes), no al historial.
    if (this.shell.sidebarIconActivo() === 'host-inicio') {
      void this.router.navigateByUrl(RUTA_HOME);
      return;
    }

    this.location.back();
  }

  /** Luz roja: cierra la pantalla y vuelve al inicio del shell. */
  protected onCerrar(): void {
    this.cerrar.emit();
    void this.router.navigateByUrl(RUTA_HOME);
  }

  /** Luz verde: pide pantalla completa e ignora el rechazo — el estado real lo confirma `fullscreenchange`. */
  protected alternarPantallaCompleta(): void {
    if (this.esElementoEnPantallaCompleta()) {
      void document.exitFullscreen?.().catch(() => undefined);
      return;
    }
    void this.host.nativeElement.requestFullscreen?.().catch(() => undefined);
  }

  protected onActualizar(): void {
    if (this.actualizando()) return;
    this.actualizar.emit();
  }

  private esElementoEnPantallaCompleta(): boolean {
    return document.fullscreenElement === this.host.nativeElement;
  }
}

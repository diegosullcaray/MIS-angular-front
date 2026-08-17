import { Component, ElementRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';
import { TooltipModule } from 'primeng/tooltip';
import { ShellStateService } from '../../../core/services/shell-state.service';

/** Destino de la luz roja: el inicio del shell. */
const RUTA_HOME = '/app/dashboard';

/**
 * Panel de módulo con cromo de ventana macOS (estilo explorador de archivos).
 *
 * Reemplaza al patrón anterior de "banner de módulo" (una tarjeta interna con
 * márgenes propios) por una barra de título pegada al borde del panel: solo
 * texto centrado —sin íconos ni logos— con el semáforo a la izquierda y
 * "Actualizar" en la esquina.
 *
 * El semáforo no es decorativo — cada luz hace lo que hace en macOS, traducido
 * a la navegación del shell:
 *   - rojo     → cerrar la pantalla y volver al inicio,
 *   - amarillo → minimizar: deja el panel neutro ("selecciona una opción…") con
 *                el menú secundario abierto, para elegir otra pantalla,
 *   - verde    → zoom (pantalla completa del panel).
 *
 * Uso:
 * ```html
 * <app-window-panel titulo="Kaypacha" [actualizando]="loading()" (actualizar)="recargar()">
 *   <button ventana-navegacion …>…</button>  <!-- volver, junto al semáforo -->
 *   <button ventana-acciones …>…</button>    <!-- acciones extra, a la izquierda de Actualizar -->
 *   …contenido…
 * </app-window-panel>
 * ```
 */
@Component({
  selector: 'app-window-panel',
  standalone: true,
  imports: [NgIconComponent, TooltipModule],
  viewProviders: [provideIcons({ lucideRefreshCw })],
  templateUrl: './window-panel.component.html',
  styleUrl: './window-panel.component.css',
})
export class WindowPanelComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly shell = inject(ShellStateService);

  /** Título de la ventana (centrado en la barra, como en Finder). */
  readonly titulo = input<string>('');
  /** Texto secundario junto al título (ej. "Consultas y referencias"). */
  readonly subtitulo = input<string>('');

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
  /** Alto natural del contenido en vez de llenar el viewport (como `.mis-page--auto`). */
  readonly altoAuto = input<boolean>(false);

  readonly actualizar = output<void>();
  /** Se emite al pulsar la luz roja, antes de navegar al inicio. */
  readonly cerrar = output<void>();
  /** Se emite al pulsar la luz amarilla, antes de volver al panel neutro. */
  readonly minimizar = output<void>();

  protected readonly pantallaCompleta = signal(false);

  protected readonly etiquetaZoom = computed(() =>
    this.pantallaCompleta() ? 'Salir de pantalla completa' : 'Ver en pantalla completa'
  );

  constructor() {
    // `fullscreenchange` es la única fuente fiable del estado real: se puede
    // salir con Esc sin pasar por el botón verde.
    const alCambiar = () => this.pantallaCompleta.set(this.esElementoEnPantallaCompleta());
    document.addEventListener('fullscreenchange', alCambiar);

    effect((onCleanup) => {
      onCleanup(() => document.removeEventListener('fullscreenchange', alCambiar));
    });
  }

  /** Luz roja: cierra la pantalla y vuelve al inicio del shell. */
  protected onCerrar(): void {
    this.cerrar.emit();
    void this.router.navigateByUrl(RUTA_HOME);
  }

  /**
   * Luz amarilla: "minimizar" la pantalla dentro del shell.
   *
   * No colapsa el panel: deja el estado de espera del shell —el panel neutro
   * con "Selecciona una opción del panel secundario a la izquierda"— y abre ese
   * menú, que es de donde se elige la siguiente pantalla del módulo. La ruta no
   * cambia, así que el contenido vuelve intacto al elegir una opción.
   */
  protected onMinimizar(): void {
    this.minimizar.emit();
    this.shell.setNavPanelColapsado(false);
    this.shell.setContenidoPendienteSeleccion(true);
  }

  /**
   * Luz verde: pantalla completa del panel.
   *
   * La API es asíncrona y puede rechazar (permiso denegado, navegador sin
   * soporte); el estado real lo confirma `fullscreenchange`, así que acá solo
   * se pide el cambio y se ignora el rechazo.
   */
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

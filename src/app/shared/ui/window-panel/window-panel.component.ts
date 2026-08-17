import { Component, ElementRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Panel de módulo con cromo de ventana macOS (estilo explorador de archivos).
 *
 * Reemplaza al patrón anterior de "banner de módulo" (una tarjeta interna con
 * márgenes propios) por una barra de título pegada al borde del panel:
 * semáforo a la izquierda, título centrado y acciones a la derecha, con el
 * botón de actualizar en la esquina.
 *
 * El semáforo no es decorativo — cada luz hace lo que hace en macOS, adaptado
 * a una pantalla del shell:
 *   - rojo     → cerrar la vista (navega a `rutaAlCerrar`),
 *   - amarillo → minimizar (colapsa el cuerpo y deja solo la barra),
 *   - verde    → zoom (pantalla completa del panel).
 *
 * Uso:
 * ```html
 * <app-window-panel titulo="Kaypacha" [actualizando]="loading()" (actualizar)="recargar()">
 *   <button ventana-acciones …>…</button>   <!-- acciones extra, a la izquierda de Actualizar -->
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

  /** Título de la ventana (centrado en la barra, como en Finder). */
  readonly titulo = input<string>('');
  /** Texto secundario bajo el título (ej. "Actualizado hace 2 min"). */
  readonly subtitulo = input<string>('');
  /** Clase de ícono PrimeIcons a la izquierda del título (ej. `pi pi-chart-bar`). */
  readonly icono = input<string>('');
  /** Logo del módulo; tiene prioridad sobre `icono` si vienen ambos. */
  readonly logo = input<string>('');
  /** Texto alternativo del logo (accesibilidad). */
  readonly logoAlt = input<string>('');

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

  /**
   * Destino de la luz roja. Vacío desactiva la navegación: el panel solo emite
   * `cerrar` y el módulo decide qué hacer.
   */
  readonly rutaAlCerrar = input<string>('/app/dashboard');

  readonly actualizar = output<void>();
  readonly cerrar = output<void>();

  protected readonly minimizada = signal(false);
  protected readonly pantallaCompleta = signal(false);

  protected readonly etiquetaMinimizar = computed(() =>
    this.minimizada() ? 'Restaurar el contenido del panel' : 'Minimizar el panel'
  );
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

  /** Luz roja: cierra la vista y vuelve a la ruta configurada. */
  protected onCerrar(): void {
    this.cerrar.emit();
    const destino = this.rutaAlCerrar();
    if (destino) void this.router.navigateByUrl(destino);
  }

  /** Luz amarilla: colapsa el cuerpo dejando visible solo la barra de título. */
  protected alternarMinimizado(): void {
    this.minimizada.update((v) => !v);
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

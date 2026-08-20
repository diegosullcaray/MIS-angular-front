import { Component, ElementRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideRefreshCw } from '@ng-icons/lucide';
import { TooltipModule } from 'primeng/tooltip';
import { ShellStateService } from '../../../core/services/shell-state.service';

/** Destino de la luz roja: el inicio del shell. */
const RUTA_HOME = '/app/dashboard';

/** Panel de módulo con cromo de ventana macOS; el semáforo navega de verdad: rojo cierra al inicio, amarillo minimiza al explorador del sistema y verde hace zoom. */
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

  /** Luz amarilla: deja el shell en espera mostrando el explorador del sistema; la ruta no cambia, así que el contenido vuelve intacto. */
  protected onMinimizar(): void {
    this.minimizar.emit();
    this.shell.setContenidoPendienteSeleccion(true);
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

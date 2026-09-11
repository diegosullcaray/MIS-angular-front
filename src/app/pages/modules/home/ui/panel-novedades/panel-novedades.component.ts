import { Component, computed, inject, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { NovedadesTourService } from '../../services/novedades-tour.service';
import type { Novedad } from '../../models/novedad.model';

/** Debajo de este ancho el panel taparía el contenido del Home, así que arranca cerrado. */
const ANCHO_MINIMO_ABIERTO = 1280;

/**
 * Panel de novedades del Home: una barra pegada al borde derecho con las
 * mejoras del sistema. Cada una arranca su recorrido guiado, en el que el
 * personaje de la marca va señalando en pantalla lo que la novedad cuenta.
 *
 * Se puede plegar contra el borde; el estado vive solo mientras dura la
 * sesión de la pantalla —no es una preferencia guardada.
 */
@Component({
  selector: 'app-panel-novedades',
  standalone: true,
  imports: [TooltipModule],
  templateUrl: './panel-novedades.component.html',
  styleUrl: './panel-novedades.component.css',
})
export class PanelNovedadesComponent {
  private readonly tours = inject(NovedadesTourService);

  protected readonly novedades = this.tours.novedades;

  protected readonly abierto = signal(this.cabeAbierto());

  /** Enciende el punto de aviso de la pestaña cuando hay algo publicado hace poco. */
  protected readonly hayNuevas = computed(() => this.novedades.some((n) => this.tours.esNueva(n)));

  protected alternar(): void {
    this.abierto.update((v) => !v);
  }

  protected verGuia(novedad: Novedad): void {
    // El recorrido señala elementos de la pantalla, y el panel está encima de
    // ellos: en angosto ocupa todo el ancho, así que taparía justo lo que la
    // novedad quiere mostrar. La excepción es el recorrido que habla del panel.
    if (!novedad.requierePanel) this.abierto.set(false);

    this.tours.iniciar(novedad.id);
  }

  /** Abre el panel desde afuera — lo usa la bienvenida de Pachi. */
  abrir(): void {
    this.abierto.set(true);
  }

  protected esNueva(novedad: Novedad): boolean {
    return this.tours.esNueva(novedad);
  }

  /** En pantallas angostas el panel se comería el Home: ahí conviene plegado. */
  private cabeAbierto(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= ANCHO_MINIMO_ABIERTO;
  }
}

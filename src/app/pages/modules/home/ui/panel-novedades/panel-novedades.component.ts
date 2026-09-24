import { Component, computed, inject, signal } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { NovedadesTourService } from '../../services/novedades-tour.service';
import type { Novedad } from '../../models/novedad.model';

/** Debajo de este ancho el panel taparía el contenido del Home, así que arranca cerrado. */
const ANCHO_MINIMO_ABIERTO = 1280;

/**
 * Panel de novedades del Home: una barra pegada al borde derecho con recorridos
 * sobre funciones reales del sistema. Se filtran por tema y Baby Pachi cambia
 * su pose y mensaje para orientar la elección.
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

  readonly novedades = this.tours.novedades;
  readonly categoriaActiva = signal<string | null>(null);
  readonly categorias = computed(() => [
    ...new Set(this.novedades.map((novedad) => novedad.categoria)),
  ]);
  readonly novedadesVisibles = computed(() => {
    const categoria = this.categoriaActiva();
    return categoria
      ? this.novedades.filter((novedad) => novedad.categoria === categoria)
      : this.novedades;
  });
  readonly posePachi = computed(() => {
    const categoria = this.categoriaActiva();
    return (
      (categoria
        ? this.novedades.find((novedad) => novedad.categoria === categoria)
        : this.novedades[0]
      )?.posePachi ?? 'saluda'
    );
  });
  readonly mensajePachi = computed(() =>
    this.categoriaActiva()
      ? `Te muestro cómo ${this.categoriaActiva()!.toLocaleLowerCase('es-PE')} en MIS.`
      : 'Elige un tema y te guío paso a paso en la pantalla.',
  );

  readonly abierto = signal(this.cabeAbierto());

  /** Enciende el punto de aviso de la pestaña cuando hay algo publicado hace poco. */
  readonly hayNuevas = computed(() => this.novedades.some((n) => this.tours.esNueva(n)));

  alternar(): void {
    this.abierto.update((v) => !v);
  }

  verGuia(novedad: Novedad): void {
    // El recorrido señala elementos de la pantalla, y el panel está encima de
    // ellos: en angosto ocupa todo el ancho, así que taparía justo lo que la
    // novedad quiere mostrar. El catálogo no publica recorridos autorreferenciales.
    this.abierto.set(false);

    this.tours.iniciar(novedad.id);
  }

  filtrar(categoria: string | null): void {
    this.categoriaActiva.set(categoria);
  }

  /** Abre el panel desde afuera — lo usa la bienvenida de Pachi. */
  abrir(): void {
    this.abierto.set(true);
  }

  /** Repliega el panel desde la bienvenida sin alternar accidentalmente su estado. */
  cerrar(): void {
    this.abierto.set(false);
  }

  esNueva(novedad: Novedad): boolean {
    return this.tours.esNueva(novedad);
  }

  /** En pantallas angostas el panel se comería el Home: ahí conviene plegado. */
  private cabeAbierto(): boolean {
    return typeof window !== 'undefined' && window.innerWidth >= ANCHO_MINIMO_ABIERTO;
  }
}

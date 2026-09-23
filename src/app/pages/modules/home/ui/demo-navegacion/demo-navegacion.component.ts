import { Component, input, signal } from '@angular/core';
import type { ModoEjemploNovedad } from '../../models/novedad.model';

/** Laboratorio local de las guías: permite practicar sin permisos ni consultas reales. */
@Component({
  selector: 'app-demo-navegacion',
  standalone: true,
  templateUrl: './demo-navegacion.component.html',
  styleUrl: './demo-navegacion.component.css',
})
export class DemoNavegacionComponent {
  readonly modo = input<ModoEjemploNovedad>(null);

  protected readonly panelAbierto = signal(false);
  protected readonly filtrosAbiertos = signal(false);
  protected readonly seccion = signal('Resumen');
  protected readonly actualizado = signal(false);

  protected abrirPanel(): void {
    this.panelAbierto.set(true);
  }

  protected elegirSeccion(seccion: string): void {
    this.seccion.set(seccion);
  }

  protected alternarFiltros(): void {
    this.filtrosAbiertos.update((abierto) => !abierto);
  }

  protected actualizar(): void {
    this.actualizado.set(true);
  }
}

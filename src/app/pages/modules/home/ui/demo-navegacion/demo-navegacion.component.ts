import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, signal } from '@angular/core';
import type { ModoEjemploNovedad } from '../../models/novedad.model';

interface NodoDemo {
  readonly etiqueta: string;
  /** Contenido de la carpeta; sin él, el nodo es un reporte. */
  readonly hijos?: readonly NodoDemo[];
}

/** Árbol de ejemplo de "Reportes": como el explorador real, mezcla carpetas y reportes. */
const RAIZ: readonly NodoDemo[] = [
  { etiqueta: 'Cartera', hijos: [{ etiqueta: 'Saldo de cartera' }, { etiqueta: 'Desembolsos' }] },
  { etiqueta: 'Captaciones', hijos: [{ etiqueta: 'Ahorros' }] },
  { etiqueta: 'Monitor de metas' },
  { etiqueta: 'Resumen diario' },
];

/** Laboratorio local de las guías: permite practicar sin permisos ni consultas reales. */
@Component({
  selector: 'app-demo-navegacion',
  standalone: true,
  templateUrl: './demo-navegacion.component.html',
  styleUrl: './demo-navegacion.component.css',
})
export class DemoNavegacionComponent {
  readonly modo = input<ModoEjemploNovedad>(null);

  constructor() {
    // Se monta en <body>, fuera del shell: el área de contenido crea su propio contexto
    // de apilamiento y, desde adentro, la demo no puede tapar el header ni el rail reales.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => document.body.appendChild(host));
    inject(DestroyRef).onDestroy(() => host.remove());
  }

  /** Como en el shell real: el rail abre el explorador del sistema en el área de contenido. */
  protected readonly sistemaAbierto = signal(false);
  protected readonly carpeta = signal<NodoDemo | null>(null);
  protected readonly reporte = signal<NodoDemo | null>(null);
  protected readonly filtrosAbiertos = signal(false);
  protected readonly actualizado = signal(false);

  protected readonly nodos = computed(() => this.carpeta()?.hijos ?? RAIZ);
  protected readonly titulo = computed(
    () => this.reporte()?.etiqueta ?? this.carpeta()?.etiqueta ?? (this.sistemaAbierto() ? 'Reportes' : 'Inicio'),
  );

  protected abrirSistema(): void {
    this.sistemaAbierto.set(true);
    this.carpeta.set(null);
    this.reporte.set(null);
  }

  protected abrir(nodo: NodoDemo): void {
    if (nodo.hijos) this.carpeta.set(nodo);
    else this.reporte.set(nodo);
  }

  /** Luz amarilla: sube un nivel (del reporte a su carpeta, de la carpeta al sistema). */
  protected volver(): void {
    if (this.reporte()) this.reporte.set(null);
    else this.carpeta.set(null);
  }

  protected alternarFiltros(): void {
    this.filtrosAbiertos.update((abierto) => !abierto);
  }

  protected actualizar(): void {
    this.actualizado.set(true);
  }
}

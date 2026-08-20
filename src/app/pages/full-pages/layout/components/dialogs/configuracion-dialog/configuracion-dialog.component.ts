import { Component, computed, input, linkedSignal, output, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SECCIONES_CONFIGURACION } from './configuracion.model';
import type { ItemConfiguracion, SeccionConfiguracion } from './configuracion.model';

/** Columna que se ve en mobile: la navegación es un drill-down de tres pasos. */
export type NivelConfiguracion = 0 | 1 | 2;

/** Quita acentos y mayúsculas para que el buscador no dependa de cómo se tipee. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Diálogo "Configuración" — adaptación de la plantilla que vive en `docs/08-otros/dialog-configuracion`: maestro-detalle de tres columnas (secciones → items → contenido) con un buscador sobre el árbol de ajustes. */
@Component({
  selector: 'app-configuracion-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule],
  templateUrl: './configuracion-dialog.component.html',
  styleUrl: './configuracion-dialog.component.css',
})
export class ConfiguracionDialogComponent {
  readonly visible = input(false);
  readonly visibleChange = output<boolean>();

  protected readonly filtro = signal('');
  /** Solo tiene efecto en mobile; en desktop las tres columnas se ven a la vez. */
  protected readonly nivelMovil = signal<NivelConfiguracion>(0);

  protected readonly seccionActiva = signal(SECCIONES_CONFIGURACION[0].clave);

  protected readonly seccion = computed(
    () => SECCIONES_CONFIGURACION.find((s) => s.clave === this.seccionActiva()) ?? SECCIONES_CONFIGURACION[0],
  );

  /** Al cambiar de sección el detalle salta a su primer item, no queda en uno ajeno. */
  protected readonly itemActivo = linkedSignal<SeccionConfiguracion, string>({
    source: () => this.seccion(),
    computation: (seccion) => seccion.items[0].clave,
  });

  protected readonly item = computed(
    () => this.seccion().items.find((i) => i.clave === this.itemActivo()) ?? this.seccion().items[0],
  );

  /** El filtro se aplica sobre el árbol completo: una sección sigue visible si ella misma coincide o si le queda al menos un item. */
  protected readonly seccionesVisibles = computed(() => {
    const termino = normalizar(this.filtro().trim());
    if (!termino) return SECCIONES_CONFIGURACION;

    return SECCIONES_CONFIGURACION.filter(
      (seccion) => this.coincideSeccion(seccion, termino) || seccion.items.some((i) => this.coincideItem(i, termino)),
    );
  });

  /** Items de la sección abierta, ya filtrados con el mismo término. */
  protected readonly itemsVisibles = computed(() => {
    const termino = normalizar(this.filtro().trim());
    const seccion = this.seccion();
    if (!termino || this.coincideSeccion(seccion, termino)) return seccion.items;

    return seccion.items.filter((i) => this.coincideItem(i, termino));
  });

  protected elegirSeccion(seccion: SeccionConfiguracion): void {
    this.seccionActiva.set(seccion.clave);
    this.nivelMovil.set(1);
  }

  protected elegirItem(item: ItemConfiguracion): void {
    this.itemActivo.set(item.clave);
    this.nivelMovil.set(2);
  }

  protected volver(): void {
    this.nivelMovil.update((nivel) => (nivel > 0 ? ((nivel - 1) as NivelConfiguracion) : 0));
  }

  protected filtrar(evento: Event): void {
    this.filtro.set((evento.target as HTMLInputElement).value);
  }

  /** Única salida del diálogo (botón, Escape o click en la máscara). */
  protected cerrar(): void {
    this.nivelMovil.set(0);
    this.filtro.set('');
    this.visibleChange.emit(false);
  }

  private coincideSeccion(seccion: SeccionConfiguracion, termino: string): boolean {
    return normalizar(seccion.etiqueta).includes(termino);
  }

  private coincideItem(item: ItemConfiguracion, termino: string): boolean {
    return normalizar(`${item.etiqueta} ${item.descripcion}`).includes(termino);
  }
}

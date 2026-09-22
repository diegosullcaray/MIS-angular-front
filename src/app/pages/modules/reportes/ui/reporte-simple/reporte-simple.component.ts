import { Component, computed, input, output } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../models/tabla-reporte.model';

/** Un bloque del reporte: su tabla y, si el legado se lo pone, su título. */
export interface BloqueReporte {
  titulo?: string;
  tabla: TablaReporteResultado;
  /** Nota al pie de este bloque — `content.lower` del legado, por tabla. */
  nota?: string;
}

/** Una pestaña, para los reportes cuyo host del legado reparte los bloques en `mat-tab`s. */
export interface PestanaReporte {
  id: string;
  titulo: string;
  bloques: BloqueReporte[];
}

/**
 * Armazón de reporte: ventana + selector de jerarquía + bloques de tabla.
 * Un bloque: `[tabla]`; varios: `[bloques]`; en pestañas: `[pestanas]`.
 * Filtros propios: slot `[filtros]`. Leyenda al pie: slot `[nota]`.
 */
@Component({
  selector: 'app-reporte-simple',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, EmptyStateComponent, InlineErrorComponent, WindowPanelComponent, TabsModule],
  template: `
    <app-window-panel
      [titulo]="titulo()"
      [subtitulo]="subtitulo()"
      [permitirActualizar]="nivel() !== null"
      [actualizando]="cargando()"
      etiquetaActualizar="Actualizar datos"
      (actualizar)="refrescar()"
      [conFiltros]="true"
    >
      
      <div ventana-filtros class="flex flex-col gap-3">
        <app-hier-selector
          [paramsHier]="paramsHier()"
          [placeholder]="placeholder()"
          (nodoSeleccionado)="nivelSeleccionado.emit($event)"
          (error)="errorJerarquia.emit()"
        />
        <div class="flex flex-col sm:flex-row sm:items-end gap-3 flex-wrap">
          <ng-content select="[filtros]" />
        </div>
      </div>

      <!-- Estado: error / vacío / pestañas / bloques -->
      @if (error(); as detalleError) {
        <app-inline-error [detalle]="detalleError" (reintentar)="refrescar()" />
      } @else if (!nivel()) {
        <app-empty-state [titulo]="tituloVacio()" [descripcion]="descripcionVacio()" />
      } @else if (pestanas(); as tabs) {
        <p-tabs [value]="tabs[0].id">
          <p-tablist>
            @for (tab of tabs; track tab.id) {
              <p-tab [value]="tab.id" class="!py-2 !px-3">{{ tab.titulo }}</p-tab>
            }
          </p-tablist>
          <p-tabpanels>
            @for (tab of tabs; track tab.id) {
              <p-tabpanel [value]="tab.id">
                <div class="flex flex-col gap-5">
                  @for (bloque of tab.bloques; track $index) {
                    <section class="flex flex-col gap-2">
                      @if (bloque.titulo) {
                        <h2 class="text-[13px] font-semibold text-[var(--mis-text-primary)] m-0">{{ bloque.titulo }}</h2>
                      }
                      <div class="mis-card p-3" [class.overflow-x-auto]="!ajustarAncho()">
                        <app-tabla-reporte [encabezados]="bloque.tabla.headers" [filas]="bloque.tabla.body" [cargando]="cargando()" [ajustarAncho]="ajustarAncho()" />
                      </div>
                      @if (bloque.nota) {
                        <p class="text-[12px] text-[var(--mis-text-tertiary)] m-0 leading-relaxed" [innerHTML]="bloque.nota"></p>
                      }
                    </section>
                  }
                </div>
              </p-tabpanel>
            }
          </p-tabpanels>
        </p-tabs>
      } @else {
        <div class="flex flex-col gap-5">
          @for (bloque of lista(); track $index) {
            <section class="flex flex-col gap-2">
              @if (bloque.titulo) {
                <h2 class="text-[13px] font-semibold text-[var(--mis-text-primary)] m-0">{{ bloque.titulo }}</h2>
              }
              <div class="mis-card p-3" [class.overflow-x-auto]="!ajustarAncho()">
                <app-tabla-reporte [encabezados]="bloque.tabla.headers" [filas]="bloque.tabla.body" [cargando]="cargando()" [ajustarAncho]="ajustarAncho()" />
              </div>
              @if (bloque.nota) {
                <p class="text-[12px] text-[var(--mis-text-tertiary)] m-0 leading-relaxed" [innerHTML]="bloque.nota"></p>
              }
            </section>
          }
        </div>
      }

      <div class="flex flex-col gap-3 mt-4">
        <ng-content select="[nota]" />
        <ng-content />
      </div>

    </app-window-panel>
  `,
})
export class ReporteSimpleComponent {
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly paramsHier = input.required<ParamsJerarquia>();
  readonly placeholder = input('Elegir nivel');

  /** Nodo elegido; mientras sea `null` se muestra el estado vacío en vez de la tabla. */
  readonly nivel = input.required<HierarquiaNodo | null>();
  /** Reporte de un solo bloque. Para varios, usar `bloques`. */
  readonly tabla = input<TablaReporteResultado>();
  /** Bloques del reporte, en el orden en que los apila el legado. */
  readonly bloques = input<BloqueReporte[]>();
  /** Reparte los bloques en pestañas, como hacen los hosts `cra-v1p2` / `cra-aut-tasa`. */
  readonly pestanas = input<PestanaReporte[]>();
  readonly cargando = input(false);
  /** El contenedor conserva el fallo; las tablas solo gestionan carga y vacío. */
  readonly error = input<string | null>(null);
  /**
   * Deja que las tablas hagan salto de línea para entrar en el ancho de la
   * pantalla, en vez de sacar scroll horizontal. Ver `<app-tabla-reporte>`.
   */
  readonly ajustarAncho = input(false);

  protected readonly lista = computed<BloqueReporte[]>(() => {
    const varios = this.bloques();
    if (varios) return varios;
    const una = this.tabla();
    return una ? [{ tabla: una }] : [];
  });

  readonly tituloVacio = input('Elige un nivel');
  readonly descripcionVacio = input('Selecciona un nivel de la jerarquía en los filtros de arriba para ver el reporte.');

  readonly nivelSeleccionado = output<HierarquiaNodo>();
  readonly errorJerarquia = output<void>();

  /** Reemite el nodo actual como copia nueva para forzar el efecto en el componente contenedor. */
  protected refrescar(): void {
    const nodo = this.nivel();
    if (nodo) this.nivelSeleccionado.emit({ ...nodo });
  }
}

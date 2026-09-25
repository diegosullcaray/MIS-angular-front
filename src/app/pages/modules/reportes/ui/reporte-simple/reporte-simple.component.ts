import { Component, computed, input, linkedSignal, model, output } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { PaginatorModule, type PaginatorState } from 'primeng/paginator';
import { HierSelectorComponent } from '../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { ChipInformativoComponent } from '../../../../../shared/ui/chip-informativo/chip-informativo.component';
import { GrupoFiltrosComponent } from '../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models/jerarquia.model';
import type { FilaReporte, TablaReporteResultado } from '../../models/tabla-reporte.model';

/** Un bloque del reporte: su tabla y, si el legado se lo pone, su título. */
export interface BloqueReporte {
  titulo?: string;
  tabla: TablaReporteResultado;
  /** Nota al pie de este bloque — `content.lower` del legado, por tabla. */
  nota?: string;
  /** Unidad de la tabla ("Expresado en PEN y %") — `content.higher` del legado; va como chip encima. */
  chip?: string;
  /** El bloque todavía no respondió: su tabla muestra el esqueleto (carga independiente). */
  cargando?: boolean;
  /**
   * El bloque es la tabla paginada en el servidor (`app-table-ajax` del legado): lleva el paginador
   * de `totalFilas`/`pagina` dentro de su tarjeta y los encabezados con el color del tema.
   */
  paginado?: boolean;
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
 * Filtros propios: slot `[filtros]`. Notas sobre la tabla: slot `[encabezado]`. Leyenda al pie: slot `[nota]`. Unidad: `chip` (o el del bloque).
 */
@Component({
  selector: 'app-reporte-simple',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, EmptyStateComponent, InlineErrorComponent, WindowPanelComponent, GrupoFiltrosComponent, ChipInformativoComponent, TabsModule, PaginatorModule],
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
        <app-grupo-filtros>
          <ng-content select="[filtros]" />
        </app-grupo-filtros>
      </div>

      <!-- Notas que el legado pone ENCIMA de la tabla (\`content.higher\`): slot \`[encabezado]\`. -->
      @if (nivel() && !error()) {
        <div class="flex flex-col gap-2 mb-3 empty:hidden">
          <ng-content select="[encabezado]" />
        </div>
      }

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
                      @if (bloque.chip) {
                        <app-chip-informativo [texto]="bloque.chip" />
                      }
                      <div class="mis-card p-3 overflow-x-auto">
                        <app-tabla-reporte [encabezados]="bloque.tabla.headers" [filas]="bloque.tabla.body" [cargando]="cargando() || !!bloque.cargando" [ajustarAncho]="ajustarAncho()" [encabezadoUniforme]="encabezadoUniforme() || !!bloque.paginado" />
                        @if (bloque.paginado && totalFilas(); as total) {
                          <p-paginator
                            class="border-t border-[var(--mis-border)] mt-2 pt-1"
                            [first]="(pagina() - 1) * filasPorPagina()"
                            [rows]="filasPorPagina()"
                            [totalRecords]="total"
                            [showFirstLastIcon]="true"
                            (onPageChange)="onPagina($event)"
                            styleClass="text-[12px] !bg-transparent"
                          />
                        }
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
          @for (bloque of lista(); track $index; let primero = $first) {
            <section class="flex flex-col gap-2">
              @if (bloque.titulo) {
                <h2 class="text-[13px] font-semibold text-[var(--mis-text-primary)] m-0">{{ bloque.titulo }}</h2>
              }
              @if (bloque.chip) {
                <app-chip-informativo [texto]="bloque.chip" />
              }
              <div class="mis-card p-3 overflow-x-auto">
                <app-tabla-reporte [encabezados]="bloque.tabla.headers" [filas]="filasVisibles(bloque.tabla.body)" [cargando]="cargando() || !!bloque.cargando" [ajustarAncho]="ajustarAncho()" [encabezadoUniforme]="encabezadoUniforme()" />
                <!-- El paginador es parte de la tabla, como el mat-paginator de \`app-table-ajax\`: va
                     dentro de su tarjeta, pegado al pie. Los reportes paginados son de un solo bloque. -->
                @if (primero && totalPaginador(bloque.tabla.body); as total) {
                  <p-paginator
                    class="border-t border-[var(--mis-border)] mt-2 pt-1"
                    [first]="(paginaActual() - 1) * filasPorPagina()"
                    [rows]="filasPorPagina()"
                    [totalRecords]="total"
                    [showFirstLastIcon]="true"
                    (onPageChange)="onPagina($event)"
                    styleClass="text-[12px] !bg-transparent"
                  />
                }
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
  /** Unidad del reporte de un solo bloque, como chip sobre la tabla (p. ej. "Expresado en PEN y %"). */
  readonly chip = input<string>();
  /** Bloques del reporte, en el orden en que los apila el legado. */
  readonly bloques = input<BloqueReporte[]>();
  /** Reparte los bloques en pestañas, como hacen los hosts `cra-v1p2` / `cra-aut-tasa`. */
  readonly pestanas = input<PestanaReporte[]>();
  readonly cargando = input(false);
  /** El contenedor conserva el fallo; las tablas solo gestionan carga y vacío. */
  readonly error = input<string | null>(null);
  /**
   * Angosta las columnas haciendo saltar de línea los encabezados (nunca las filas) para que la
   * tabla entre en el ancho de la pantalla. El scroll horizontal queda solo como respaldo en
   * pantallas angostas. Ver `<app-tabla-reporte>`.
   */
  readonly ajustarAncho = input(false);
  /** Encabezados con el color único del tema (ver `<app-tabla-reporte>`). */
  readonly encabezadoUniforme = input(false);

  /**
   * Paginación en el servidor, como `app-table-ajax` del legado: con un total (`additional.Total`)
   * se muestra el paginador bajo la tabla y cada cambio de página actualiza `pagina` (desde 1),
   * que el reporte manda como `pagen`. `null` = sin paginador.
   */
  readonly totalFilas = input<number | null>(null);
  readonly filasPorPagina = input(30);
  readonly pagina = model(1);
  /**
   * Paginación en el cliente, como el `mat-paginator` de `app-table-multiheader` del legado
   * (`theme_tb3`): llegan todas las filas y la tabla muestra `filasPorPagina` por página.
   */
  readonly paginacionLocal = input(false);
  /** Página del paginador local; vuelve a la primera cuando llega otra tabla. */
  protected readonly paginaLocal = linkedSignal({ source: () => this.tabla(), computation: () => 1 });
  protected readonly paginaActual = computed(() => (this.paginacionLocal() ? this.paginaLocal() : this.pagina()));

  /** Filas que muestra la tabla: todas, o la página actual con paginación local. */
  protected filasVisibles(filas: FilaReporte[]): FilaReporte[] {
    if (!this.paginacionLocal()) return filas;
    const desde = (this.paginaLocal() - 1) * this.filasPorPagina();
    return filas.slice(desde, desde + this.filasPorPagina());
  }

  /** Total del paginador, o `null` si no va paginador. */
  protected totalPaginador(filas: FilaReporte[]): number | null {
    if (this.paginacionLocal()) return filas.length > 0 ? filas.length : null;
    return this.totalFilas();
  }

  protected readonly lista = computed<BloqueReporte[]>(() => {
    const varios = this.bloques();
    if (varios) return varios;
    const una = this.tabla();
    return una ? [{ tabla: una, chip: this.chip() }] : [];
  });

  readonly tituloVacio = input('Elige un nivel');
  readonly descripcionVacio = input('Selecciona un nivel de la jerarquía en los filtros de arriba para ver el reporte.');

  readonly nivelSeleccionado = output<HierarquiaNodo>();
  readonly errorJerarquia = output<void>();

  protected onPagina(evento: PaginatorState): void {
    const pagina = (evento.page ?? 0) + 1;
    if (this.paginacionLocal()) this.paginaLocal.set(pagina);
    else this.pagina.set(pagina);
  }

  /** Reemite el nodo actual como copia nueva para forzar el efecto en el componente contenedor. */
  protected refrescar(): void {
    const nodo = this.nivel();
    if (nodo) this.nivelSeleccionado.emit({ ...nodo });
  }
}

import { Component, effect, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';
import { GraficoMixtoComponent } from '../../../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { EsqueletoGraficoComponent } from '../../../../../../../../../shared/ui/graficos/esqueleto-grafico/esqueleto-grafico.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import type { BloqueGrafico } from '../../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import {
  OPCIONES_PRODUCTO_COSECHAS,
  PRODUCTO_COSECHAS_POR_DEFECTO,
  OPCIONES_SUBPRODUCTO_COSECHAS,
  SUBPRODUCTO_COSECHAS_POR_DEFECTO,
  OPCIONES_MADURACION,
  MADURACION_POR_DEFECTO,
  OPCIONES_TIPO_OPERACION_SALDO,
  TIPO_OPERACION_SALDO_POR_DEFECTO,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/**
 * "Cosechas" (`leg/com/rma/adm/graf-cosechas`) — legado `rma/administracion/Riesgos/grafico_cosechas`
 * sobre el host `cra-v3`: un gráfico (`graphic: _01`) con los filtros Producto, Sub Producto,
 * Maduración y Tipo, sin fecha.
 */
@Component({
  selector: 'app-mensual-evolutivo-cosechas',
  standalone: true,
  imports: [
    HierSelectorComponent,
    SelectFiltroComponent,
    GrupoFiltrosComponent,
    GraficoMixtoComponent,
    EsqueletoGraficoComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './evolutivo-cosechas.component.html',
  styleUrl: './evolutivo-cosechas.component.css',
})
export class EvolutivoCosechasComponent {
  private readonly servicio = inject(ActividadMensualCraService);
  private readonly toast = inject(ToastService);
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly opcionesProducto = OPCIONES_PRODUCTO_COSECHAS;
  protected readonly producto = signal<string>(PRODUCTO_COSECHAS_POR_DEFECTO);

  protected readonly opcionesSubproducto = OPCIONES_SUBPRODUCTO_COSECHAS;
  protected readonly subproducto = signal<string>(SUBPRODUCTO_COSECHAS_POR_DEFECTO);

  protected readonly opcionesMaduracion = OPCIONES_MADURACION;
  protected readonly maduracion = signal<string>(MADURACION_POR_DEFECTO);

  protected readonly opcionesTipo = OPCIONES_TIPO_OPERACION_SALDO;
  protected readonly tipo = signal<string>(TIPO_OPERACION_SALDO_POR_DEFECTO);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly graficos = signal<BloqueGrafico[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  constructor() {
    // Nivel y filtros son dependencias: cambiar uno repite la consulta y cancela la anterior.
    effect((onCleanup) => {
      const nodo = this.nivelActual();
      if (!nodo) return;
      this.cargando.set(true);
      const sub = this.servicio
        .evolutivoCosechas({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, this.producto(), this.subproducto(), this.maduracion(), this.tipo())
        .subscribe({
          next: (graficos) => {
            this.graficos.set(graficos);
            this.cargando.set(false);
          },
          error: () => {
            this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
            this.cargando.set(false);
          },
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
  }
}

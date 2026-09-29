import { Injectable, Injector, inject } from '@angular/core';
import { Observable, map, merge, scan, throwError } from 'rxjs';
import { TABLA_PENDIENTE } from '../../../models/tabla-reporte.model';
import type { ResultadoPanelAsesor } from '../models/panel-asesor.model';
import type { FiltrosMonitorEfectividades } from '../models/monitor-efectividades.model';
import { CODIGO_CLIENTES_CONSOLIDADO } from '../constantes/panel-asesor.constantes';
import { CarteraService } from './cartera.service';
import { MonitorMetasDesembolsoService } from './monitor-metas-desembolso.service';
import { MonitorEfectividadesService } from './monitor-efectividades.service';
import { GruposPorVencerService } from './grupos-por-vencer.service';
import { ClientesNuevosRecurrentesService } from './clientes-nuevos-recurrentes.service';
import { ClientesProductoService } from './clientes-producto.service';
import { SegurosService } from './seguros.service';
import { RecuperacionPreventivaService } from './recuperacion-preventiva.service';
import { AutonomiaTasasService } from './autonomia-tasas.service';

/** Delega cada reporte (por `SCODSEC`) a su servicio existente. */
@Injectable()
export class PanelAsesorConsultasService {
  private readonly injector = inject(Injector);

  consultar(codigo: string, dni: string, filtros: FiltrosMonitorEfectividades): Observable<ResultadoPanelAsesor> {
    const nodo = { tip_cod: 2, cod_rel: dni };
    switch (codigo) {
      case 'L_CART_SEC': return this.injector.get(CarteraService).obtenerCartera(nodo);
      case 'L_MONI_DESE_SEC': return this.injector.get(MonitorMetasDesembolsoService).obtenerMonitorMetasDesembolso(nodo);
      case 'L_MON_EFE_DET_SEC': return this.injector.get(MonitorEfectividadesService).obtenerMonitorEfectividades(nodo, filtros);
      case CODIGO_CLIENTES_CONSOLIDADO: return this.clientesConsolidado(nodo);
      case 'L_SEG_SEC': return this.injector.get(SegurosService).obtenerSeguros(nodo);
      case 'L_REC_PREVE_SEC': return this.injector.get(RecuperacionPreventivaService).obtenerRecuperacionPreventiva(nodo);
      case 'L_REP_AUTO_SEC': return this.injector.get(AutonomiaTasasService).obtenerAutonomiaTasas(nodo);
      default: return throwError(() => new Error(`Reporte no disponible: ${codigo}`));
    }
  }

  /**
   * Grupos PDM, Clientes Nuevos y Recurrentes y Clientes Producto en una vista; cada uno llega por
   * su cuenta (lo pendiente, con esqueleto). Grupos PDM sin filas no se muestra.
   */
  private clientesConsolidado(nodo: { tip_cod: number; cod_rel: string }): Observable<ResultadoPanelAsesor> {
    const grupos$ = this.injector.get(GruposPorVencerService).obtenerGruposPorVencer(nodo).pipe(
      map((r) => ({ tabla1: r.tabla1.body.length > 0 ? r.tabla1 : undefined })),
    );
    const clientes$ = this.injector.get(ClientesNuevosRecurrentesService).obtenerClientesNuevosRecurrentes(nodo).pipe(map((r) => ({ tabla2: r.tabla1 })));
    const producto$ = this.injector.get(ClientesProductoService).obtenerClientesProducto(nodo).pipe(
      map((r) => ({ tabla3: r.tabla1, tabla4: r.tabla2, tabla5: r.tabla3 })),
    );
    const inicial: ResultadoPanelAsesor = {
      tabla1: TABLA_PENDIENTE,
      tabla2: TABLA_PENDIENTE,
      tabla3: TABLA_PENDIENTE,
      tabla4: TABLA_PENDIENTE,
      tabla5: TABLA_PENDIENTE,
    };
    return merge(grupos$, clientes$, producto$).pipe(scan((acumulado, parte) => ({ ...acumulado, ...parte }), inicial));
  }
}

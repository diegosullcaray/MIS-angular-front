import { Injectable, Injector, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import type { ResultadoPanelAsesor } from '../models/panel-asesor.model';
import type { FiltrosMonitorEfectividades } from '../models/monitor-efectividades.model';
import { CarteraService } from './cartera.service';
import { MonitorMetasDesembolsoService } from './monitor-metas-desembolso.service';
import { MonitorEfectividadesService } from './monitor-efectividades.service';
import { GruposPorVencerService } from './grupos-por-vencer.service';
import { ClientesNuevosRecurrentesService } from './clientes-nuevos-recurrentes.service';
import { ClientesProductoService } from './clientes-producto.service';
import { SegurosService } from './seguros.service';
import { CeroCuotasService } from './cero-cuotas.service';
import { RecuperacionPreventivaService } from './recuperacion-preventiva.service';
import { CaptacionesService } from './captaciones.service';
import { AutonomiaTasasService } from './autonomia-tasas.service';
import { PlanillaMovilidadService } from './planilla-movilidad.service';
import { ResumenMovilidadService } from './resumen-movilidad.service';
import { InversionStockMoraService } from './inversion-stock-mora.service';
import { DesempenoSocialAnalistaService } from './desempeno-social-analista.service';
import { ColocacionesDiariaService } from './colocaciones-diaria.service';
import { ProspectoCorresponsalService } from './prospecto-corresponsal.service';

/** Delega cada reporte (por su `SCODSEC`) al servicio que ya conserva su motor, bloques y parámetros. */
@Injectable()
export class PanelAsesorConsultasService {
  private readonly injector = inject(Injector);

  consultar(codigo: string, dni: string, filtros: FiltrosMonitorEfectividades): Observable<ResultadoPanelAsesor> {
    const nodo = { tip_cod: 2, cod_rel: dni };
    switch (codigo) {
      case 'L_CART_SEC': return this.injector.get(CarteraService).obtenerCartera(nodo);
      case 'L_MONI_DESE_SEC': return this.injector.get(MonitorMetasDesembolsoService).obtenerMonitorMetasDesembolso(nodo);
      case 'L_MON_EFE_DET_SEC': return this.injector.get(MonitorEfectividadesService).obtenerMonitorEfectividades(nodo, filtros);
      case 'L_GPDM_SEC': return this.injector.get(GruposPorVencerService).obtenerGruposPorVencer(nodo);
      case 'L_CLI_NUEVRE_SEC': return this.injector.get(ClientesNuevosRecurrentesService).obtenerClientesNuevosRecurrentes(nodo);
      case 'L_CLI_PROD_SEC': return this.injector.get(ClientesProductoService).obtenerClientesProducto(nodo);
      case 'L_SEG_SEC': return this.injector.get(SegurosService).obtenerSeguros(nodo);
      case 'L_CER_CUO_SEC': return this.injector.get(CeroCuotasService).obtenerCeroCuotas(nodo);
      case 'L_REC_PREVE_SEC': return this.injector.get(RecuperacionPreventivaService).obtenerRecuperacionPreventiva(nodo);
      case 'L_CAPT_SEC': return this.injector.get(CaptacionesService).obtenerCaptaciones(nodo);
      case 'L_REP_AUTO_SEC': return this.injector.get(AutonomiaTasasService).obtenerAutonomiaTasas(nodo);
      case 'L_PLAN_SEC': return this.injector.get(PlanillaMovilidadService).obtenerPlanillaMovilidad(nodo);
      case 'L_RES_MOV_ASESOR': return this.injector.get(ResumenMovilidadService).obtenerResumenMovilidad(nodo);
      case 'L_INVERS_STOCK_SEC': return this.injector.get(InversionStockMoraService).obtenerGraficos(nodo);
      case 'L_DESEMP_SOC_SEC': return this.injector.get(DesempenoSocialAnalistaService).obtenerDesempenoSocial(nodo);
      case 'L_PROYDIAOPERSEC': return this.injector.get(ColocacionesDiariaService).obtenerColocacionesDiaria(nodo);
      case 'L_REG_PROS_SEC': return this.injector.get(ProspectoCorresponsalService).obtenerProspectos(nodo).pipe(map((tabla1) => ({ tabla1 })));
      default: return throwError(() => new Error(`Reporte no disponible: ${codigo}`));
    }
  }
}

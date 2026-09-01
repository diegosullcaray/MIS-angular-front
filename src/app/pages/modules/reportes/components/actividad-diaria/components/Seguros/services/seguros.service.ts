import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { COD_SEGUROS, GRAFICOS_EVOLUTIVO_PASIVOS } from '../constantes/seguros.constantes';
import { graficoEvolutivoPasivos } from '../utils/seguros-mapeo.util';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { OpcionFiltro } from '../../../../../../../../shared/ui/formularios/opcion-filtro.model';

/**
 * Los cuatro reportes de Seguros. Solo el primero sale del motor "mixto"; los
 * otros tres viven en el repositorio y cada uno usa un motor distinto, así que
 * no comparten helper. Los códigos están en `constantes/`.
 */
@Injectable({ providedIn: 'root' })
export class SegurosService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /** Reporte Seguros. */
  reporteSeguros(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      COD_SEGUROS.reporteSeguros.map((codRep) => ({ codRep })),
      nodo,
    );
  }

  /** Seguros Pasivos. */
  segurosPasivos(nodo: NodoConsulta): Observable<TablaDinamicaResultado[]> {
    const params = this.paramsConFecha(nodo);
    return forkJoin(COD_SEGUROS.segurosPasivos.map((codRep) => this.bloques.tablaRegularCon(codRep, params)));
  }

  /** Opciones del selector de periodo de Seguros Optativos. */
  periodosSegurosOptativos(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos(COD_SEGUROS.periodosSegurosOptativos);
  }

  /**
   * Reporte Seguros Optativos. La `fec` es la del selector de periodo; si no
   * llega, la de corte del usuario, que es con la que abre el legado.
   */
  segurosOptativos(nodo: NodoConsulta, fec = this.bloques.fecha()): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon(COD_SEGUROS.segurosOptativos, { ...this.paramsNodo(nodo), fec });
  }

  /** Evolutivo Pasivos. Sus bloques traen el gráfico serializado dentro del cuerpo. */
  evolutivoPasivos(nodo: NodoConsulta): Observable<BloqueGrafico[]> {
    const params = this.paramsConFecha(nodo);
    return forkJoin(COD_SEGUROS.evolutivoPasivos.map((codRep) => this.reportes.getRegularData(codRep, params))).pipe(
      map((respuestas) =>
        respuestas
          .map((r, i) => {
            const { titulo, tituloEjeY } = GRAFICOS_EVOLUTIVO_PASIVOS[i];
            return graficoEvolutivoPasivos(r, titulo, tituloEjeY);
          })
          .filter((g): g is BloqueGrafico => g !== null),
      ),
    );
  }

  private paramsNodo(nodo: NodoConsulta): Record<string, unknown> {
    return { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel };
  }

  private paramsConFecha(nodo: NodoConsulta): Record<string, unknown> {
    return { ...this.paramsNodo(nodo), fec: this.bloques.fecha() };
  }
}

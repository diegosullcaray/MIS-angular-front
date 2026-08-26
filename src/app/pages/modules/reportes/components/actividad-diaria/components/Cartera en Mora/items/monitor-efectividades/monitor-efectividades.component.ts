import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_PRODUCTO_REASIGNADO,
  OPCIONES_SI_NO,
  OPCIONES_TRAMO,
  OPCIONES_TRAMO_DIAS_GESTION,
  TODO,
} from '../../../Portafolio Reasignado/models/portafolio-reasignado.model';
import { OPCIONES_PRECOSECHA } from '../../models/cartera-en-mora.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/**
 * "Monitor Efectividades" (`leg/com/rda/adm/mon-efec`) — legado `RS_MON_EFEC`
 * (host `cra-v4`), cuatro bloques apilados.
 *
 * Los siete filtros son los del bloque `_02` en `com-map.module.ts`, no los del
 * reporte entero: el legado los pinta sobre esa tabla. Acá van a la franja de
 * filtros de la ventana y, como `consultar()` corre dentro del `effect` de la
 * base, tocar cualquiera vuelve a pedir los bloques solo.
 */
@Component({
  selector: 'app-monitor-efectividades',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './monitor-efectividades.component.html',
  styleUrl: './monitor-efectividades.component.css',
})
export class MonitorEfectividadesComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly opcionesTramo = OPCIONES_TRAMO;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_REASIGNADO;
  protected readonly opcionesSiNo = OPCIONES_SI_NO;
  protected readonly opcionesTramoDias = OPCIONES_TRAMO_DIAS_GESTION;
  protected readonly opcionesPrecosecha = OPCIONES_PRECOSECHA;

  /** Un signal por filtro, con el `selected` que declara cada uno en el legado (todos `TODO`). */
  protected readonly tramo = signal(TODO);
  protected readonly producto = signal(TODO);
  protected readonly compromisoRoto = signal(TODO);
  protected readonly ceroCuota = signal(TODO);
  protected readonly unaCuota = signal(TODO);
  protected readonly tramoDias = signal(TODO);
  protected readonly precosecha = signal(TODO);

  protected readonly titulos = [
    'Monitor de Efectividades',
    'Detalle de Gestiones',
    'Resumen de Gestiones Ingresadas en Tramo -30-0: Operaciones Deterioradas',
    'Resumen de Gestiones Ingresadas en Tramo 1-30',
  ];

  /** `content.lower` de los dos bloques `_03`; los dos primeros no traen leyenda. */
  protected override readonly notas = [
    undefined,
    undefined,
    '<b>a:</b> Número de clientes de riesgo alto y medio alto en el tramo de -30-0.<br>' +
      '<b>b:</b> Número de Gestiones realizadas entre Número de Clientes Gestionados.',
    '<b>a:</b> Número de clientes de riesgo alto y medio alto en el tramo de 1-30.<br>' +
      '<b>b:</b> Número de Gestiones realizadas entre Número de Clientes Gestionados.',
  ];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.monitorEfectividades(nodo, {
      tramof: this.tramo(),
      prod: this.producto(),
      comp_r: this.compromisoRoto(),
      zcuo: this.ceroCuota(),
      ucuo: this.unaCuota(),
      tdcr: this.tramoDias(),
      precosechaf: this.precosecha(),
    });
  }
}

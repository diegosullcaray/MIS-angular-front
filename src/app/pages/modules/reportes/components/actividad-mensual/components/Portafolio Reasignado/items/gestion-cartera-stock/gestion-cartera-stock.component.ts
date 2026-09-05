import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_MOSTRAR_POR,
  MOSTRAR_POR_POR_DEFECTO,
  OPCIONES_TIPO_ASESOR,
  TIPO_ASESOR_POR_DEFECTO,
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Gestión de Cartera Stock" (`leg/com/rma/adm/gest_cart_stock`). */
@Component({
  selector: 'app-mensual-gestion-cartera-stock',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './gestion-cartera-stock.component.html',
  styleUrl: './gestion-cartera-stock.component.css',
})
export class GestionCarteraStockComponent extends ReporteBloquesBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesMostrarPor = OPCIONES_MOSTRAR_POR;
  protected readonly mostrarPor = signal<number>(MOSTRAR_POR_POR_DEFECTO);
  protected readonly opcionesTipoAsesor = OPCIONES_TIPO_ASESOR;
  protected readonly tipoAsesor = signal<number>(TIPO_ASESOR_POR_DEFECTO);
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected override readonly titulos = [
    'GESTIÓN DE CARTERA REASIGNADA STOCK',
    'GESTIÓN DE CARTERA REASIGNADA STOCK (DETALLE)',
  ] as const;

  protected override consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.gestionCarteraStock(nodo, this.mostrarPor(), this.tipoAsesor(), this.fechaBase());
  }
}

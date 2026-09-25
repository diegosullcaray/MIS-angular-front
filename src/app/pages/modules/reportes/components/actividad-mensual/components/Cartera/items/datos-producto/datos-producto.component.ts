import { Component, computed, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent, type PestanaReporte } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import { TABLA_PENDIENTE, type TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import {
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Datos por Producto" (`leg/com/rma/adm/dat-prod-men`). */
@Component({
  selector: 'app-mensual-datos-producto',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './datos-producto.component.html',
  styleUrl: './datos-producto.component.css',
})
export class DatosProductoComponent extends ReporteBloquesBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected override readonly titulos = [
    'Saldo Capital',
    'Cartera Atrasada',
    'N° Clientes',
    'N° Operaciones',
  ] as const;

  protected override readonly notas = [
    undefined,
    undefined,
    '<b>Los datos de Bancarización se compara con el último RCC disponible a la fecha.</b>',
    '<b>Los datos de Bancarización se compara con el último RCC disponible a la fecha.</b>',
  ];

  /** Una pestaña por tabla (Saldo Capital, Cartera Atrasada, N° Clientes, N° Operaciones). */
  protected readonly pestanas = computed<PestanaReporte[]>(() => {
    const bloques = this.bloques();
    // Antes de la primera respuesta, las pestañas ya están con su esqueleto.
    return this.titulos.map((titulo, i) => ({
      id: `tabla-${i}`,
      titulo,
      bloques: [bloques[i] ? { ...bloques[i], titulo: undefined } : { tabla: TABLA_PENDIENTE, nota: this.notas[i], cargando: true }],
    }));
  });

  protected override consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.datosProducto(nodo, this.fechaBase());
  }
}

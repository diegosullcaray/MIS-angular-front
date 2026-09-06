import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { GraficoMixtoComponent } from '../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { InversionStockMoraService } from '../../services/inversion-stock-mora.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteInversionStockMora } from '../../models/inversion-stock-mora.model';
import type { BloqueGrafico } from '../../../../../../../shared/ui/graficos/models/grafico-comun.model';

/** "Inversión y Stock de Mora" — migrado de la ruta `leg/com/rda/sec/inv-stk` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v2`, config `rda/sectorista/brecha/brecha_inversion_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-inversion-stock-mora',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, GraficoMixtoComponent, WindowPanelComponent],
  templateUrl: './inversion-stock-mora.component.html',
})
export class InversionStockMoraComponent extends ReporteAsesorBase<ReporteInversionStockMora> {
  private readonly servicio = inject(InversionStockMoraService);

  protected readonly graficos = signal<BloqueGrafico[]>([]);

  protected readonly avisoSinResultados = 'Este asesor no tiene datos de inversión y stock de mora.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerGraficos(this.nodoDe(asesor));
  }

  protected recibir({ graficos }: ReporteInversionStockMora): boolean {
    this.graficos.set(graficos);
    return graficos.length === 0;
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { DesempenoSocialAnalistaService } from '../../services/desempeno-social-analista.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteDesempenoSocialAnalista } from '../../models/desempeno-social-analista.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Desempeño Social" (analista/sectorista) — migrado de la ruta `leg/com/rda/sec/desempeno-social-as` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `DESE_SOC_AS` en `crs-map.ts`). */
@Component({
  selector: 'app-desempeno-social-analista',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './desempeno-social-analista.component.html',
})
export class DesempenoSocialAnalistaComponent extends ReporteAsesorBase<ReporteDesempenoSocialAnalista> {
  private readonly servicio = inject(DesempenoSocialAnalistaService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene datos de desempeño social, o los datos podrían seguir procesándose.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerDesempenoSocial(this.nodoDe(asesor));
  }

  protected recibir({ tabla1 }: ReporteDesempenoSocialAnalista): boolean {
    this.tabla1.set(tabla1);
    return this.sinFilas(tabla1);
  }
}

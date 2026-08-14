import { Component, inject, signal } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { PARAMS_HIER_UNIDAD } from '../../../models/jerarquia.model';
import { DesarrolloSostenibleService } from '../../../services/desarrollo-sostenible.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import { crearManejadorErrorJerarquia } from '../../../utils/hier-selector-error.util';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Desempeño Social" — migrado de la ruta `desemp-social` (legado STG,
 * `reportes/legacy/comercial/rda/administracion`, `cod_rep: 'DESEMP_SOC'`).
 *
 * El reporte más simple del módulo: sin filtros adicionales ni tarjeta KPI,
 * solo jerarquía + una tabla. El título/leyenda del legado son texto estático
 * (`content.higher`/`lower` sin placeholders `:$...`), así que van fijos en el HTML.
 */
@Component({
  selector: 'app-desempeno-social',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, SkeletonModule, ProgressSpinnerModule, ButtonModule],
  templateUrl: './desempeno-social.component.html',
  styleUrl: './desempeno-social.component.css',
})
export class DesempenoSocialComponent {
  private readonly servicio = inject(DesarrolloSostenibleService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly mostrarFiltros = signal(true);
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(true);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tabla = signal<TablaReporteResultado>(TABLA_VACIA);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.obtenerDesempenoSocial({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (resultado) => {
        this.tabla.set(resultado);
        this.cargando.set(false);

        if (resultado.body.length === 0) {
          this.mensajes.warn(
            'Los datos podrían seguir procesándose en el servidor. Si ves valores en 0, intenta actualizar en unos minutos.',
            'Carga en proceso',
          );
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

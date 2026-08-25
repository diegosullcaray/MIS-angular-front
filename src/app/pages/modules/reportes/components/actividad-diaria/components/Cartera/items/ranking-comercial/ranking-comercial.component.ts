import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { HierSelectorComponent } from '../../../../../../ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';

/** "Ranking Comercial" (`repositorio/actividad-diaria/cartera/rank-comercial`). */
@Component({
  selector: 'app-ranking-comercial',
  standalone: true,
  imports: [
    FormsModule,
    InputTextModule,
    SelectModule,
    HierSelectorComponent,
    TablaDinamicaComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './ranking-comercial.component.html',
  styleUrl: './ranking-comercial.component.css',
})
export class RankingComercialComponent {
  private readonly servicio = inject(CarteraRepositorioService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  private readonly resultado = signal<TablaDinamicaResultado>(TABLA_DINAMICA_VACIA);

  /** Los tres filtros del legado, todos del lado del cliente sobre la data ya traída. */
  protected readonly unidad = signal('');
  protected readonly corredor = signal('');
  protected readonly territorio = signal('');

  /** Opciones del desplegable de territorio, sacadas de la propia data como en el legado. */
  protected readonly territorios = computed(() => {
    const vistos = new Set(this.resultado().filas.map((f) => String(f['des_uter'] ?? '')).filter(Boolean));
    return [{ id: '', desc: 'Todos' }, ...[...vistos].sort().map((t) => ({ id: t, desc: t }))];
  });

  protected readonly columnas = computed(() => this.resultado().columnas);
  protected readonly filas = computed(() => {
    const contiene = (valor: unknown, buscado: string) => String(valor ?? '').toLowerCase().includes(buscado.toLowerCase());
    const territorio = this.territorio();
    return this.resultado().filas.filter(
      (f) =>
        contiene(f['des_uuni'], this.unidad()) &&
        contiene(f['des_ucor'], this.corredor()) &&
        (!territorio || f['des_uter'] === territorio),
    );
  });

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.rankingComercial({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

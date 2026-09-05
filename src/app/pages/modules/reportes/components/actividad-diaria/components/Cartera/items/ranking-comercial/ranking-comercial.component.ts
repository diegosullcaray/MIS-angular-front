import { Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { InputFiltroComponent } from '../../../../../../../../../shared/ui/formularios/input-filtro/input-filtro.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { TABLA_DINAMICA_VACIA, type TablaDinamicaResultado } from '../../../../../../models/tabla-dinamica.model';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';

/**
 * "Ranking Comercial" (`repositorio/actividad-diaria/cartera/rank-comercial`).
 *
 * NO cuelga del selector de jerarquía: el legado pide el ranking completo
 * (`territorio` y `corredor` en `'0'`) y filtra del lado del cliente con sus
 * tres filtros propios. Por eso carga solo al entrar, sin esperar un nivel.
 */
@Component({
  selector: 'app-ranking-comercial',
  standalone: true,
  imports: [
    DecimalPipe,
    InputFiltroComponent,
    SelectFiltroComponent,
    TablaDinamicaComponent,
    EmptyStateComponent,
    WindowPanelComponent,
  ],
  templateUrl: './ranking-comercial.component.html',
})
export class RankingComercialComponent {
  private readonly servicio = inject(CarteraRepositorioService);
  private readonly toast = inject(ToastService);

  protected readonly cargando = signal(false);
  protected readonly error = signal(false);

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

  /**
   * "Avance Esperado" — el `Timing` de la primera fila, que es de dónde lo saca
   * el legado (`avanceEsperado = dataSource[0].Timing`). Es el porcentaje de
   * días transcurridos del mes, y el mismo valor contra el que se compara cada
   * avance para decidir su semáforo.
   */
  protected readonly avanceEsperado = computed(() => {
    const primera = this.resultado().filas[0];
    const timing = Number(primera?.['Timing']);
    return Number.isFinite(timing) ? timing : 0;
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.error.set(false);

    this.servicio.rankingComercial().subscribe({
      next: (resultado) => {
        this.resultado.set(resultado);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }
}

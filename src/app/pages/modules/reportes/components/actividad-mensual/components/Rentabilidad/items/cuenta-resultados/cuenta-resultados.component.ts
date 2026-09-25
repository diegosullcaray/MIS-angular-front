import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import type { Subscription } from 'rxjs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../../../../../shared/ui/inline-error/inline-error.component';
import { ListSkeletonComponent } from '../../../../../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import type { OpcionFiltro } from '../../../../../../../../../shared/ui/formularios/opcion-filtro.model';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import { MENSAJES_CUENTA_RESULTADOS } from '../../../../constantes/actividad-mensual.constantes';
import type { CuentaResultadosResultado } from '../../../../models/cuenta-resultados.model';
import {
  ContratoCuentaResultadosError,
  etiquetaPeriodoCuenta,
  normalizarFechaCuenta,
} from '../../../../utils/cuenta-resultados.util';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';

/** Nodo y periodo de una consulta; `fecha: null` pide el periodo más reciente (`NOW`). */
interface ConsultaCuenta {
  nodo: NodoConsulta;
  fecha: string | null;
}

/**
 * "Cuenta de Resultados" (`repositorio/actividad-mensual/rentabilidad/cuenta-resultados`).
 *
 * Legado `repositorio/cuenta-resultados`: jerarquía 9 y `TAB_CUE_RES_01`. Los
 * periodos no salen de `RS_FECH` sino de la propia respuesta, por eso la primera
 * consulta va con `NOW` y el filtro aparece recién con datos.
 */
@Component({
  selector: 'app-mensual-cuenta-resultados',
  standalone: true,
  imports: [
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    InlineErrorComponent,
    ListSkeletonComponent,
    WindowPanelComponent,
    GrupoFiltrosComponent,
  ],
  templateUrl: './cuenta-resultados.component.html',
})
export class CuentaResultadosComponent {
  private readonly servicio = inject(ActividadMensualRepoService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly resultado = signal<CuentaResultadosResultado | null>(null);
  /** El legado muestra el fallo de jerarquía en la página: no es un "elige un nivel". */
  protected readonly errorJerarquia = signal(false);
  private readonly selector = viewChild(HierSelectorComponent);

  /** Se conservan entre consultas: el legado solo los reemplaza cuando llega otra respuesta. */
  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  protected readonly preliminar = computed(() => this.resultado()?.preliminar ?? false);
  protected readonly etiquetaPeriodo = computed(() => {
    const fecha = this.resultado()?.fecha;
    return fecha ? etiquetaPeriodoCuenta(fecha) : '';
  });

  /** La tabla no resalta por su cuenta: cada nivel ya trae su estilo. */
  protected readonly sinDestacar = () => false;

  /** Solo esta señal dispara consultas; el periodo que devuelve la respuesta no vuelve a pedir. */
  private readonly consulta = signal<ConsultaCuenta | null>(null);

  constructor() {
    effect((onCleanup) => {
      const consulta = this.consulta();
      if (!consulta) return;
      // `untracked`: lo que se lea al suscribirse (p. ej. el token en el interceptor) no debe relanzar la consulta.
      const suscripcion = untracked(() => this.cargar(consulta));
      onCleanup(() => suscripcion.unsubscribe());
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.consulta.set({ nodo: { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fecha: this.periodo() || null });
  }

  protected onPeriodoChange(valor: string): void {
    const fecha = normalizarFechaCuenta(valor);
    if (!fecha || !this.periodos().some((p) => p.id === fecha)) {
      this.error.set(MENSAJES_CUENTA_RESULTADOS.periodoInvalido);
      return;
    }
    this.periodo.set(fecha);
    const nodo = this.consulta()?.nodo;
    if (nodo) this.consulta.set({ nodo, fecha });
  }

  protected onErrorJerarquia(): void {
    this.cargando.set(false);
    this.errorJerarquia.set(true);
  }

  protected reintentarJerarquia(): void {
    this.errorJerarquia.set(false);
    this.selector()?.limpiar();
  }

  protected reintentar(): void {
    const consulta = this.consulta();
    if (consulta) this.consulta.set({ ...consulta });
  }

  private cargar({ nodo, fecha }: ConsultaCuenta): Subscription {
    this.error.set(null);
    this.resultado.set(null);
    this.cargando.set(true);
    return this.servicio.cuentaResultados(nodo, fecha).subscribe({
      next: (resultado) => {
        this.periodos.set(resultado.periodos);
        this.periodo.set(resultado.fecha);
        this.resultado.set(resultado);
        this.cargando.set(false);
      },
      error: (e: unknown) => {
        this.error.set(e instanceof ContratoCuentaResultadosError ? e.message : MENSAJES_CUENTA_RESULTADOS.fallo);
        this.cargando.set(false);
      },
    });
  }
}

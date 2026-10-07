import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import type { Subscription } from 'rxjs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaDinamicaComponent } from '../../../../../../../../../shared/ui/tablas/tabla-dinamica/tabla-dinamica.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { FechaCierreBotonComponent } from '../../../../../../../../../shared/ui/formularios/fecha-cierre-boton/fecha-cierre-boton.component';
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
  crearColumnasCuentaResultados,
  cuentasConDetalle,
  filasConDrillDown,
  etiquetaPeriodoCuenta,
  normalizarFechaCuenta,
} from '../../../../utils/cuenta-resultados.util';
import { RutaJerarquicaComponent } from '../../../../../../ui/ruta-jerarquica/ruta-jerarquica.component';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';

/** Nodo y periodo de una consulta; `fecha: null` pide el periodo más reciente (`NOW`). */
interface ConsultaCuenta {
  nodo: NodoConsulta;
  fecha: string | null;
}

/** "Cuenta de Resultados" (`TAB_CUE_RES_01`). Los periodos vienen en la respuesta: la primera consulta va con `NOW`. */
@Component({
  selector: 'app-mensual-cuenta-resultados',
  standalone: true,
  imports: [
    RutaJerarquicaComponent,
    HierSelectorComponent,
    TablaDinamicaComponent,
    SelectFiltroComponent,
    FechaCierreBotonComponent,
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
  /** `true` hasta que la jerarquía resuelve el nivel inicial. */
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly resultado = signal<CuentaResultadosResultado | null>(null);
  protected readonly errorJerarquia = signal(false);
  private readonly selector = viewChild(HierSelectorComponent);

  protected readonly periodos = signal<OpcionFiltro[]>([]);
  protected readonly periodo = signal('');

  protected readonly preliminar = computed(() => this.resultado()?.preliminar ?? false);
  protected readonly etiquetaPeriodo = computed(() => {
    const fecha = this.resultado()?.fecha;
    return fecha ? etiquetaPeriodoCuenta(fecha) : '';
  });

  /** Ruta de la raíz al nivel elegido, para las migas sobre la tabla. */
  protected readonly ruta = signal<HierarquiaNodo[]>([]);

  protected readonly columnas = computed(() => {
    const reporte = this.resultado();
    return reporte ? crearColumnasCuentaResultados(reporte.fecha, reporte.preliminar) : [];
  });

  /** Códigos de cuentas abiertas; cada consulta nueva las cierra. */
  private readonly abiertas = signal<ReadonlySet<string>>(new Set());
  protected readonly filas = computed(() => filasConDrillDown(this.resultado()?.filas ?? [], this.abiertas()));
  private readonly conDetalleSet = computed(() => cuentasConDetalle(this.resultado()?.filas ?? []));
  protected readonly conDetalle = (fila: Record<string, unknown>) => this.conDetalleSet().has(String(fila['cuenta_codigo']));
  protected readonly desplegada = (fila: Record<string, unknown>) => this.abiertas().has(String(fila['cuenta_codigo']));
  protected readonly columnasDrillDown = ['cuenta_nombre'];

  protected readonly sinDestacar = () => false;

  private readonly consulta = signal<ConsultaCuenta | null>(null);

  constructor() {
    effect((onCleanup) => {
      const consulta = this.consulta();
      if (!consulta) return;
      // `untracked`: lo que se lea al suscribirse no relanza la consulta.
      const suscripcion = untracked(() => this.cargar(consulta));
      onCleanup(() => suscripcion.unsubscribe());
    });
  }

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.consulta.set({ nodo: { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }, fecha: this.periodo() || null });
  }

  /** Clic en una cuenta con detalle: la abre o la cierra. */
  protected onCeldaSeleccionada(evento: { clave: string; fila: Record<string, unknown> }): void {
    const codigo = String(evento.fila['cuenta_codigo']);
    this.abiertas.update((a) => {
      const nueva = new Set(a);
      if (!nueva.delete(codigo)) nueva.add(codigo);
      return nueva;
    });
  }

  /** Una miga vuelve a ese nivel a través del selector, que relanza la consulta. */
  protected volverANivel(indice: number): void {
    const nodo = this.ruta()[indice];
    if (nodo) this.selector()?.seleccionarNodo(nodo);
  }

  protected refrescar(): void {
    const nodo = this.nivelActual();
    if (nodo) this.onNivelSeleccionado({ ...nodo });
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
    this.abiertas.set(new Set());
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

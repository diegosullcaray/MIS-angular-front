import { Component, computed, inject, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { EditableTableComponent } from '../../../ui/editable-table/editable-table.component';
import { calcularPuedeGuardar, calcularPuedeVerificar, esCeldaEditable } from '../../../utils/linea-simple-reglas.util';
import { aplicarCascadaAsesores, calcularFilaCarteraCreditos, PRODUCTOS_COMPOSICION } from '../../../utils/cartera-creditos-calculo.util';
import type { CeldaEditadaEvent, ColumnaTabla, TipoColumna } from '../../../models/tabla.model';
import type { HierarquiaNodo, ParamsJerarquia } from '../../../models/jerarquia.model';
import type { ResumenMetadata } from '../../../models/linea-simple.model';
import type { FilaCarteraCreditosComposicion, FilaCarteraCreditosVariables } from '../../../models/cartera-creditos.model';

const INPUT_COLS = ['b1', 'b3', 'b5', 'b2'];

const COLUMNAS_VARIABLES: ColumnaTabla[] = [
  { label: 'Fecha', key: 'fec_pro', tipo: 'text' },
  { label: 'Saldo Inicial', key: 'a1', tipo: 'number' },
  {
    label: 'Desembolso',
    hijos: [
      { label: 'Asesores Nuevos', key: 'b1', tipo: 'number' },
      { label: 'Asesores en Producción', key: 'b2', tipo: 'number' },
      { label: 'Productividad por Asesor', key: 'b3', tipo: 'number' },
      { label: 'Operaciones Desembolsadas', key: 'b4', tipo: 'number' },
      { label: 'Ticket Promedio', key: 'b5', tipo: 'number' },
      { label: 'Monto Desembolsado', key: 'b6', tipo: 'number' },
    ],
  },
  {
    label: 'Cancelación',
    hijos: [
      { label: 'Ratio Cancelación', key: 'c1', tipo: 'percent' },
      { label: 'Monto Cancelado', key: 'c2', tipo: 'number' },
    ],
  },
  { label: 'Saldo Castigado', key: 'a2', tipo: 'number' },
  { label: 'Saldo Cierre', key: 'a3', tipo: 'number' },
];

function columnasComposicion(prefijo: 'd' | 'g', tipo: TipoColumna): ColumnaTabla[] {
  const core = PRODUCTOS_COMPOSICION.slice(0, 7).map((p) => ({ label: p.label, key: `${prefijo}_${p.id}`, tipo }));
  const noCore = PRODUCTOS_COMPOSICION.slice(7, 10).map((p) => ({ label: p.label, key: `${prefijo}_${p.id}`, tipo }));
  const otros = PRODUCTOS_COMPOSICION[10];

  return [
    { label: 'Fecha', key: 'fec_pro', tipo: 'text' },
    { label: 'Productos Core', hijos: core },
    { label: 'Productos No Core', hijos: noCore },
    { label: 'Otros', key: `${prefijo}_${otros.id}`, tipo },
  ];
}

/**
 * Cartera de Créditos (`/app/presupuesto/lineas/activos/car-cre`) — migrado
 * de `PreActCarteraCreditosComponent` (legado STG). A diferencia de
 * Depósitos/Seguros, no usa `LineaSimpleComponent`: tiene 3 tabs (Variables +
 * dos de composición por producto de solo lectura) y una fórmula de cascada
 * propia con un paso previo especial para Asesores Nuevos/en Producción (ver
 * `utils/cartera-creditos-calculo.util.ts`).
 */
@Component({
  selector: 'app-cartera-creditos',
  standalone: true,
  imports: [HierSelectorComponent, EditableTableComponent, TabsModule, ButtonModule],
  templateUrl: './cartera-creditos.component.html',
  styleUrl: './cartera-creditos.component.css',
})
export class CarteraCreditosComponent {
  private readonly presupuesto = inject(PresupuestoService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier: ParamsJerarquia = { code: 9, maxLvl: 5, dlgTitulo: 'JERARQUIA ADMIN. COMER.' };
  protected readonly columnasVariables = COLUMNAS_VARIABLES;
  protected readonly columnasMonto = columnasComposicion('d', 'number');
  protected readonly columnasRatio = columnasComposicion('g', 'percent');

  protected readonly tabActiva = signal('variables');
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly verificando = signal(false);
  protected readonly filas = signal<FilaCarteraCreditosVariables[]>([]);
  protected readonly filasComposicion = signal<FilaCarteraCreditosComposicion[]>([]);
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  private readonly metadata = signal<ResumenMetadata | null>(null);
  private filasOriginales: FilaCarteraCreditosVariables[] = [];
  private filasComposicionOriginales: FilaCarteraCreditosComposicion[] = [];

  protected readonly puedeGuardar = computed(() =>
    calcularPuedeGuardar(this.metadata(), this.nivelActual(), this.presupuesto.esAdmin())
  );

  protected readonly puedeVerificar = computed(() =>
    calcularPuedeVerificar(this.metadata(), this.nivelActual(), this.presupuesto.esAdmin())
  );

  protected readonly esEditable = (fila: FilaCarteraCreditosVariables, key: string): boolean =>
    esCeldaEditable(fila, key, INPUT_COLS, this.metadata(), this.nivelActual(), this.presupuesto.esAdmin());

  protected readonly soloLectura = (): boolean => false;

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);
    this.metadata.set(null);
    this.filas.set([]);
    this.filasComposicion.set([]);

    this.presupuesto.obtenerResumenCarteraCreditos(nodo.tip_cod, nodo.cod_rel).subscribe({
      next: (resumen) => {
        this.metadata.set(resumen.bp);
        this.filas.set(resumen.ws);
        this.filasComposicion.set(resumen.cs);
        this.filasOriginales = structuredClone(resumen.ws);
        this.filasComposicionOriginales = structuredClone(resumen.cs);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la información', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  protected onCeldaEditada(evento: CeldaEditadaEvent<FilaCarteraCreditosVariables>): void {
    const filas = this.filas();
    const composicion = this.filasComposicion();
    const idx = filas.indexOf(evento.fila);
    if (idx === -1) return;

    const inicio = aplicarCascadaAsesores(filas, idx, evento.key);
    for (let i = inicio; i < filas.length; i++) {
      calcularFilaCarteraCreditos(filas, composicion, i);
    }

    this.filas.set([...filas]);
    this.filasComposicion.set([...composicion]);
  }

  protected reiniciar(): void {
    this.filas.set(structuredClone(this.filasOriginales));
    this.filasComposicion.set(structuredClone(this.filasComposicionOriginales));
  }

  protected guardar(): void {
    const meta = this.metadata();
    const nivel = this.nivelActual();
    if (!meta || !nivel) return;

    const filasAEnviar = this.filas().filter((f) => f.ord >= meta.ord_ini_edi);
    this.guardando.set(true);
    this.presupuesto.guardarResumenCarteraCreditos(nivel.tip_cod, nivel.cod_rel, filasAEnviar).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.exito('Guardado', 'Los cambios se guardaron correctamente.');
      },
      error: () => {
        this.guardando.set(false);
        this.toast.error('No se pudo guardar', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }

  protected verificar(): void {
    const meta = this.metadata();
    const nivel = this.nivelActual();
    if (!meta || !nivel) return;

    this.verificando.set(true);
    this.presupuesto.verificar(nivel.tip_cod, nivel.cod_rel, meta.cod_sec).subscribe({
      next: () => {
        this.verificando.set(false);
        this.toast.exito('Verificado', 'El nivel quedó marcado como verificado.');
      },
      error: () => {
        this.verificando.set(false);
        this.toast.error('No se pudo verificar', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { ClientesReprogramadosService } from '../../services/clientes-reprogramados.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import {
  REPROGRAMACION_FORM_VACIO,
  OPCIONES_PREG_01,
  OPCIONES_PREG_02,
  OPCIONES_PREG_03,
  OPCIONES_PREG_04,
} from '../../models/clientes-reprogramados.model';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { ReprogramacionForm } from '../../models/clientes-reprogramados.model';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado, FilaReporte } from '../../../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Clientes Reprogramados" — migrado de la ruta `leg/com/rda/sec/repro`
 * (legado STG, `reportes/legacy/comercial/rda/sectorista/crs-repro`,
 * `cod_rep: 'RES_SEC_REP'`/`'UP_REPRO_01'`).
 *
 * Mismo patrón que "Encuesta Clientes" (buscador de asesor → lista de
 * clientes → elegir uno → formulario → guardar), pero más simple: acá el
 * formulario no tiene cascada condicional (4 preguntas independientes, sin
 * validación — el legado no deshabilita "Guardar" en ningún caso) y las
 * respuestas se guardan como columnas sueltas del cliente, no anidadas bajo
 * un campo `reaccion` (ver `ClientesReprogramadosService.guardar()`).
 */
@Component({
  selector: 'app-clientes-reprogramados',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, TabsModule, SkeletonModule, TablaReporteComponent, TooltipModule, WindowPanelComponent],
  templateUrl: './clientes-reprogramados.component.html',
  styleUrl: './clientes-reprogramados.component.css',
})
export class ClientesReprogramadosComponent {
  private readonly servicio = inject(ClientesReprogramadosService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly opcionesPreg01 = OPCIONES_PREG_01;
  protected readonly opcionesPreg02 = OPCIONES_PREG_02;
  protected readonly opcionesPreg03 = OPCIONES_PREG_03;
  protected readonly opcionesPreg04 = OPCIONES_PREG_04;

  protected readonly mostrarFiltros = signal(false);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);

  protected readonly tabActiva = signal('lista');
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);

  protected readonly tablaClientes = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly clienteSeleccionado = signal<FilaReporte | null>(null);

  protected readonly model = signal<ReprogramacionForm>({ ...REPROGRAMACION_FORM_VACIO });

  constructor() {
    this.cargarAsesores();
  }

  private cargarAsesores(): void {
    this.servicio.obtenerAsesores().subscribe({
      next: (asesores) => this.asesores.set(asesores),
      error: () => this.toast.error('No se pudo cargar la lista de asesores', 'Inténtalo de nuevo en unos segundos.'),
    });
  }

  protected onAsesorSeleccionado(asesor: AsesorSec | null): void {
    this.asesorSeleccionado.set(asesor);
    if (asesor) this.cargarClientes(asesor);
  }

  private cargarClientes(asesor: AsesorSec): void {
    this.cargando.set(true);
    this.servicio.obtenerClientes({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: (tabla) => {
        this.tablaClientes.set(tabla);
        this.cargando.set(false);
        if (tabla.body.length === 0) {
          this.mensajes.warn('Este asesor no tiene clientes en cartera, o los datos podrían seguir procesándose.', 'Sin resultados');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar la cartera de clientes', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  protected actualizarCampo<K extends keyof ReprogramacionForm>(campo: K, valor: ReprogramacionForm[K]): void {
    this.model.update((m) => ({ ...m, [campo]: valor }));
  }

  /** Precarga las respuestas si el cliente ya las tenía (legado `update()`: `r.row[d.variable]`), en vez de arrancar siempre en blanco. */
  protected onClienteSeleccionado(cliente: FilaReporte): void {
    this.clienteSeleccionado.set(cliente);
    this.model.set({
      preg_01: (cliente['preg_01'] as string) ?? '',
      preg_02: (cliente['preg_02'] as string) ?? '',
      preg_03: (cliente['preg_03'] as number) ?? null,
      preg_04: (cliente['preg_04'] as string) ?? '',
    });
    this.tabActiva.set('encuesta');
  }

  protected onCancelar(): void {
    this.clienteSeleccionado.set(null);
    this.tabActiva.set('lista');
  }

  protected onGuardar(): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente) return;

    this.guardando.set(true);
    this.servicio.guardar(cliente, this.model()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.exito('Datos guardados', 'Las respuestas se guardaron correctamente.');
        this.tabActiva.set('lista');
        this.clienteSeleccionado.set(null);
        const asesor = this.asesorSeleccionado();
        if (asesor) this.cargarClientes(asesor);
      },
      error: () => {
        this.guardando.set(false);
        this.toast.error('No se pudo guardar', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }
}

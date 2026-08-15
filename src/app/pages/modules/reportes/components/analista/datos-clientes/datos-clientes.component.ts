import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { DatosClientesService } from '../../../services/analista/datos-clientes.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import {
  DATOS_CLIENTE_FORM_VACIO,
  REFERENCIA_BANTOTAL_VACIA,
  PATRON_NUM_TELE,
  OPCIONES_TIPO_TELE,
  OPCIONES_OPE_TELE,
  OPCIONES_PLAN_TELE,
  OPCIONES_WHATSAPP,
  OPCIONES_VERIFICADOR_TELE,
  OPCIONES_VERIFICADOR_CIIU,
  filaAFormulario,
  filaAReferencia,
} from '../../../models/analista/datos-clientes.model';
import type { CelForm, DatosClienteForm, OpcionDato } from '../../../models/analista/datos-clientes.model';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado, FilaReporte } from '../../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Datos Clientes" — migrado de la ruta `leg/com/rda/sec/cli-act` (legado
 * STG, `reportes/legacy/comercial/rda/sectorista/crs-cli-act`,
 * `cod_rep: 'DET_CLI'`/`'UPD_CLI_01'`).
 *
 * Mismo patrón que "Encuesta Clientes"/"Clientes Reprogramados", con el
 * formulario más complejo de los tres: 2 teléfonos (con sus propios
 * tipo/operador/plan/whatsapp) + 3 CIIU, sin cascada condicional pero con
 * auto-completado cruzado — al marcar "Verificador Teléfono"/"Verificador
 * CIIU", si el primer teléfono/CIIU editable está vacío, se copia ahí la
 * referencia ya registrada en BanTotal (`bantotal.cel`/`bantotal.ciu`,
 * `num_tele_0`/`ciiu_0_id` de la fila — de solo lectura, nunca editable).
 * El legado usa 2 `FormArray` (`cels`/`cius`), pero de tamaño fijo (ver
 * `datos-clientes.model.ts`) — acá son tuplas simples.
 */
@Component({
  selector: 'app-datos-clientes',
  standalone: true,
  imports: [FormsModule, SelectModule, InputTextModule, ButtonModule, TabsModule, SkeletonModule, TablaReporteComponent],
  templateUrl: './datos-clientes.component.html',
  styleUrl: './datos-clientes.component.css',
})
export class DatosClientesComponent {
  private readonly servicio = inject(DatosClientesService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly opcionesTipoTele = OPCIONES_TIPO_TELE;
  protected readonly opcionesOpeTele = OPCIONES_OPE_TELE;
  protected readonly opcionesPlanTele = OPCIONES_PLAN_TELE;
  protected readonly opcionesWhatsapp = OPCIONES_WHATSAPP;
  protected readonly opcionesVerificadorTele = OPCIONES_VERIFICADOR_TELE;
  protected readonly opcionesVerificadorCiiu = OPCIONES_VERIFICADOR_CIIU;

  protected readonly mostrarFiltros = signal(false);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);
  protected readonly ciiu = signal<OpcionDato[]>([]);

  protected readonly tabActiva = signal('lista');
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);

  protected readonly tablaClientes = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly clienteSeleccionado = signal<FilaReporte | null>(null);

  protected readonly model = signal<DatosClienteForm>({ ...DATOS_CLIENTE_FORM_VACIO });
  /** Teléfono/CIIU ya registrados en BanTotal — de solo lectura, seteados al elegir un cliente. */
  protected readonly referencia = signal(REFERENCIA_BANTOTAL_VACIA);

  protected readonly formValido = computed(() => {
    const m = this.model();
    const emailValido = !m.email || REGEX_EMAIL.test(m.email);
    const telefonosValidos = m.cels.every((c) => !c.numTele || PATRON_NUM_TELE.test(c.numTele));
    return emailValido && telefonosValidos;
  });

  constructor() {
    this.cargarAsesores();
    this.cargarCiiu();
  }

  private cargarAsesores(): void {
    this.servicio.obtenerAsesores().subscribe({
      next: (asesores) => this.asesores.set(asesores),
      error: () => this.toast.error('No se pudo cargar la lista de asesores', 'Inténtalo de nuevo en unos segundos.'),
    });
  }

  private cargarCiiu(): void {
    this.servicio.obtenerCiiu().subscribe({
      next: (ciiu) => this.ciiu.set(ciiu),
      // El CIIU solo alimenta los selects "CIIU - 1/2/3" — si falla, no bloquea el resto de la pantalla.
      error: () => undefined,
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

  protected actualizarCampo<K extends keyof DatosClienteForm>(campo: K, valor: DatosClienteForm[K]): void {
    this.model.update((m) => ({ ...m, [campo]: valor }));
  }

  protected actualizarCel<K extends keyof CelForm>(indice: number, campo: K, valor: CelForm[K]): void {
    this.model.update((m) => {
      const cels: [CelForm, CelForm] = [...m.cels];
      cels[indice as 0 | 1] = { ...cels[indice as 0 | 1], [campo]: valor };
      return { ...m, cels };
    });
  }

  protected actualizarCiu(indice: number, valor: string): void {
    this.model.update((m) => {
      const cius: [string, string, string] = [...m.cius];
      cius[indice as 0 | 1 | 2] = valor;
      return { ...m, cius };
    });
  }

  /** Si el primer teléfono/CIIU editable está vacío, copia ahí la referencia de BanTotal — legado `verNumF.valueChanges`/`verCiiuF.valueChanges`. */
  protected onVerificadorNumTeleChange(valor: string): void {
    this.actualizarCampo('verificadorNumTele', valor);
    const ref = this.referencia();
    if (valor && !this.model().cels[0].numTele && ref.cel) this.actualizarCel(0, 'numTele', ref.cel);
  }

  protected onVerificadorCiiuChange(valor: string): void {
    this.actualizarCampo('verificadorCiiu', valor);
    const ref = this.referencia();
    if (valor && !this.model().cius[0] && ref.ciu) this.actualizarCiu(0, ref.ciu);
  }

  /** Precarga los datos ya registrados del cliente (legado `update()`), en vez de arrancar siempre en blanco. */
  protected onClienteSeleccionado(cliente: FilaReporte): void {
    this.clienteSeleccionado.set(cliente);
    this.model.set(filaAFormulario(cliente));
    this.referencia.set(filaAReferencia(cliente));
    this.tabActiva.set('encuesta');
  }

  protected onCancelar(): void {
    this.clienteSeleccionado.set(null);
    this.tabActiva.set('lista');
  }

  protected onGuardar(): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente || !this.formValido()) return;

    this.guardando.set(true);
    this.servicio.guardar(cliente, this.model(), this.referencia()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.exito('Datos guardados', 'Los datos se guardaron correctamente.');
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

import { Component, computed, inject, signal } from '@angular/core';
import { form, hidden, required } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TabsModule } from 'primeng/tabs';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { EncuestaClientesService } from '../../../services/analista/encuesta-clientes.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import {
  ENCUESTA_CLIENTE_FORM_VACIO,
  OPCIONES_AFEC_NEG,
  OPCIONES_FUN_NEG,
  OPCIONES_SIT_NEG,
  OPCIONES_RED_NEG,
  OPCIONES_SEC_ECO,
  jsonAFormulario,
} from '../../../models/analista/encuesta-clientes.model';
import type { CiiuOpcion, EncuestaClienteForm } from '../../../models/analista/encuesta-clientes.model';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado, FilaReporte } from '../../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Encuesta Clientes" — migrado de la ruta `leg/com/rda/sec/cap-ret` (legado
 * STG, `reportes/legacy/comercial/rda/sectorista/crs-cap-ret`, título real
 * "Capacidad de Minorista", `cod_rep: 'LIS_CAPRET'`/`'UPD_CAPRET_01'`).
 *
 * A diferencia del resto de `reportes` (solo lectura), esta pantalla permite
 * elegir un cliente de la cartera de un asesor y guardar una encuesta de
 * impacto/situación de negocio contra el backend (`ModSeccionesService`,
 * módulo "secciones" — no "reporting" — porque así lo hace el legado
 * `ComercialService.postRegularUpdate` → `ModSecService.updateData`).
 *
 * No se replican las 4 selects "Tipo Teléfono/Operador/Plan/Whatsapp" del
 * `.ts` legado: confirmado que no se renderizan en su `.html` (código muerto).
 * Tampoco el modo dual "auto-selección si sos asesor" de
 * `app-auto-complete-sec` (requeriría exponer `tip_use` en
 * `ShellStateService`, no disponible) — acá el buscador de asesores está
 * siempre visible.
 */
@Component({
  selector: 'app-encuesta-clientes',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, TabsModule, SkeletonModule, TablaReporteComponent],
  templateUrl: './encuesta-clientes.component.html',
  styleUrl: './encuesta-clientes.component.css',
})
export class EncuestaClientesComponent {
  private readonly servicio = inject(EncuestaClientesService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly opcionesAfecNeg = OPCIONES_AFEC_NEG;
  protected readonly opcionesFunNeg = OPCIONES_FUN_NEG;
  protected readonly opcionesSitNeg = OPCIONES_SIT_NEG;
  protected readonly opcionesRedNeg = OPCIONES_RED_NEG;
  protected readonly opcionesSecEco = OPCIONES_SEC_ECO;

  protected readonly mostrarFiltros = signal(false);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);
  protected readonly ciiu = signal<CiiuOpcion[]>([]);

  protected readonly tabActiva = signal('lista');
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);

  protected readonly tablaClientes = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly clienteSeleccionado = signal<FilaReporte | null>(null);

  protected readonly model = signal<EncuestaClienteForm>({ ...ENCUESTA_CLIENTE_FORM_VACIO });

  /**
   * Cascada condicional 1:1 con `initForm()` del legado (`valueChanges` +
   * `setValidators()`/`.hidden`), acá vía `hidden()`/`required(..., {when})`
   * de Signal Forms:
   * - `funNeg==='Si'` ⇒ `sitNeg` visible+requerido; `secEco`/`girNeg` ocultos.
   * - `funNeg==='Cambio Giro'` ⇒ `sitNeg` y `secEco` visibles+requeridos;
   *   `girNeg` requerido pero oculto hasta que `secEco` tenga valor.
   * - `funNeg==='No presenta Negocio'` ⇒ todo lo demás oculto, nada requerido.
   * - `sitNeg==='Se redujo'` ⇒ `redNeg` visible+requerido.
   */
  protected readonly encuestaForm = form(this.model, (schemaPath) => {
    required(schemaPath.afecNeg, { message: 'Este campo es requerido' });
    required(schemaPath.funNeg, { message: 'Este campo es requerido' });

    hidden(schemaPath.sitNeg, ({ valueOf }) => valueOf(schemaPath.funNeg) !== 'Si' && valueOf(schemaPath.funNeg) !== 'Cambio Giro');
    required(schemaPath.sitNeg, {
      message: 'Este campo es requerido',
      when: ({ valueOf }) => valueOf(schemaPath.funNeg) === 'Si' || valueOf(schemaPath.funNeg) === 'Cambio Giro',
    });

    hidden(schemaPath.secEco, ({ valueOf }) => valueOf(schemaPath.funNeg) !== 'Cambio Giro');
    required(schemaPath.secEco, {
      message: 'Este campo es requerido',
      when: ({ valueOf }) => valueOf(schemaPath.funNeg) === 'Cambio Giro',
    });

    hidden(schemaPath.redNeg, ({ valueOf }) => valueOf(schemaPath.sitNeg) !== 'Se redujo');
    required(schemaPath.redNeg, {
      message: 'Este campo es requerido',
      when: ({ valueOf }) => valueOf(schemaPath.sitNeg) === 'Se redujo',
    });

    hidden(schemaPath.girNeg, ({ valueOf }) => valueOf(schemaPath.funNeg) !== 'Cambio Giro' || !valueOf(schemaPath.secEco));
    required(schemaPath.girNeg, {
      message: 'Este campo es requerido',
      when: ({ valueOf }) => valueOf(schemaPath.funNeg) === 'Cambio Giro' && !!valueOf(schemaPath.secEco),
    });
  });

  /** Opciones de "Giro de negocio" filtradas de la lista CIIU por el sector económico elegido — legado `secEcoF.valueChanges`. */
  protected readonly opcionesGirNeg = computed(() =>
    this.ciiu()
      .filter((c) => c.sec_eco === this.model().secEco)
      .map((c) => ({ id: c.id, desc: c.desc }))
  );

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
      // El CIIU solo alimenta el select "Giro de negocio" — si falla, no bloquea el resto de la pantalla.
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

  /**
   * Actualiza un campo del modelo — los `p-select` del formulario se atan con
   * `[ngModel]`/`(ngModelChange)` (mismo patrón híbrido que ya usa
   * `ranking-filtros.component.ts`: PrimeNG no tiene precedente confirmado en
   * este repo de integrar `[formField]` directo, así que Signal Forms
   * (`encuestaForm`) se usa solo para la validez/visibilidad derivadas del
   * mismo `model`, no para el binding de valor en sí).
   */
  protected actualizarCampo<K extends keyof EncuestaClienteForm>(campo: K, valor: EncuestaClienteForm[K]): void {
    this.model.update((m) => ({ ...m, [campo]: valor }));
  }

  /** Precarga la encuesta si el cliente ya la había respondido antes (legado `update()`: `JSON.parse(r.row.reaccion)`), en vez de arrancar siempre en blanco. */
  protected onClienteSeleccionado(cliente: FilaReporte): void {
    this.clienteSeleccionado.set(cliente);
    const reaccion = cliente['reaccion'];
    this.model.set(reaccion ? jsonAFormulario(this.parsearReaccion(reaccion)) : { ...ENCUESTA_CLIENTE_FORM_VACIO });
    this.tabActiva.set('encuesta');
  }

  private parsearReaccion(reaccion: unknown): unknown {
    if (typeof reaccion !== 'string') return reaccion;
    try {
      return JSON.parse(reaccion);
    } catch {
      return {};
    }
  }

  protected onCancelar(): void {
    this.clienteSeleccionado.set(null);
    this.tabActiva.set('lista');
  }

  protected onGuardar(): void {
    const cliente = this.clienteSeleccionado();
    if (!cliente || !this.encuestaForm().valid()) return;

    this.guardando.set(true);
    this.servicio.guardarEncuesta(cliente, this.model()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.toast.exito('Encuesta guardada', 'Las respuestas se guardaron correctamente.');
        this.tabActiva.set('lista');
        this.clienteSeleccionado.set(null);
        const asesor = this.asesorSeleccionado();
        if (asesor) this.cargarClientes(asesor);
      },
      error: () => {
        this.guardando.set(false);
        this.toast.error('No se pudo guardar la encuesta', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }
}

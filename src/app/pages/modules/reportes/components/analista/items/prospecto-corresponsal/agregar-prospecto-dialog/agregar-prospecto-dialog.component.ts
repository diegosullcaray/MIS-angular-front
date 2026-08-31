import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { form, hidden, required } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ProspectoCorresponsalService } from '../../../services/prospecto-corresponsal.service';
import { ToastService } from '../../../../../../../../shared/services/toast.service';
import {
  OPCIONES_CANAL_CAPTACION,
  OPCIONES_CTA_LICENCIA,
  OPCIONES_TIPO_AGENTE,
  PROSPECTO_CORRESPONSAL_FORM_VACIO,
} from '../../../models/prospecto-corresponsal.model';
import type { OpcionJerarquia, ProspectoCorresponsalForm } from '../../../models/prospecto-corresponsal.model';

/** Diálogo "Registro Prospecto" — botón "Nuevo" de `crs-prospe.component.ts` (legado `AddProspecomponent`/`add-prospe.component.html`). */
@Component({
  selector: 'app-agregar-prospecto-dialog',
  standalone: true,
  imports: [FormsModule, DialogModule, ButtonModule, SelectModule, InputTextModule],
  templateUrl: './agregar-prospecto-dialog.component.html',
})
export class AgregarProspectoDialogComponent {
  private readonly servicio = inject(ProspectoCorresponsalService);
  private readonly toast = inject(ToastService);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() guardado = new EventEmitter<void>();

  protected readonly opcionesTipoAgente = OPCIONES_TIPO_AGENTE;
  protected readonly opcionesCtaLicencia = OPCIONES_CTA_LICENCIA;
  protected readonly opcionesCanalCaptacion = OPCIONES_CANAL_CAPTACION;

  protected readonly guardando = signal(false);
  protected readonly jerarquia = signal<OpcionJerarquia[]>([]);

  protected readonly opcionesAgencia = computed(() => this.porCategoria('Agencia'));
  protected readonly opcionesTerritorio = computed(() => this.porCategoria('Territorio'));
  protected readonly opcionesCorredor = computed(() => this.porCategoria('Corredor'));
  protected readonly opcionesDepartamento = computed(() => this.porCategoria('Departamento'));
  protected readonly opcionesProvincia = computed(() => this.porCategoria('Provincia'));
  protected readonly opcionesDistrito = computed(() => this.porCategoria('Distrito'));
  protected readonly opcionesCiiu = computed(() => this.porCategoria('ciiu'));

  protected readonly model = signal<ProspectoCorresponsalForm>({ ...PROSPECTO_CORRESPONSAL_FORM_VACIO });

  protected readonly prospectoForm = form(this.model, (schemaPath) => {
    required(schemaPath.HAPENOMB, { message: 'Este campo es requerido' });
    required(schemaPath.HNUMDOC, { message: 'Este campo es requerido' });
    required(schemaPath.HNUMRUC, { message: 'Este campo es requerido' });
    required(schemaPath.HCELULAR, { message: 'Este campo es requerido' });
    required(schemaPath.HDCIIU, { message: 'Este campo es requerido' });
    required(schemaPath.HDIREC, { message: 'Este campo es requerido' });
    required(schemaPath.HDEPA, { message: 'Este campo es requerido' });
    required(schemaPath.HPROV, { message: 'Este campo es requerido' });
    required(schemaPath.HDISTR, { message: 'Este campo es requerido' });
    required(schemaPath.HDESTER, { message: 'Este campo es requerido' });
    required(schemaPath.HDESCOR, { message: 'Este campo es requerido' });
    required(schemaPath.HDESAGE, { message: 'Este campo es requerido' });
    required(schemaPath.HGEOLATI, { message: 'Este campo es requerido' });
    required(schemaPath.HGEOLON, { message: 'Este campo es requerido' });
    required(schemaPath.HNOMCOM, { message: 'Este campo es requerido' });
    required(schemaPath.HTIPAGENT, { message: 'Este campo es requerido' });
    required(schemaPath.HTAPERCC, { message: 'Este campo es requerido' });
    required(schemaPath.HCONSRUC, { message: 'Este campo es requerido' });
    required(schemaPath.HCONSRCC, { message: 'Este campo es requerido' });
    required(schemaPath.HCTALICEF, { message: 'Este campo es requerido' });
    required(schemaPath.HCANACAP, { message: 'Este campo es requerido' });
    required(schemaPath.HCODSECASIG, { message: 'Este campo es requerido' });
    required(schemaPath.HASEASIG, { message: 'Este campo es requerido' });

    hidden(schemaPath.HLICFUNCI, ({ valueOf }) => valueOf(schemaPath.HCTALICEF) !== 'SI');
    required(schemaPath.HLICFUNCI, {
      message: 'Este campo es requerido',
      when: ({ valueOf }) => valueOf(schemaPath.HCTALICEF) === 'SI',
    });
  });

  constructor() {
    this.cargarJerarquia();
  }

  private cargarJerarquia(): void {
    this.servicio.obtenerJerarquia().subscribe({
      next: (jerarquia) => this.jerarquia.set(jerarquia),
      // Alimenta selects secundarios del formulario — si falla, no bloquea el resto del diálogo.
      error: () => undefined,
    });
  }

  private porCategoria(secEco: string): OpcionJerarquia[] {
    return this.jerarquia().filter((o) => o.sec_eco === secEco);
  }

  protected actualizarCampo<K extends keyof ProspectoCorresponsalForm>(campo: K, valor: ProspectoCorresponsalForm[K]): void {
    this.model.update((m) => ({ ...m, [campo]: valor }));
  }

  protected onGuardar(): void {
    if (!this.prospectoForm().valid()) return;

    this.guardando.set(true);
    this.servicio.guardarProspecto(this.model()).subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardado.emit();
        this.cerrar();
      },
      error: () => {
        this.guardando.set(false);
        this.toast.error('No se pudo registrar el prospecto', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }

  protected cerrar(): void {
    this.model.set({ ...PROSPECTO_CORRESPONSAL_FORM_VACIO });
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

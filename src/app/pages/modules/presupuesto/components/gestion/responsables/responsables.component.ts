import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { EditableTableComponent } from '../../../ui/editable-table/editable-table.component';
import { filtrarPorDescripcion } from '../../../utils/texto.util';
import type { ColumnaTabla } from '../../../models/tabla.model';
import type { NivelJerarquiaFijo, ResponsableFila } from '../../../models/responsables.model';

const NIVELES: NivelJerarquiaFijo[] = [
  { tip_cod: 7, des_lvl: 'Financiera' },
  { tip_cod: 15, des_lvl: 'Territorio' },
  { tip_cod: 14, des_lvl: 'Corredor' },
  { tip_cod: 11, des_lvl: 'Administrador' },
  { tip_cod: 4, des_lvl: 'Agencia' },
  { tip_cod: 9, des_lvl: 'Banca Preferente' },
];

const COLUMNAS: ColumnaTabla[] = [
  { label: 'Elemento', key: 'des_rel', tipo: 'text' },
  { label: 'Correo', key: 'cod_res', tipo: 'text' },
  { label: 'Usuario Registro', key: 'usu_log', tipo: 'text' },
  { label: 'Hora Registro', key: 'tim_log', tipo: 'text' },
];

/**
 * Responsables (`/app/presupuesto/gestion/sistema/resp`) — migrado de
 * `PreGesSisResponsablesComponent` (legado STG). Sin selector de jerarquía
 * tipo árbol: usa 6 niveles fijos (`dataLvls`), "Administrador" por defecto.
 * Única columna editable: el correo del responsable (`cod_res`) — a
 * diferencia de las pantallas de línea simple, no depende de nivel
 * editable/admin: el legado la deja editable siempre.
 */
@Component({
  selector: 'app-responsables',
  standalone: true,
  imports: [EditableTableComponent, SelectModule, InputTextModule, ButtonModule, FormsModule],
  templateUrl: './responsables.component.html',
  styleUrl: './responsables.component.css',
})
export class ResponsablesComponent implements OnInit {
  private readonly presupuesto = inject(PresupuestoService);
  private readonly toast = inject(ToastService);

  protected readonly niveles = NIVELES;
  protected readonly columnas = COLUMNAS;
  protected readonly nivelActual = signal<NivelJerarquiaFijo>(NIVELES[3]);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly filas = signal<ResponsableFila[]>([]);
  protected readonly filtro = signal('');
  private filasOriginales: ResponsableFila[] = [];

  protected readonly filasFiltradas = computed(() => filtrarPorDescripcion(this.filas(), this.filtro()));

  protected readonly esEditable = (_fila: ResponsableFila, key: string): boolean => key === 'cod_res';

  ngOnInit(): void {
    this.cargar(this.nivelActual().tip_cod);
  }

  protected onNivelCambiado(nivel: NivelJerarquiaFijo): void {
    this.nivelActual.set(nivel);
    this.filtro.set('');
    this.cargar(nivel.tip_cod);
  }

  protected reiniciar(): void {
    this.filas.set(structuredClone(this.filasOriginales));
  }

  protected guardar(): void {
    this.guardando.set(true);
    this.presupuesto.guardarResponsables(this.filas()).subscribe({
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

  private cargar(tipCod: number): void {
    this.cargando.set(true);
    this.presupuesto.obtenerResponsables(tipCod).subscribe({
      next: (filas) => {
        this.filas.set(filas);
        this.filasOriginales = structuredClone(filas);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de responsables', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}

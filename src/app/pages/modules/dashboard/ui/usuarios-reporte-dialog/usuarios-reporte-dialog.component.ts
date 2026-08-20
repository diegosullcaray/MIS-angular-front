import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ListboxModule } from 'primeng/listbox';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { ReporteDashboard, ReporteListItem, UsuariosPorReporte } from '../../models/reporte.model';

const TODOS_ID = '_ALL_';
const TODOS_NOMBRE = 'Todos';

/** Diálogo de administración de usuarios con acceso por reporte — reemplaza a `UsuariosComponent`/`UsuariosDialogComponent` (legado STG, `pages/modules/reportes-e/usuarios`, ambos extendían `UsuariosBaseComponent`). */
@Component({
  selector: 'app-usuarios-reporte-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, InputTextModule, ListboxModule, FormsModule],
  templateUrl: './usuarios-reporte-dialog.component.html',
  styleUrl: './usuarios-reporte-dialog.component.css',
})
export class UsuariosReporteDialogComponent {
  private readonly dashboard = inject(DashboardService);
  private readonly toast = inject(ToastService);

  readonly visible = input(false);
  readonly reportes = input<ReporteDashboard[]>([]);

  readonly visibleChange = output<boolean>();

  protected readonly reporteSeleccionado = signal<ReporteListItem | null>(null);
  protected readonly usuarios = signal<string[]>([]);
  protected readonly usuarioSeleccionado = signal<string | null>(null);
  protected readonly nuevoCodBt = signal('');
  protected readonly cargandoUsuarios = signal(false);
  protected readonly guardando = signal(false);

  /** `id` de reporte → lista de `cod_bt` editada — signal (no `Map` mutado in-place) para que `huboCambios` se recalcule correctamente. */
  private readonly cambiosPorReporte = signal<Record<string, string[]>>({});
  private readonly originalPorReporte = new Map<string, string[]>();

  protected readonly listaReportes = computed<ReporteListItem[]>(() => [
    { id: TODOS_ID, name: TODOS_NOMBRE },
    ...this.reportes().map((r) => ({ id: r.id, name: r.name })),
  ]);

  protected readonly huboCambios = computed(() => Object.keys(this.cambiosPorReporte()).length > 0);
  protected readonly puedeAgregar = computed(() => !!this.reporteSeleccionado() && this.nuevoCodBt().trim() !== '');
  protected readonly puedeQuitar = computed(() => !!this.usuarioSeleccionado());
  protected readonly puedeRefrescar = computed(() => !!this.reporteSeleccionado());

  protected seleccionarReporte(item: ReporteListItem): void {
    this.reporteSeleccionado.set(item);
    this.usuarioSeleccionado.set(null);

    const editado = this.cambiosPorReporte()[item.id];
    if (editado) {
      this.usuarios.set(editado);
      return;
    }

    this.cargandoUsuarios.set(true);
    this.dashboard.obtenerUsuariosReporte(item.id).subscribe({
      next: (lista) => {
        this.originalPorReporte.set(item.id, lista);
        this.usuarios.set(lista);
        this.cargandoUsuarios.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de usuarios', 'Inténtalo de nuevo en unos segundos.');
        this.cargandoUsuarios.set(false);
      },
    });
  }

  protected seleccionarUsuario(codBt: string): void {
    this.usuarioSeleccionado.set(codBt);
  }

  protected agregarUsuario(): void {
    const reporte = this.reporteSeleccionado();
    const codBt = this.nuevoCodBt().trim();
    if (!reporte || !codBt) return;

    const actualizada = [...this.usuarios(), codBt];
    this.usuarios.set(actualizada);
    this.cambiosPorReporte.update((mapa) => ({ ...mapa, [reporte.id]: actualizada }));
    this.nuevoCodBt.set('');
  }

  protected quitarUsuario(): void {
    const reporte = this.reporteSeleccionado();
    const codBt = this.usuarioSeleccionado();
    if (!reporte || !codBt) return;

    const actualizada = this.usuarios().filter((u) => u !== codBt);
    this.usuarios.set(actualizada);
    this.cambiosPorReporte.update((mapa) => ({ ...mapa, [reporte.id]: actualizada }));
    this.usuarioSeleccionado.set(null);
  }

  protected refrescarUsuario(): void {
    const reporte = this.reporteSeleccionado();
    if (!reporte) return;

    const original = this.originalPorReporte.get(reporte.id) ?? [];
    this.usuarios.set([...original]);
    this.cambiosPorReporte.update((mapa) => {
      const { [reporte.id]: _quitado, ...resto } = mapa;
      return resto;
    });
    this.usuarioSeleccionado.set(null);
  }

  protected guardarTodo(): void {
    if (!this.huboCambios()) return;

    const cambios: UsuariosPorReporte[] = Object.entries(this.cambiosPorReporte()).map(([id, lista]) => ({
      id,
      val: lista.join(','),
    }));

    this.guardando.set(true);
    this.dashboard.guardarUsuariosPorReporte(cambios).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cambiosPorReporte.set({});
        this.toast.exito('Guardado', 'Los cambios de usuarios se guardaron correctamente.');
      },
      error: () => {
        this.guardando.set(false);
        this.toast.error('No se pudo guardar', 'Inténtalo de nuevo en unos segundos.');
      },
    });
  }

  protected cerrar(): void {
    this.visibleChange.emit(false);
  }
}

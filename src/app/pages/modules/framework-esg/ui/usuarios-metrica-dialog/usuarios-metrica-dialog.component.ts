import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ListboxModule } from 'primeng/listbox';
import { FrameworkEsgService } from '../../services/framework-esg.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { EsgCategoriaConfig } from '../../models/configuracion.model';
import type { EsgMetricaListItem, EsgUsuariosPorMetrica } from '../../models/metrica.model';

const TODOS_ID_PREFIJO = '-';
const TODOS_NOMBRE = 'Todos';

/** Diálogo de administración de usuarios con acceso por métrica ESG — reemplaza a `UsuariosComponent`/`UsuariosDialogComponent` (legado STG, ambos extendían `UsuariosBaseComponent`; acá se resuelve como un único componente con `p-dialog`, sin la variante enrutada para mobile del legado, igual que `EditarMetricaDialogComponent`). */
@Component({
  selector: 'app-usuarios-metrica-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, InputTextModule, SelectModule, ListboxModule, FormsModule],
  templateUrl: './usuarios-metrica-dialog.component.html',
})
export class UsuariosMetricaDialogComponent {
  private readonly esg = inject(FrameworkEsgService);
  private readonly toast = inject(ToastService);

  readonly visible = input(false);
  readonly categorias = input<EsgCategoriaConfig[]>([]);
  /** Métricas de cada categoría (`cod_cat` → lista), construidas por el padre a partir de las filas ya cargadas (`is_nod=0`). */
  readonly metricasPorCategoria = input<Record<number, EsgMetricaListItem[]>>({});

  readonly visibleChange = output<boolean>();

  protected readonly categoriaSeleccionada = signal<number | null>(null);
  protected readonly metricaSeleccionada = signal<EsgMetricaListItem | null>(null);
  protected readonly usuarios = signal<string[]>([]);
  protected readonly usuarioSeleccionado = signal<string | null>(null);
  protected readonly nuevoCodBt = signal('');
  protected readonly cargandoUsuarios = signal(false);
  protected readonly guardando = signal(false);

  /** `id` de métrica → lista de `cod_bt` editada — solo entradas modificadas en esta sesión del diálogo. */
  private readonly cambiosPorMetrica = signal<Record<string, string[]>>({});
  /** Snapshot original devuelto por el backend, para poder "Refrescar" (deshacer cambios de la métrica actual) — no se lee desde ningún `computed`, un `Map` alcanza. */
  private readonly originalPorMetrica = new Map<string, string[]>();

  protected readonly metricas = computed<EsgMetricaListItem[]>(() => {
    const cod = this.categoriaSeleccionada();
    if (cod === null) return [];
    const propias = this.metricasPorCategoria()[cod] ?? [];
    return [{ id: `${TODOS_ID_PREFIJO}${cod}`, nombre: TODOS_NOMBRE }, ...propias];
  });

  protected readonly huboCambios = computed(() => Object.keys(this.cambiosPorMetrica()).length > 0);
  protected readonly puedeAgregar = computed(() => !!this.metricaSeleccionada() && this.nuevoCodBt().trim() !== '');
  protected readonly puedeQuitar = computed(() => !!this.usuarioSeleccionado());
  protected readonly puedeRefrescar = computed(() => !!this.metricaSeleccionada());

  protected seleccionarCategoria(cod: number): void {
    this.categoriaSeleccionada.set(cod);
    this.metricaSeleccionada.set(null);
    this.usuarios.set([]);
    this.usuarioSeleccionado.set(null);
  }

  protected seleccionarMetrica(item: EsgMetricaListItem): void {
    this.metricaSeleccionada.set(item);
    this.usuarioSeleccionado.set(null);

    const editado = this.cambiosPorMetrica()[item.id];
    if (editado) {
      this.usuarios.set(editado);
      return;
    }

    this.cargandoUsuarios.set(true);
    this.esg.obtenerUsuariosMetrica(item.id).subscribe({
      next: (lista) => {
        this.originalPorMetrica.set(item.id, lista);
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
    const metrica = this.metricaSeleccionada();
    const codBt = this.nuevoCodBt().trim();
    if (!metrica || !codBt) return;

    const actualizada = [...this.usuarios(), codBt];
    this.usuarios.set(actualizada);
    this.cambiosPorMetrica.update((mapa) => ({ ...mapa, [metrica.id]: actualizada }));
    this.nuevoCodBt.set('');
  }

  protected quitarUsuario(): void {
    const metrica = this.metricaSeleccionada();
    const codBt = this.usuarioSeleccionado();
    if (!metrica || !codBt) return;

    const actualizada = this.usuarios().filter((u) => u !== codBt);
    this.usuarios.set(actualizada);
    this.cambiosPorMetrica.update((mapa) => ({ ...mapa, [metrica.id]: actualizada }));
    this.usuarioSeleccionado.set(null);
  }

  protected refrescarUsuario(): void {
    const metrica = this.metricaSeleccionada();
    if (!metrica) return;

    const original = this.originalPorMetrica.get(metrica.id) ?? [];
    this.usuarios.set([...original]);
    this.cambiosPorMetrica.update((mapa) => {
      const { [metrica.id]: _quitado, ...resto } = mapa;
      return resto;
    });
    this.usuarioSeleccionado.set(null);
  }

  protected guardarTodo(): void {
    if (!this.huboCambios()) return;

    const cambios: EsgUsuariosPorMetrica[] = Object.entries(this.cambiosPorMetrica()).map(([id, lista]) => ({
      id,
      val: lista.join(','),
    }));

    this.guardando.set(true);
    this.esg.guardarUsuariosPorMetrica(cambios).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cambiosPorMetrica.set({});
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

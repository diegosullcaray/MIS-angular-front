import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { Subject, catchError, debounceTime, distinctUntilChanged, filter, map, of, switchMap, takeUntil } from 'rxjs';
import { DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import { DataTableCellDirective } from '../../../../../shared/ui/data-table/data-table-cell.directive';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import {
  COLUMNAS_FEN,
  FECHA_MATRIZ_FEN,
  FILTROS_FEN,
  MENSAJE_RIESGO_ALTO_FEN,
} from '../../constantes/consulta-fen.constantes';
import type { ColumnaFiltroFen, ColumnaTextoFen, FilaRiesgoFen, NivelRiesgoFen } from '../../models/consulta-fen.model';
import { ConsultaFenService } from '../../services/consulta-fen.service';
import { esRiesgoAlto } from '../../utils/consulta-fen.util';

@Component({
  selector: 'app-consulta-fen',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, InputTextModule, SelectModule, TagModule,
    DataTableComponent, DataTableCellDirective, WindowPanelComponent,
  ],
  templateUrl: './consulta-fen.component.html',
})
export class ConsultaFenComponent implements OnInit {
  protected readonly servicio = inject(ConsultaFenService);
  private readonly destruir$ = new Subject<void>();
  private readonly entradaSugerencia$ = new Subject<{ columna: ColumnaTextoFen; valor: string; revision: number }>();
  private revisionSugerencias = 0;
  protected readonly consulta = signal('');
  protected readonly sugerencias = signal<string[]>([]);
  protected readonly seleccion = signal<FilaRiesgoFen | null>(null);
  protected readonly filtro = signal<ColumnaFiltroFen>(3);

  protected readonly columnas = COLUMNAS_FEN;
  protected readonly filtros = FILTROS_FEN;
  protected readonly fechaMatriz = FECHA_MATRIZ_FEN;
  protected readonly mensajeRiesgoAlto = MENSAJE_RIESGO_ALTO_FEN;
  /** Conserva el comportamiento legado: una única coincidencia queda seleccionada automáticamente. */
  protected readonly resultado = computed(() => this.seleccion() ?? (this.servicio.filas().length === 1 ? this.servicio.filas()[0] : null));
  protected readonly alertaRiesgo = computed(() => {
    const fila = this.resultado();
    return !!fila && esRiesgoAlto(fila.exp_pre);
  });
  protected readonly hayRiesgoAlto = computed(() => {
    const fila = this.resultado();
    return !!fila && [fila.exp_mas, fila.exp_inu, fila.exp_seq, fila.exp_pre].some(esRiesgoAlto);
  });
  protected readonly mascota = computed(() =>
    this.hayRiesgoAlto()
      ? '/assets/images/fc/tours/mascota-sorpresa.png'
      : '/assets/images/fc/tours/mascota-feliz.png'
  );
  protected readonly mensajeMascota = computed(() => {
    if (!this.resultado()) return 'Haz una consulta y selecciona un ubigeo para revisar su exposición.';
    return this.hayRiesgoAlto()
      ? '¡Atención! Encontré uno o más niveles altos de exposición.'
      : 'No encontré niveles altos de exposición en este ubigeo.';
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destruir$.next();
      this.destruir$.complete();
      this.servicio.limpiar();
    });

    this.entradaSugerencia$.pipe(
      debounceTime(300),
      distinctUntilChanged((a, b) => a.columna === b.columna && a.valor === b.valor),
      filter(({ valor }) => valor.length >= 2),
      switchMap(({ columna, valor, revision }) => this.servicio.sugerir(columna, valor).pipe(
        map((sugerencias) => ({ columna, revision, sugerencias })),
        catchError(() => of({ columna, revision, sugerencias: [] })),
      )),
      takeUntil(this.destruir$),
    ).subscribe(({ columna, revision, sugerencias }) => {
      if (columna === this.filtro() && revision === this.revisionSugerencias) this.sugerencias.set(sugerencias);
    });
  }

  ngOnInit(): void {
    // Igual que la pantalla STG: al entrar muestra la matriz completa por distrito.
    this.ejecutarConsulta(3, '');
  }

  protected cambiarFiltro(columna: ColumnaFiltroFen): void {
    this.revisionSugerencias++;
    this.filtro.set(columna);
    this.consulta.set('');
    this.sugerencias.set([]);
    this.seleccion.set(null);
  }

  protected actualizarConsulta(valor: string): void {
    this.consulta.set(valor);
    const columna = this.filtro();
    if (columna === 0) {
      this.sugerencias.set([]);
      return;
    }
    this.entradaSugerencia$.next({ columna, valor: valor.trim(), revision: ++this.revisionSugerencias });
  }

  protected buscar(): void {
    const columna = this.filtro();
    const valor = this.consulta().trim();
    if (columna === 0 && !/^\d{6}$/.test(valor)) {
      this.seleccion.set(null);
      this.servicio.mostrarErrorValidacion('Ingresa un código ubigeo válido de 6 dígitos.');
      return;
    }
    if (columna !== 0 && valor.length < 2) {
      this.seleccion.set(null);
      this.servicio.mostrarErrorValidacion(`Ingresa al menos 2 caracteres para buscar por ${this.etiquetaFiltro().toLowerCase()}.`);
      return;
    }
    this.ejecutarConsulta(columna, valor);
  }

  protected elegirSugerencia(valor: string): void {
    this.consulta.set(valor);
    this.sugerencias.set([]);
    this.buscar();
  }

  protected seleccionar(fila: FilaRiesgoFen): void {
    this.seleccion.set(fila);
  }

  protected reintentar(): void {
    this.buscar();
  }

  protected indicadores(fila: FilaRiesgoFen): readonly { etiqueta: string; valor: NivelRiesgoFen }[] {
    return [
      { etiqueta: 'Huayco', valor: fila.exp_mas },
      { etiqueta: 'Inundación', valor: fila.exp_inu },
      { etiqueta: 'Sequía', valor: fila.exp_seq },
      { etiqueta: 'Riesgo predominante', valor: fila.exp_pre },
    ];
  }

  protected colorRiesgo(nivel: NivelRiesgoFen): string {
    if (nivel === 'Muy Alto') return 'var(--mis-danger)';
    if (nivel === 'Alto') return 'var(--mis-warning)';
    if (nivel === 'Medio') return 'var(--mis-warning)';
    return 'var(--mis-success)';
  }

  protected etiquetaFiltro(): string {
    return this.filtros.find((filtro) => filtro.value === this.filtro())?.label ?? 'Ubicación';
  }

  protected esUbigeo(): boolean {
    return this.filtro() === 0;
  }

  private ejecutarConsulta(columna: ColumnaFiltroFen, valor: string): void {
    this.revisionSugerencias++;
    this.seleccion.set(null);
    this.sugerencias.set([]);
    this.servicio.consultar(columna, valor);
  }

  protected severidad(nivel: NivelRiesgoFen): 'danger' | 'warn' | 'info' | 'success' | 'secondary' {
    if (nivel === 'Muy Alto') return 'danger';
    if (nivel === 'Alto') return 'warn';
    if (nivel === 'Medio') return 'info';
    if (nivel === 'Bajo') return 'success';
    return 'secondary';
  }
}

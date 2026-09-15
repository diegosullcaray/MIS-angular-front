import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { DataTableComponent } from '../../../../../shared/ui/data-table/data-table.component';
import { DataTableCellDirective } from '../../../../../shared/ui/data-table/data-table-cell.directive';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import {
  COLUMNAS_FEN,
  FECHA_MATRIZ_FEN,
  MENSAJE_RIESGO_ALTO_FEN,
} from '../../constantes/consulta-fen.constantes';
import type { FilaRiesgoFen, NivelRiesgoFen } from '../../models/consulta-fen.model';
import { ConsultaFenService } from '../../services/consulta-fen.service';
import { MapaCalorFenComponent } from '../../ui/mapa-calor-fen/mapa-calor-fen.component';
import { esRiesgoAlto, puntosCalorFen } from '../../utils/consulta-fen.util';

@Component({
  selector: 'app-consulta-fen',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, InputTextModule, TabsModule, TagModule,
    DataTableComponent, DataTableCellDirective, EmptyStateComponent, InlineErrorComponent,
    ListSkeletonComponent, MapaCalorFenComponent, WindowPanelComponent,
  ],
  templateUrl: './consulta-fen.component.html',
})
export class ConsultaFenComponent {
  protected readonly servicio = inject(ConsultaFenService);
  protected readonly distrito = signal('');
  protected readonly ubigeo = signal('');
  protected readonly seleccion = signal<FilaRiesgoFen | null>(null);

  protected readonly columnas = COLUMNAS_FEN;
  protected readonly fechaMatriz = FECHA_MATRIZ_FEN;
  protected readonly mensajeRiesgoAlto = MENSAJE_RIESGO_ALTO_FEN;
  /** Conserva el comportamiento legado: una única coincidencia queda seleccionada automáticamente. */
  protected readonly resultado = computed(() => this.seleccion() ?? (this.servicio.filas().length === 1 ? this.servicio.filas()[0] : null));
  protected readonly puntosMapa = computed(() => puntosCalorFen(this.servicio.filas()));
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

  protected buscarDistrito(): void {
    const valor = this.distrito().trim();
    if (valor.length < 2) {
      this.seleccion.set(null);
      this.servicio.mostrarErrorValidacion('Ingresa al menos 2 caracteres para buscar un distrito.');
      return;
    }
    this.seleccion.set(null);
    this.servicio.consultar(3, valor);
  }

  protected buscarUbigeo(): void {
    const valor = this.ubigeo().trim();
    if (!/^\d{6}$/.test(valor)) {
      this.seleccion.set(null);
      this.servicio.mostrarErrorValidacion('Ingresa un código ubigeo válido de 6 dígitos.');
      return;
    }
    this.seleccion.set(null);
    this.servicio.consultar(0, valor);
  }

  protected seleccionar(fila: FilaRiesgoFen): void {
    this.seleccion.set(fila);
  }

  protected severidad(nivel: NivelRiesgoFen): 'danger' | 'warn' | 'info' | 'success' | 'secondary' {
    if (nivel === 'Muy Alto') return 'danger';
    if (nivel === 'Alto') return 'warn';
    if (nivel === 'Medio') return 'info';
    if (nivel === 'Bajo') return 'success';
    return 'secondary';
  }
}

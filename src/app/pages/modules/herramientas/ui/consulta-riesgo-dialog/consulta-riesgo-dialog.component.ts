import { Component, DestroyRef, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseNegativaService } from '../../services/base-negativa.service';
import type { BaseNegativaBusquedaFila } from '../../models/base-negativa.model';

/**
 * Diálogo de búsqueda de "Consulta Base Negativa" — busca en el servidor con
 * debounce de 500ms, igual que `buscador.component.ts` del legado (STG,
 * `docs/07-modulos/basenegativa/buscador/`), en vez de filtrar en el cliente
 * como el buscador de colaboradores de Kaypacha (esa lista sí carga completa).
 */
@Component({
  selector: 'app-consulta-riesgo-dialog',
  standalone: true,
  imports: [DialogModule, TableModule, ButtonModule, InputTextModule, IconFieldModule, InputIconModule],
  templateUrl: './consulta-riesgo-dialog.component.html',
  styleUrl: './consulta-riesgo-dialog.component.css',
})
export class ConsultaRiesgoDialogComponent {
  private readonly service = inject(BaseNegativaService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() clienteSeleccionado = new EventEmitter<BaseNegativaBusquedaFila>();

  protected readonly terminoBusqueda = signal('');
  protected readonly resultados = signal<BaseNegativaBusquedaFila[]>([]);
  protected readonly cargando = signal(false);
  protected readonly itemSeleccionado = signal<BaseNegativaBusquedaFila | null>(null);

  private readonly terminoSubject = new Subject<string>();

  constructor() {
    this.terminoSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((termino) => {
          this.cargando.set(true);
          return this.service.buscar(termino);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (filas) => {
          this.resultados.set(filas);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });

    // Carga inicial (término vacío), igual que `ngAfterViewInit` del legado.
    this.terminoSubject.next('');
  }

  protected onBuscar(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.terminoBusqueda.set(valor);
    this.terminoSubject.next(valor);
  }

  protected onRowSelect(item: unknown): void {
    if (item && !Array.isArray(item)) {
      this.itemSeleccionado.set(item as BaseNegativaBusquedaFila);
    }
  }

  protected seleccionarYCerrar(): void {
    const item = this.itemSeleccionado();
    if (item) {
      this.clienteSeleccionado.emit(item);
      this.cerrar();
    }
  }

  protected cerrar(): void {
    this.visible = false;
    this.visibleChange.emit(false);
    this.itemSeleccionado.set(null);
  }
}

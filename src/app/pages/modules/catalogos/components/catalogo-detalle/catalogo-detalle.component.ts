import { Component, inject, input, OnInit, signal, effect, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogosService } from '../../services/catalogos.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { form, FormField, required, maxLength, disabled } from '@angular/forms/signals';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft, lucidePlus, lucideEdit2, lucideTrash2,
  lucideSearch, lucideCheck, lucideX, lucideAlertTriangle
} from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-catalogo-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    FormField,
    NgIconComponent,
    ListSkeletonComponent,
    EmptyStateComponent
  ],
  viewProviders: [provideIcons({
    lucideArrowLeft, lucidePlus, lucideEdit2, lucideTrash2,
    lucideSearch, lucideCheck, lucideX, lucideAlertTriangle
  })],
  template: `
    <div class="catalogo-detalle">
      <!-- Breadcrumb / Header -->
      <header class="page-header">
        <div class="header-left">
          <a routerLink="/admin/catalogos" class="back-link">
            <ng-icon name="lucideArrowLeft" size="16" />
            Volver a Catálogos
          </a>
          <h1 class="page-title">Catálogo: {{ tipoLabel() }}</h1>
          <p class="page-subtitle">Visualiza y gestiona los registros de este catálogo.</p>
        </div>

        @if (shell.esAdmin()) {
          <p-button
            label="Nuevo Registro"
            icon="pi pi-plus"
            (click)="abrirDialogoCrear()"
          />
        }
      </header>

      <!-- Table Section -->
      <div class="table-container">
        <!-- Search bar -->
        <div class="search-bar">
          <span class="p-input-icon-left w-full sm:w-80">
            <i class="pi pi-search"></i>
            <input
              pInputText
              type="text"
              placeholder="Buscar por código o descripción..."
              class="w-full"
              (input)="onSearch($event)"
            />
          </span>
        </div>

        @if (service.isLoading()) {
          <app-list-skeleton [rows]="[1,2,3,4,5]" [cols]="[1,2,3,4]" />
        } @else {
          @if (!service.hayResultados()) {
            <app-empty-state
              titulo="No se encontraron registros"
              descripcion="Prueba ajustando tu criterio de búsqueda o agrega un nuevo registro."
              [accionLabel]="shell.esAdmin() ? 'Agregar registro' : undefined"
              (accion)="abrirDialogoCrear()"
            />
          } @else {
            <p-table
              [value]="service.paginaActual()?.items ?? []"
              [paginator]="true"
              [rows]="10"
              [rowsPerPageOptions]="[5, 10, 20]"
              responsiveLayout="scroll"
              class="mis-table"
            >
              <ng-template pTemplate="header">
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                  @if (shell.esAdmin()) {
                    <th class="text-right">Acciones</th>
                  }
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-item>
                <tr>
                  <td><code class="item-code">{{ item.codigo }}</code></td>
                  <td>{{ item.descripcion }}</td>
                  <td>
                    @if (item.activo) {
                      <span class="badge badge--success">Activo</span>
                    } @else {
                      <span class="badge badge--danger">Inactivo</span>
                    }
                  </td>
                  @if (shell.esAdmin()) {
                    <td class="text-right">
                      <div class="row-actions">
                        <button class="row-btn row-btn--edit" (click)="abrirDialogoEditar(item)" title="Editar">
                          <ng-icon name="lucideEdit2" size="13" />
                        </button>
                        <button class="row-btn row-btn--danger" (click)="confirmarEliminar(item)" title="Eliminar">
                          <ng-icon name="lucideTrash2" size="13" />
                        </button>
                      </div>
                    </td>
                  }
                </tr>
              </ng-template>
            </p-table>
          }
        }
      </div>

      <!-- Add/Edit Modal (PrimeNG Dialog) -->
      <p-dialog
        [header]="editandoId() ? 'Editar Registro' : 'Nuevo Registro'"
        [(visible)]="dialogoOpen"
        [modal]="true"
        [style]="{ width: '400px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <form (submit)="guardar($event)" class="form-grid">
          <div class="form-field">
            <label for="codigo" class="form-label">Código</label>
            <input
              id="codigo"
              type="text"
              pInputText
              [formField]="itemForm.codigo"
              placeholder="Ej. BCP, USD"
              class="w-full"
            />
            @if (itemForm.codigo().invalid() && itemForm.codigo().touched()) {
              <small class="text-danger">El código es requerido (máx. 10 caracteres).</small>
            }
          </div>

          <div class="form-field">
            <label for="descripcion" class="form-label">Descripción</label>
            <input
              id="descripcion"
              type="text"
              pInputText
              [formField]="itemForm.descripcion"
              placeholder="Ej. Banco de Crédito del Perú"
              class="w-full"
            />
            @if (itemForm.descripcion().invalid() && itemForm.descripcion().touched()) {
              <small class="text-danger">La descripción es requerida.</small>
            }
          </div>

          <div class="form-field-checkbox">
            <label class="checkbox-container">
              <input type="checkbox" [formField]="itemForm.activo" />
              <span class="checkbox-label">Registro activo</span>
            </label>
          </div>

          @if (errorGuardar()) {
            <small class="text-danger">{{ errorGuardar() }}</small>
          }

          <div class="dialog-footer">
            <p-button
              label="Cancelar"
              [text]="true"
              severity="secondary"
              (click)="dialogoOpen.set(false)"
              type="button"
            />
            <p-button
              [label]="editandoId() ? 'Guardar' : 'Crear'"
              type="submit"
              [disabled]="itemForm().invalid()"
            />
          </div>
        </form>
      </p-dialog>

      <!-- Delete Confirmation Modal -->
      <p-dialog
        header="Confirmar eliminación"
        [(visible)]="confirmDeleteOpen"
        [modal]="true"
        [style]="{ width: '360px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="confirm-body">
          <div class="confirm-icon-wrap">
            <ng-icon name="lucideAlertTriangle" size="24" class="confirm-icon" />
          </div>
          <p class="confirm-text">
            ¿Estás seguro de que deseas eliminar el registro <strong>{{ itemAEliminar()?.codigo }}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div class="dialog-footer">
          <p-button
            label="Cancelar"
            [text]="true"
            severity="secondary"
            (click)="confirmDeleteOpen.set(false)"
          />
          <p-button
            label="Eliminar"
            severity="danger"
            (click)="eliminar()"
          />
        </div>
      </p-dialog>
    </div>
  `,
  styles: [`
    .catalogo-detalle {
      display: flex;
      flex-direction: column;
      gap: var(--mis-space-6);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: var(--mis-space-2);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--mis-space-1);
      color: var(--mis-text-secondary);
      text-decoration: none;
      font-size: var(--mis-text-sm);
      margin-bottom: var(--mis-space-2);
      transition: color var(--mis-transition-fast);

      &:hover { color: var(--mis-primary); }
    }

    .page-title {
      font-size: var(--mis-text-2xl);
      font-weight: var(--mis-font-bold);
      color: var(--mis-primary);
      margin: 0 0 var(--mis-space-1);
    }

    .page-subtitle {
      font-size: var(--mis-text-base);
      color: var(--mis-text-secondary);
      margin: 0;
    }

    /* Table card container */
    .table-container {
      background: var(--mis-surface);
      border: 1px solid var(--mis-border);
      border-radius: var(--mis-radius-md);
      box-shadow: var(--mis-shadow-sm);
      overflow: hidden;
      padding: var(--mis-space-4) 0 0;
    }

    .search-bar {
      padding: 0 var(--mis-space-4) var(--mis-space-4);
      border-bottom: 1px solid var(--mis-border);
    }

    .item-code {
      background: var(--mis-primary-light);
      padding: 2px var(--mis-space-2);
      border-radius: var(--mis-radius-xs);
      font-family: monospace;
      color: var(--mis-primary);
      font-weight: var(--mis-font-semibold);
    }

    .badge {
      font-size: 11px;
      font-weight: var(--mis-font-semibold);
      padding: 2px var(--mis-space-2);
      border-radius: var(--mis-radius-full);
    }

    .badge--success {
      background: var(--mis-success-light);
      color: var(--mis-success);
    }

    .badge--danger {
      background: var(--mis-danger-light);
      color: var(--mis-danger);
    }


    .row-actions {
      display: inline-flex;
      gap: var(--mis-space-1);
      justify-content: flex-end;
    }

    .row-btn {
      width: 28px;
      height: 28px;
      border-radius: var(--mis-radius-sm);
      border: none;
      background: transparent;
      color: var(--mis-text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all var(--mis-transition-fast);

      &:hover {
        background: var(--mis-primary-light);
        color: var(--mis-primary);
      }

    .row-btn--danger:hover {
      background: var(--mis-danger-light);
      color: var(--mis-danger);
    }

    }

    /* Modal Forms */
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: var(--mis-space-4);
      padding-top: var(--mis-space-2);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--mis-space-2);
    }

    .form-label {
      font-size: var(--mis-text-sm);
      font-weight: var(--mis-font-semibold);
      color: var(--mis-text-primary);
    }

    .form-field-checkbox {
      display: flex;
      align-items: center;
      padding: var(--mis-space-2) 0;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      gap: var(--mis-space-2);
      cursor: pointer;
      user-select: none;
    }

    .checkbox-label {
      font-size: var(--mis-text-sm);
      color: var(--mis-text-primary);
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--mis-space-2);
      margin-top: var(--mis-space-4);
    }

    /* Confirm Modal */
    .confirm-body {
      display: flex;
      gap: var(--mis-space-4);
      align-items: flex-start;
      padding-top: var(--mis-space-2);
    }

    .confirm-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: var(--mis-radius-full);
      background: var(--mis-danger-light);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .confirm-icon { color: var(--mis-danger); }

    .confirm-text {
      margin: 0;
      font-size: var(--mis-text-sm);
      color: var(--mis-text-secondary);
      line-height: var(--mis-leading-normal);
    }
  `],
})
export class CatalogoDetalleComponent implements OnInit {
  protected readonly service = inject(CatalogosService);
  protected readonly shell = inject(ShellStateService);

  // Input bound directly from route param :tipo
  readonly tipo = input.required<string>();

  // ─── Signal Form (TRD §6.1) ────────────────────────────────────────────
  protected readonly itemModel = signal({ codigo: '', descripcion: '', activo: true });

  protected readonly itemForm = form(this.itemModel, (schema) => {
    required(schema.codigo,      { message: 'El código es requerido.' });
    maxLength(schema.codigo, 10, { message: 'El código admite máximo 10 caracteres.' });
    required(schema.descripcion, { message: 'La descripción es requerida.' });
    // El código es la clave del registro: no se edita en modo edición
    disabled(schema.codigo, () => this.editandoId() !== null);
  });

  // Dialog signals
  protected readonly dialogoOpen = signal(false);
  protected readonly editandoId = signal<string | null>(null);
  protected readonly errorGuardar = signal<string | null>(null);

  // Delete confirmations
  protected readonly confirmDeleteOpen = signal(false);
  protected readonly itemAEliminar = signal<any | null>(null);

  constructor() {
    // Reload catalog items if 'tipo' param changes
    effect(() => {
      const currentTipo = this.tipo();
      if (currentTipo) {
        this.service.cargarItems(currentTipo);
      }
    });
  }

  ngOnInit(): void { }

  protected tipoLabel(): string {
    const labels: Record<string, string> = {
      bancos: 'Bancos',
      monedas: 'Monedas',
      departamentos: 'Departamentos',
      'tipos-doc': 'Tipos de Documento',
      estados: 'Estados de Operación'
    };
    return labels[this.tipo()] ?? this.tipo();
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.service.cargarItems(this.tipo(), 1, 20, value);
  }

  protected abrirDialogoCrear(): void {
    this.editandoId.set(null);
    this.errorGuardar.set(null);
    this.itemModel.set({ codigo: '', descripcion: '', activo: true });
    this.dialogoOpen.set(true);
  }

  protected abrirDialogoEditar(item: any): void {
    this.editandoId.set(item.id); // disabled() del schema bloquea el código
    this.errorGuardar.set(null);
    this.itemModel.set({
      codigo: item.codigo,
      descripcion: item.descripcion,
      activo: item.activo
    });
    this.dialogoOpen.set(true);
  }

  protected async guardar(event: Event): Promise<void> {
    event.preventDefault();
    if (this.itemForm().invalid()) return;

    const { codigo, descripcion, activo } = this.itemModel();
    const payload = {
      codigo: codigo.toUpperCase().trim(),
      descripcion: descripcion.trim(),
      activo
    };

    const id = this.editandoId();
    try {
      if (id) {
        await this.service.actualizarItem(this.tipo(), id, payload);
      } else {
        await this.service.crearItem(this.tipo(), payload);
      }
      this.dialogoOpen.set(false);
      this.service.cargarItems(this.tipo()); // Refresh list
    } catch (err: any) {
      // Ej. 409: código duplicado (validación de la API)
      this.errorGuardar.set(err?.error?.message ?? 'No se pudo guardar el registro.');
    }
  }

  protected confirmarEliminar(item: any): void {
    this.itemAEliminar.set(item);
    this.confirmDeleteOpen.set(true);
  }

  protected async eliminar(): Promise<void> {
    const item = this.itemAEliminar();
    if (!item) return;

    try {
      await this.service.eliminarItem(this.tipo(), item.id);
    } finally {
      this.confirmDeleteOpen.set(false);
      this.itemAEliminar.set(null);
      this.service.cargarItems(this.tipo()); // Refresh list
    }
  }
}

import { Component, output, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { form, FormField, required, minLength } from '@angular/forms/signals';

interface FilaDemo {
  id: number;
  nombre: string;
  estado: 'activo' | 'inactivo';
}

/**
 * Vista de ejemplo 2: demuestra los patrones obligatorios del MIS:
 *  - p-table dentro de p-card (doc 02 §4 del Host)
 *  - Signal Forms (`@angular/forms/signals`) — ReactiveFormsModule PROHIBIDO
 * Reemplazar por las vistas reales del dominio al usar la plantilla.
 */
@Component({
  selector: 'remote-ejemplo',
  standalone: true,
  imports: [CardModule, ButtonModule, TableModule, FormField],
  templateUrl: './ejemplo.component.html',
  styleUrl: './ejemplo.component.css',
})
export class EjemploComponent {
  readonly volver = output<void>();

  protected readonly filas = signal<FilaDemo[]>([
    { id: 1, nombre: 'Registro de ejemplo A', estado: 'activo' },
    { id: 2, nombre: 'Registro de ejemplo B', estado: 'inactivo' },
  ]);

  // ─── Signal Form (TRD §6.1 del Host) ─────────────────────────────────────

  protected readonly demoModel = signal({ nombre: '' });

  protected readonly demoForm = form(this.demoModel, (schema) => {
    required(schema.nombre, { message: 'El nombre es requerido.' });
    minLength(schema.nombre, 3, { message: 'Mínimo 3 caracteres.' });
  });

  protected agregar(event: Event): void {
    event.preventDefault();
    if (this.demoForm().invalid()) return;

    const nombre = this.demoModel().nombre.trim();
    this.filas.update(list => [
      ...list,
      { id: list.length + 1, nombre, estado: 'activo' },
    ]);
    this.demoModel.set({ nombre: '' });
  }
}

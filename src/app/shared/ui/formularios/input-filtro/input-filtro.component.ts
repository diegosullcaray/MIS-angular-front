import { Component, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

/**
 * Campo de texto de filtro, con su etiqueta encima.
 *
 * Hermano de `<app-select-filtro>`: existe para que los filtros de texto de los reportes se vean
 * y se comporten igual en todas las pantallas, en vez de que cada una arme su `<span>` + `<input>`.
 */
@Component({
  selector: 'app-input-filtro',
  standalone: true,
  imports: [FormsModule, InputTextModule],
  // `placeholder` es un atributo global de HTML: al declararlo como `input()` queda también
  // suelto en el host, y entonces el mismo texto responde desde dos elementos (el `<input>` real
  // y este envoltorio). Se borra del host para que solo lo lleve el campo.
  host: { '[attr.placeholder]': 'null' },
  template: `
    <div class="flex flex-col gap-0.5">
      <span class="text-[9.5px] font-bold text-[var(--mis-text-secondary)] uppercase tracking-wider">
        {{ etiqueta() }}
      </span>
      <input
        pInputText
        [ngModel]="valor()"
        (ngModelChange)="valor.set($event)"
        [placeholder]="placeholder()"
        [attr.aria-label]="etiqueta()"
        [class]="ancho()"
        class="text-[11.5px]"
      />
    </div>
  `,
})
export class InputFiltroComponent {
  readonly etiqueta = input.required<string>();
  readonly placeholder = input('');
  readonly ancho = input('w-44');
  readonly valor = model('');
}

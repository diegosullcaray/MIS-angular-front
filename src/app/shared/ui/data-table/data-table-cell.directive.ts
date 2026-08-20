import { Directive, TemplateRef, inject, input } from '@angular/core';

export interface DataTableCellContext<T = any> {
  $implicit: T;
}

/** Marca un `<ng-template>` proyectado dentro de `<app-data-table>` como el renderizador de celda para la columna cuyo `field` coincide — ej. `<ng-template appDataTableCell="HCUMPLDC" let-row>...</ng-template>`. */
@Directive({ selector: '[appDataTableCell]', standalone: true })
export class DataTableCellDirective<T = any> {
  readonly appDataTableCell = input.required<string>();
  readonly templateRef = inject<TemplateRef<DataTableCellContext<T>>>(TemplateRef);
}

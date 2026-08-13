import { Component, TemplateRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DataTableCellDirective } from './data-table-cell.directive';

@Component({
  standalone: true,
  imports: [DataTableCellDirective],
  template: `<ng-template appDataTableCell="nombre" let-row>{{ row.nombre }}</ng-template>`,
})
class HostComponent {
  readonly directiva = viewChild.required(DataTableCellDirective);
}

describe('DataTableCellDirective', () => {
  it('expone el field configurado y una TemplateRef del <ng-template> que lo declara', () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const directiva = fixture.componentInstance.directiva();

    expect(directiva.appDataTableCell()).toBe('nombre');
    expect(directiva.templateRef).toBeInstanceOf(TemplateRef);
  });
});

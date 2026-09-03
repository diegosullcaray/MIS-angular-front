import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { SelectFiltroComponent } from './select-filtro.component';
import type { OpcionFiltro } from '../opcion-filtro.model';

@Component({
  standalone: true,
  imports: [SelectFiltroComponent],
  template: `
    <app-select-filtro
      [etiqueta]="etiqueta"
      [opciones]="opciones"
      [ancho]="ancho"
      [(valor)]="valor"
    />
  `,
})
class HostComponent {
  etiqueta = 'Moneda';
  opciones: OpcionFiltro<string>[] = [
    { id: 'PEN', desc: 'Soles' },
    { id: 'USD', desc: 'Dólares' },
  ];
  ancho = 'w-48';
  valor = signal('PEN');
}

describe('SelectFiltroComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, SelectFiltroComponent],
    }).compileComponents();
  });

  it('se crea y renderiza la etiqueta correctamente', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent).toContain('Moneda');
  });

  it('enlaza el valor del modelo', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const selectComponent = fixture.debugElement.children[0].componentInstance as SelectFiltroComponent<string>;
    expect(selectComponent.valor()).toBe('PEN');
  });
});

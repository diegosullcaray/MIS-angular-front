import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TableModule } from 'primeng/table';
import { MAX_FILAS_VISIBLES, MaxFilasDirective } from './max-filas.directive';

const ALTO_ENCABEZADO = 30;
const ALTO_FILA = 25;

@Component({
  standalone: true,
  imports: [TableModule, MaxFilasDirective],
  template: `
    <p-table appMaxFilas [value]="filas()" [scrollable]="true">
      <ng-template pTemplate="header"><tr><th>N</th></tr></ng-template>
      <ng-template pTemplate="body" let-fila><tr><td>{{ fila }}</td></tr></ng-template>
    </p-table>
  `,
})
class AnfitrionComponent {
  readonly filas = signal<number[]>([]);
}

/** jsdom no calcula layout: cada fila `i` "mide" ALTO_FILA y arranca bajo el encabezado. */
function simularLayout(contenedor: HTMLElement): void {
  contenedor.getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
  contenedor.querySelectorAll<HTMLElement>('tbody > tr').forEach((fila, i) => {
    fila.getBoundingClientRect = () => ({ bottom: ALTO_ENCABEZADO + (i + 1) * ALTO_FILA }) as DOMRect;
  });
}

describe('MaxFilasDirective', () => {
  function crear(cantidad: number) {
    const fixture = TestBed.createComponent(AnfitrionComponent);
    fixture.componentInstance.filas.set(Array.from({ length: cantidad }, (_, i) => i));
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const contenedor = el.querySelector<HTMLElement>('.p-datatable-table-container')!;
    simularLayout(contenedor);
    const directiva = fixture.debugElement.children[0].injector.get(MaxFilasDirective);
    directiva.ajustar();
    return { contenedor, el };
  }

  it('con más de 18 filas limita el alto al pie de la fila 18 y saca scroll interno', () => {
    const { contenedor } = crear(40);
    expect(contenedor.style.maxHeight).toBe(`${ALTO_ENCABEZADO + MAX_FILAS_VISIBLES * ALTO_FILA}px`);
    expect(contenedor.style.overflowY).toBe('auto');
  });

  it('con 18 filas o menos deja la tabla con su alto natural', () => {
    const { contenedor } = crear(MAX_FILAS_VISIBLES);
    expect(contenedor.style.maxHeight).toBe('');
  });

  it('marca la tabla para fijar el encabezado al hacer scroll', () => {
    expect(crear(5).el.querySelector('p-table')?.classList).toContain('mis-max-filas');
  });
});

import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TableModule } from 'primeng/table';
import {
  ALTO_MINIMO_FONDO_PX,
  FRACCION_MAX_ALTO_VENTANA,
  MAX_FILAS_VISIBLES,
  MaxFilasDirective,
  RESERVA_PIE_PX,
} from './max-filas.directive';

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
    return { contenedor, el, directiva };
  }

  it('con más de 16 filas limita el alto al pie de la fila 16 y saca scroll interno', () => {
    const { contenedor } = crear(40);
    expect(contenedor.style.maxHeight).toBe(`${ALTO_ENCABEZADO + MAX_FILAS_VISIBLES * ALTO_FILA}px`);
    expect(contenedor.style.overflowY).toBe('auto');
  });

  it('con 16 filas o menos deja la tabla con su alto natural', () => {
    const { contenedor } = crear(MAX_FILAS_VISIBLES);
    expect(contenedor.style.maxHeight).toBe('');
  });

  it('marca la tabla para fijar el encabezado al hacer scroll', () => {
    expect(crear(5).el.querySelector('p-table')?.classList).toContain('mis-max-filas');
  });

  it('nunca pasa del tope de alto de la ventana, aunque haya menos de 16 filas', () => {
    const { contenedor, directiva } = crear(5);
    const tope = Math.round(window.innerHeight * FRACCION_MAX_ALTO_VENTANA);
    Object.defineProperty(contenedor, 'scrollHeight', { configurable: true, value: tope + 200 });
    directiva.ajustar();
    expect(contenedor.style.maxHeight).toBe(`${tope}px`);
  });
});


@Component({
  standalone: true,
  imports: [TableModule, MaxFilasDirective],
  template: `
    <p-table appMaxFilas [hastaElFondo]="true" [value]="filas()" [scrollable]="true">
      <ng-template pTemplate="header"><tr><th>N</th></tr></ng-template>
      <ng-template pTemplate="body" let-fila><tr><td>{{ fila }}</td></tr></ng-template>
    </p-table>
  `,
})
class AnfitrionFondoComponent {
  readonly filas = signal<number[]>([]);
}

describe('MaxFilasDirective con hastaElFondo', () => {
  function ajustarCon(arriba: number, altoVentana: number): HTMLElement {
    const fixture = TestBed.createComponent(AnfitrionFondoComponent);
    fixture.componentInstance.filas.set(Array.from({ length: 40 }, (_, i) => i));
    fixture.detectChanges();
    const contenedor = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.p-datatable-table-container')!;
    contenedor.getBoundingClientRect = () => ({ top: arriba }) as DOMRect;
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(altoVentana);
    fixture.debugElement.children[0].injector.get(MaxFilasDirective).ajustar();
    return contenedor;
  }

  afterEach(() => vi.restoreAllMocks());

  it('ignora el tope de 16 filas y crece hasta el pie de la ventana, menos la reserva del panel', () => {
    const contenedor = ajustarCon(200, 900);
    expect(contenedor.style.maxHeight).toBe(`${900 - 200 - RESERVA_PIE_PX}px`);
    expect(contenedor.style.overflowY).toBe('auto');
  });

  it('en una ventana muy baja no baja del alto mínimo', () => {
    expect(ajustarCon(500, 600).style.maxHeight).toBe(`${ALTO_MINIMO_FONDO_PX}px`);
  });
});

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DataTableComponent } from './data-table.component';
import { DataTableCellDirective } from './data-table-cell.directive';
import type { DataTableColumn } from './data-table.model';

interface Fila {
  codigo: string;
  nombre: string;
  [key: string]: unknown;
}

const COLUMNAS: DataTableColumn[] = [
  { field: 'codigo', header: 'Código', align: 'center' },
  { field: 'nombre', header: 'Nombre' },
];

function filas(): Fila[] {
  return [
    { codigo: 'A1', nombre: 'Ana Torres' },
    { codigo: 'B2', nombre: 'Beto Ruiz' },
  ];
}

@Component({
  standalone: true,
  imports: [DataTableComponent, DataTableCellDirective],
  template: `
    <app-data-table [columns]="columnas" [data]="data" [searchFields]="searchFields" emptyMessage="Sin registros">
      <ng-template appDataTableCell="nombre" let-row>
        <span class="celda-nombre">{{ row.nombre }}</span>
      </ng-template>
    </app-data-table>
  `,
})
class HostComponent {
  columnas = COLUMNAS;
  data = filas();
  searchFields: string[] = [];
}

const COLUMNAS_CON_FILTRO: DataTableColumn[] = [
  { field: 'codigo', header: 'Código', align: 'center', filterType: 'text' },
  { field: 'nombre', header: 'Nombre' },
];

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `<app-data-table [columns]="columnas" [data]="data" />`,
})
class HostConFiltroComponent {
  columnas = COLUMNAS_CON_FILTRO;
  data = filas();
}

describe('DataTableComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  function crear() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza un <th> por columna con su header', () => {
    const fixture = crear();
    const headers = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('th')).map((th) => th.textContent?.trim());

    expect(headers).toEqual(['Código', 'Nombre']);
  });

  it('usa la plantilla proyectada para la columna que la define', () => {
    const fixture = crear();

    const celdas = (fixture.nativeElement as HTMLElement).querySelectorAll('.celda-nombre');
    expect(celdas.length).toBe(2);
    expect(celdas[0].textContent?.trim()).toBe('Ana Torres');
  });

  it('sin plantilla, muestra el valor crudo del campo', () => {
    const fixture = crear();

    const filasEl = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(filasEl[0].querySelector('td')?.textContent?.trim()).toBe('A1');
  });

  it('sin searchFields, no muestra el buscador del caption', () => {
    const fixture = crear();

    expect((fixture.nativeElement as HTMLElement).querySelector('input[pInputText]')).toBeNull();
  });

  it('con searchFields, filtra solo al hacer clic en "Buscar" (no en cada tecla)', () => {
    const fixture = crear();
    fixture.componentInstance.searchFields = ['nombre'];
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('input[pInputText]') as HTMLInputElement;
    input.value = 'beto';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(el.querySelectorAll('tbody tr').length).toBe(2); // todavía no filtró

    const boton = Array.from(el.querySelectorAll('button')).find((b) => b.querySelector('.pi-search'))!;
    boton.click();
    fixture.detectChanges();

    expect(el.querySelectorAll('tbody tr').length).toBe(1);
    expect(el.querySelector('.celda-nombre')?.textContent?.trim()).toBe('Beto Ruiz');
  });

  it('muestra emptyMessage cuando no hay filas', () => {
    const fixture = crear();
    fixture.componentInstance.data = [];
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Sin registros');
  });

  it('sin columnas con filterType, no muestra el botón "Filtrar"', () => {
    const fixture = crear();

    expect((fixture.nativeElement as HTMLElement).querySelector('.pi-filter')).toBeNull();
  });

  it('cada <th> ordenable tiene el atributo de pSortableColumn de PrimeNG', () => {
    const fixture = crear();

    const ths = (fixture.nativeElement as HTMLElement).querySelectorAll('thead th');
    ths.forEach((th) => expect(th.getAttribute('tabindex')).toBe('0')); // pSortableColumn agrega tabindex al <th>
  });

  it('sin showRefreshButton, no muestra el botón "Actualizar"', () => {
    const fixture = crear();

    expect((fixture.nativeElement as HTMLElement).querySelector('.pi-refresh')).toBeNull();
  });

  it('sin mobileVisible: false en ninguna columna, ningún <th>/<td> tiene la clase que las oculta en mobile', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.mis-col-hide-mobile').length).toBe(0);
  });

  it('una columna sin `width` propio igual recibe un ancho fijo en el <th> — table-layout: fixed solo lee el width del header, no min-width, para calcular el ancho de toda la columna', () => {
    const fixture = crear();
    const ths = (fixture.nativeElement as HTMLElement).querySelectorAll('thead tr:first-child th');

    ths.forEach((th) => expect((th as HTMLElement).style.width).toBeTruthy());
  });
});

const COLUMNAS_MOBILE: DataTableColumn[] = [
  { field: 'codigo', header: 'Código', mobileVisible: false },
  { field: 'nombre', header: 'Nombre' },
];

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `<app-data-table [columns]="columnas" [data]="data" />`,
})
class HostConColumnaMobileComponent {
  columnas = COLUMNAS_MOBILE;
  data = filas();
}

describe('DataTableComponent — mobileVisible', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostConColumnaMobileComponent] });
  });

  it('marca con la clase de ocultar-en-mobile solo el <th>/<td> de la columna con mobileVisible: false', () => {
    const fixture = TestBed.createComponent(HostConColumnaMobileComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const thsOcultos = el.querySelectorAll('thead tr:first-child .mis-col-hide-mobile');
    expect(thsOcultos.length).toBe(1);
    expect(thsOcultos[0].textContent).toContain('Código');

    const tdsOcultos = el.querySelectorAll('tbody .mis-col-hide-mobile');
    expect(tdsOcultos.length).toBe(2); // una por fila (2 filas de datos)
  });
});

describe('DataTableComponent — fila de filtros por columna', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostConFiltroComponent] });
  });

  function crear() {
    const fixture = TestBed.createComponent(HostConFiltroComponent);
    fixture.detectChanges();
    return fixture;
  }

  function botonConIcono(el: HTMLElement, iconoClase: string): HTMLButtonElement {
    return Array.from(el.querySelectorAll('button')).find((b) => b.querySelector(`.${iconoClase}`)) as HTMLButtonElement;
  }

  it('con una columna filtrable, muestra el botón "Filtrar" (solo ícono) pero la fila de filtros arranca oculta', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    expect(botonConIcono(el, 'pi-filter')).toBeTruthy();
    expect(el.querySelector('thead tr:nth-child(2) input')).toBeFalsy();
  });

  it('"Filtrar" muestra la fila de filtros; el filtro de texto narrows las filas al escribir', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    botonConIcono(el, 'pi-filter').click();
    fixture.detectChanges();

    const filtroInput = el.querySelector('thead tr:nth-child(2) input') as HTMLInputElement;
    expect(filtroInput).toBeTruthy();

    filtroInput.value = 'B2';
    filtroInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(el.querySelectorAll('tbody tr').length).toBe(1);
  });

  it('"Limpiar filtros" solo aparece con un filtro activo, y lo vacía al hacer clic', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    botonConIcono(el, 'pi-filter').click();
    fixture.detectChanges();
    expect(botonConIcono(el, 'pi-eraser')).toBeFalsy();

    const filtroInput = el.querySelector('thead tr:nth-child(2) input') as HTMLInputElement;
    filtroInput.value = 'B2';
    filtroInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el.querySelectorAll('tbody tr').length).toBe(1);

    botonConIcono(el, 'pi-eraser').click();
    fixture.detectChanges();

    expect(el.querySelectorAll('tbody tr').length).toBe(2);
  });

  it('"Desfiltrar" oculta la fila de filtros y limpia los filtros activos', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    botonConIcono(el, 'pi-filter').click();
    fixture.detectChanges();
    const filtroInput = el.querySelector('thead tr:nth-child(2) input') as HTMLInputElement;
    filtroInput.value = 'B2';
    filtroInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(el.querySelectorAll('tbody tr').length).toBe(1);

    botonConIcono(el, 'pi-filter-slash').click();
    fixture.detectChanges();

    expect(el.querySelectorAll('tbody tr').length).toBe(2);
    expect(el.querySelector('thead tr:nth-child(2) input')).toBeFalsy();
  });
});

interface FilaConFecha {
  codigo: string;
  fecha: string;
  [key: string]: unknown;
}

const COLUMNAS_FECHA: DataTableColumn[] = [
  { field: 'codigo', header: 'Código' },
  { field: 'fecha', header: 'Fecha', filterType: 'date' },
];

function filasConFecha(): FilaConFecha[] {
  return [
    { codigo: 'A1', fecha: '2026-01-01' },
    { codigo: 'B2', fecha: '2026-01-02' },
  ];
}

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `<app-data-table [columns]="columnas" [data]="data" />`,
})
class HostConFechaComponent {
  columnas = COLUMNAS_FECHA;
  data = filasConFecha();
}

describe('DataTableComponent — filtro de fecha', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostConFechaComponent] });
  });

  function crear() {
    const fixture = TestBed.createComponent(HostConFechaComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('el filtro de fecha muestra el input de p-datepicker, sin el botón de calendario', () => {
    const fixture = crear();
    const el = fixture.nativeElement as HTMLElement;

    (Array.from(el.querySelectorAll('button')).find((b) => b.querySelector('.pi-filter')) as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(el.querySelector('.p-datepicker-input')).toBeTruthy();
    expect(el.querySelector('.p-datepicker-dropdown')).toBeNull();
  });

  it('compara solo el día calendario — un `Date` local del mismo día que el string ISO de la fila matchea, sin el corrimiento de huso horario de `new Date(\'YYYY-MM-DD\')`', () => {
    const fixture = crear();
    const tabla = fixture.debugElement.query(By.directive(DataTableComponent)).componentInstance as DataTableComponent;

    // Igual que emite p-datepicker al elegir un día: un `Date` construido en hora LOCAL.
    const seleccionado = new Date(2026, 0, 1);
    tabla['aplicarFiltroColumna']('fecha', seleccionado);
    fixture.detectChanges();

    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas.length).toBe(1);
    expect(filas[0].textContent).toContain('A1');
  });

  it('un día distinto no matchea', () => {
    const fixture = crear();
    const tabla = fixture.debugElement.query(By.directive(DataTableComponent)).componentInstance as DataTableComponent;

    tabla['aplicarFiltroColumna']('fecha', new Date(2026, 0, 3));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(0);
  });
});

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `<app-data-table [columns]="columnas" [data]="data" [showRefreshButton]="true" (refrescar)="actualizado = actualizado + 1" />`,
})
class HostConRefrescarComponent {
  columnas = COLUMNAS;
  data = filas();
  actualizado = 0;
}

describe('DataTableComponent — botón Actualizar', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostConRefrescarComponent] });
  });

  it('con showRefreshButton, muestra el botón y emite refrescar al hacer clic', () => {
    const fixture = TestBed.createComponent(HostConRefrescarComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const boton = Array.from(el.querySelectorAll('button')).find((b) => b.querySelector('.pi-refresh')) as HTMLButtonElement;
    expect(boton).toBeTruthy();

    boton.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.actualizado).toBe(1);
  });
});

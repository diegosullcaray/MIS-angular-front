import { TestBed } from '@angular/core/testing';
import type { Type } from '@angular/core';
import { COLUMNAS_ESQUELETO, FILAS_ESQUELETO, columnasEsqueleto } from './esqueleto-tabla';
import { TablaReporteComponent } from './tabla-reporte/tabla-reporte.component';
import { TablaDinamicaComponent } from './tabla-dinamica/tabla-dinamica.component';
import { EditableTableComponent } from './editable-table/editable-table.component';
import { DataTableComponent } from '../data-table/data-table.component';

describe('columnasEsqueleto', () => {
  it('usa las columnas de la tabla, o las de relleno si todavía no llegaron', () => {
    expect(columnasEsqueleto(['a', 'b'])).toEqual(['a', 'b']);
    expect(columnasEsqueleto([])).toBe(COLUMNAS_ESQUELETO);
  });
});

/**
 * Regla del estándar de reportes: mientras carga, toda tabla compartida pinta su esqueleto dentro de
 * su tarjeta —también al recargar con filas previas, que no deben quedar a la vista— y al terminar
 * vuelve a sus filas.
 */
describe.each<[string, Type<unknown>, string, Record<string, unknown>]>([
  [
    'app-tabla-reporte',
    TablaReporteComponent,
    'cargando',
    {
      encabezados: [{ columns: [{ columnDef: 'n', header: 'N', isdata: 1 }] }],
      filas: [{ n: 'fila vieja' }],
    },
  ],
  ['app-tabla-dinamica', TablaDinamicaComponent, 'cargando', { columnas: [{ key: 'n', label: 'N' }], filas: [{ n: 'fila vieja' }] }],
  ['app-editable-table', EditableTableComponent, 'cargando', { columnas: [{ key: 'n', label: 'N' }], filas: [{ n: 'fila vieja' }] }],
  ['app-data-table', DataTableComponent, 'loading', { columns: [{ field: 'n', header: 'N' }], data: [{ n: 'fila vieja' }] }],
])('%s: esqueleto mientras carga', (_nombre, componente, entrada, datos) => {
  function crear(cargando: boolean) {
    const fixture = TestBed.createComponent(componente);
    for (const [clave, valor] of Object.entries(datos)) fixture.componentRef.setInput(clave, valor);
    fixture.componentRef.setInput(entrada, cargando);
    fixture.detectChanges();
    return fixture;
  }

  const esqueletos = (el: HTMLElement) => el.querySelectorAll('tbody tr.fila-esqueleto').length;

  it('cargando con filas previas: esqueleto en vez de las filas viejas', () => {
    const el = crear(true).nativeElement as HTMLElement;
    expect(esqueletos(el)).toBe(FILAS_ESQUELETO.length);
    expect(el.textContent).not.toContain('fila vieja');
  });

  it('al terminar de cargar vuelven las filas y se va el esqueleto', () => {
    const fixture = crear(true);
    fixture.componentRef.setInput(entrada, false);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(esqueletos(el)).toBe(0);
    expect(el.textContent).toContain('fila vieja');
  });
});

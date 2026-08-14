import { TestBed } from '@angular/core/testing';
import { TablaReporteComponent } from './tabla-reporte.component';
import type { FilaEncabezadoReporte, FilaReporte } from '../../models/tabla-reporte.model';

const ENCABEZADOS: FilaEncabezadoReporte[] = [
  {
    columns: [
      { columnDef: 'nom', header: 'Nombre', isdata: 1 },
      { columnDef: 'monto', header: 'Monto', isdata: 2, format: { type: 'number' } },
      { columnDef: 'avance', header: 'Avance', isdata: 3, format: { type: 'percent' } },
      { columnDef: 'estado', header: 'Estado', isdata: 4, format: { type: 'traffic-light' } },
    ],
  },
];

const FILAS: FilaReporte[] = [{ nom: 'Agencia 1', monto: 1500.5, avance: 0.85, estado: 1 }];

describe('TablaReporteComponent', () => {
  function crear(encabezados: FilaEncabezadoReporte[] = ENCABEZADOS, filas: FilaReporte[] = FILAS, cargando = false) {
    TestBed.configureTestingModule({ imports: [TablaReporteComponent] });
    const fixture = TestBed.createComponent(TablaReporteComponent);
    fixture.componentRef.setInput('encabezados', encabezados);
    fixture.componentRef.setInput('filas', filas);
    fixture.componentRef.setInput('cargando', cargando);
    fixture.detectChanges();
    return fixture;
  }

  it('columnasDato() extrae solo las columnas con isdata, ordenadas', () => {
    const fixture = crear([
      {
        columns: [
          { columnDef: 'b', header: 'B', isdata: 2 },
          { columnDef: 'grupo', header: 'Grupo' }, // celda de agrupación, sin isdata
          { columnDef: 'a', header: 'A', isdata: 1 },
        ],
      },
    ]);

    expect(fixture.componentInstance['columnasDato']().map((c) => c.columnDef)).toEqual(['a', 'b']);
  });

  it('formatear() aplica number/percent según el formato de la columna', () => {
    const fixture = crear();
    const columnaNumero = ENCABEZADOS[0].columns[1];
    const columnaPorcentaje = ENCABEZADOS[0].columns[2];

    expect(fixture.componentInstance['formatear'](1500.5, columnaNumero)).toBe('1,500.5');
    expect(fixture.componentInstance['formatear'](0.85, columnaPorcentaje)).toBe('85.0%');
  });

  it('formatear() devuelve cadena vacía para valores nulos/indefinidos', () => {
    const fixture = crear();
    expect(fixture.componentInstance['formatear'](null, ENCABEZADOS[0].columns[0])).toBe('');
    expect(fixture.componentInstance['formatear'](undefined, ENCABEZADOS[0].columns[0])).toBe('');
  });

  it('esSemaforo() distingue columnas traffic-light de las demás', () => {
    const fixture = crear();
    expect(fixture.componentInstance['esSemaforo'](ENCABEZADOS[0].columns[3])).toBe(true);
    expect(fixture.componentInstance['esSemaforo'](ENCABEZADOS[0].columns[0])).toBe(false);
  });

  it('colorSemaforo() mapea 1/2/otro a éxito/alerta/neutro', () => {
    const fixture = crear();
    expect(fixture.componentInstance['colorSemaforo'](1)).toContain('success');
    expect(fixture.componentInstance['colorSemaforo'](2)).toContain('warning');
    expect(fixture.componentInstance['colorSemaforo'](0)).toContain('text-tertiary');
  });

  it('la tabla renderiza el valor de cada columna de datos', () => {
    const fixture = crear();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('Agencia 1');
    expect(texto).toContain('1,500.5');
    expect(texto).toContain('85.0%');
  });

  it('filasEncabezado() excluye las columnas hidden, sin correr el resto de columnas', () => {
    // Caso real de "Monitor Metas Desembolso" (Monitor_Dese_01): "Fecha" declara
    // cols:2 para cubrir tanto la fecha como "fecha_nombre" (el día, ej. "Sábado"),
    // que va hidden porque no necesita su propio <th> — solo su dato en el cuerpo.
    const fixture = crear([
      {
        columns: [
          { columnDef: 'dia_habil', header: 'Día', rows: 2, isdata: 1 },
          { columnDef: 'Fecha', header: 'Fecha', cols: 2, rows: 2, isdata: 2 },
          { columnDef: 'fecha_nombre', header: 'fecha_nombre', isdata: 3, hidden: true },
          { columnDef: 'Diario', header: 'Diario', cols: 3 },
        ],
      },
      {
        columns: [
          { columnDef: 'ope', header: 'Operaciones', isdata: 4 },
          { columnDef: 'meta', header: 'Meta', isdata: 5 },
          { columnDef: 'cumpl', header: '%Cumplimiento', isdata: 6 },
        ],
      },
    ]);

    const filas = fixture.componentInstance['filasEncabezado']();
    expect(filas[0].map((c) => c.columnDef)).toEqual(['dia_habil', 'Fecha', 'Diario']);
    expect(filas[1].map((c) => c.columnDef)).toEqual(['ope', 'meta', 'cumpl']);
  });

  it('columnasDato() sigue incluyendo el dato de una columna hidden — solo se oculta su <th>, no su <td>', () => {
    const fixture = crear([
      {
        columns: [
          { columnDef: 'Fecha', header: 'Fecha', cols: 2, isdata: 1 },
          { columnDef: 'fecha_nombre', header: 'fecha_nombre', isdata: 2, hidden: true },
        ],
      },
    ]);

    const columnas = fixture.componentInstance['columnasDato']().map((c) => c.columnDef);
    expect(columnas).toEqual(['Fecha', 'fecha_nombre']);
  });

  it('alineacion() alinea a la derecha salvo columnas de fecha o semáforo', () => {
    const fixture = crear();
    expect(fixture.componentInstance['alineacion']({ columnDef: 'monto', header: 'Monto' })).toBe('text-right');
    expect(fixture.componentInstance['alineacion']({ columnDef: 'fecha', header: 'Fecha' })).toBe('text-left');
    expect(fixture.componentInstance['alineacion']({ columnDef: 'estado', header: 'Estado', format: { type: 'traffic-light' } })).toBe(
      'text-center',
    );
  });
});

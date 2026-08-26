import { TestBed } from '@angular/core/testing';
import { TablaDinamicaComponent } from './tabla-dinamica.component';
import type { ColumnaDinamica } from '../models/tabla-dinamica.model';

/** Forma real de "Gestión Pasivo Comercial": el grupo y sus hojas llevan el color del encabezado. */
const FONDO = { background: '#79098F' };
const COLUMNAS: ColumnaDinamica[] = [
  { key: 'descripcion', label: 'Descripción' },
  {
    key: 'pasivos-ahorros',
    label: 'Pasivos - Ahorros',
    style: FONDO,
    subs: [{ key: 'saldo_ahorro_hoy', label: 'Saldo', format: { type: 'integer' }, style: FONDO }],
  },
];

const FILAS = [{ descripcion: 'FINANCIERA CONFIANZA', saldo_ahorro_hoy: 1234 }];

describe('TablaDinamicaComponent', () => {
  function crear(columnas = COLUMNAS, filas: Record<string, unknown>[] = FILAS) {
    TestBed.configureTestingModule({ imports: [TablaDinamicaComponent] });
    const fixture = TestBed.createComponent(TablaDinamicaComponent);
    fixture.componentRef.setInput('columnas', columnas);
    fixture.componentRef.setInput('filas', filas);
    fixture.detectChanges();
    return fixture;
  }

  it('el color del grupo pinta el encabezado', () => {
    const fixture = crear();
    const encabezados = fixture.nativeElement.querySelectorAll('th') as NodeListOf<HTMLElement>;
    const coloreados = [...encabezados].filter((th) => th.style.backgroundColor !== '');

    expect(coloreados.length).toBeGreaterThan(0);
  });

  it('el color del grupo NO se derrama sobre las celdas del cuerpo', () => {
    const fixture = crear();
    const celdas = fixture.nativeElement.querySelectorAll('tbody td') as NodeListOf<HTMLElement>;

    expect(celdas.length).toBeGreaterThan(0);
    for (const celda of celdas) {
      expect(celda.style.background).toBe('');
      expect(celda.style.backgroundColor).toBe('');
    }
  });

  it('los encabezados llevan borde para separar visualmente los grupos', () => {
    const fixture = crear();
    const th = fixture.nativeElement.querySelector('th') as HTMLElement;

    expect(th.className).toContain('border');
  });


  describe('estilos que manda el backend', () => {
    /** Forma real de `RS_DESEMB_01`: `style` lleva anchos para el `<th>` y `cellStyle` la alineación del `<td>`. */
    const CON_CELLSTYLE: ColumnaDinamica[] = [
      { key: 'RangoDesembolso', label: 'Rango Desembolso', cellStyle: { 'text-align': 'left' } },
      {
        key: 'ope',
        label: 'Número de Operaciones',
        subs: [
          { key: '1_Ope', label: '30-jun.', cellStyle: { 'text-align': 'right' }, style: { width: '70px' } },
        ],
      },
    ];

    it('`cellStyle` se aplica a la celda del cuerpo — sin él las columnas sin `format` quedan a la izquierda', () => {
      TestBed.configureTestingModule({ imports: [TablaDinamicaComponent] });
      const fixture = TestBed.createComponent(TablaDinamicaComponent);
      fixture.componentRef.setInput('columnas', CON_CELLSTYLE);
      fixture.componentRef.setInput('filas', [{ RangoDesembolso: '%Desembolsos>= PEN 50M', '1_Ope': '6%' }]);
      fixture.detectChanges();

      const celdas = fixture.nativeElement.querySelectorAll('tbody td') as NodeListOf<HTMLElement>;
      expect(celdas[0].style.textAlign).toBe('left');
      expect(celdas[1].style.textAlign).toBe('right');
    });

    it('`style` sigue siendo del encabezado y no toca el cuerpo', () => {
      TestBed.configureTestingModule({ imports: [TablaDinamicaComponent] });
      const fixture = TestBed.createComponent(TablaDinamicaComponent);
      fixture.componentRef.setInput('columnas', CON_CELLSTYLE);
      fixture.componentRef.setInput('filas', [{ '1_Ope': '6%' }]);
      fixture.detectChanges();

      const celdas = fixture.nativeElement.querySelectorAll('tbody td') as NodeListOf<HTMLElement>;
      for (const celda of celdas) expect(celda.style.width).toBe('');
    });
  });
});

/**
 * Clic por celda — el equivalente del `onClickCell` de `stg-table2` del legado.
 *
 * Sale de la incidencia 1 de `docs/09-incidencias/incidencias-mora.md`: Monitor
 * IMR abría su diálogo en cualquier celda porque la tabla solo emitía la fila
 * entera, mientras que el legado hace cosas distintas según la columna.
 */
describe('TablaDinamicaComponent — clic por celda', () => {
  const COLS: ColumnaDinamica[] = [
    { key: 'desc', label: 'Descripción' },
    { key: 'sali2', label: 'Entradas' },
    { key: 'otra', label: 'Otra' },
  ];
  const FILA = { desc: 'UNIDAD 1', sali2: 10, otra: 5 };

  function crear(columnasClicables: string[] | null) {
    TestBed.configureTestingModule({ imports: [TablaDinamicaComponent] });
    const fixture = TestBed.createComponent(TablaDinamicaComponent);
    fixture.componentRef.setInput('columnas', COLS);
    fixture.componentRef.setInput('filas', [FILA]);
    fixture.componentRef.setInput('seleccionable', true);
    if (columnasClicables) fixture.componentRef.setInput('columnasClicables', columnasClicables);
    fixture.detectChanges();
    return fixture;
  }

  /** Celda del cuerpo por índice de columna. */
  function celda(fixture: ReturnType<typeof crear>, indice: number): HTMLElement {
    return (fixture.nativeElement.querySelectorAll('tbody td') as NodeListOf<HTMLElement>)[indice];
  }

  it('sin `columnasClicables` sigue emitiendo la fila entera (compatibilidad hacia atrás)', () => {
    const fixture = crear(null);
    const filas: unknown[] = [];
    fixture.componentInstance.filaSeleccionada.subscribe((f) => filas.push(f));

    celda(fixture, 2).click();

    expect(filas).toEqual([FILA]);
  });

  it('con `columnasClicables` ya NO emite la fila entera', () => {
    const fixture = crear(['desc', 'sali2']);
    const filas: unknown[] = [];
    fixture.componentInstance.filaSeleccionada.subscribe((f) => filas.push(f));

    celda(fixture, 0).click();
    celda(fixture, 1).click();

    expect(filas).toEqual([]);
  });

  it('emite `celdaSeleccionada` con la clave de la columna tocada', () => {
    const fixture = crear(['desc', 'sali2']);
    const eventos: { clave: string }[] = [];
    fixture.componentInstance.celdaSeleccionada.subscribe((e) => eventos.push(e));

    celda(fixture, 0).click();
    celda(fixture, 1).click();

    expect(eventos.map((e) => e.clave)).toEqual(['desc', 'sali2']);
    expect(eventos[0]).toEqual({ clave: 'desc', fila: FILA });
  });

  it('una columna que no está en la lista no emite nada — el bug de la incidencia 1', () => {
    const fixture = crear(['desc', 'sali2']);
    const eventos: unknown[] = [];
    fixture.componentInstance.celdaSeleccionada.subscribe((e) => eventos.push(e));

    celda(fixture, 2).click();

    expect(eventos).toEqual([]);
  });
});

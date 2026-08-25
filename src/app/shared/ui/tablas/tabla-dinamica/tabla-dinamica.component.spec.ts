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
});

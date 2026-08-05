import { TestBed } from '@angular/core/testing';
import { RankingTableComponent } from './ranking-table.component';
import type { RankingTableFila } from '../../models';

const FILAS: RankingTableFila[] = Array.from({ length: 15 }, (_, i) => ({
  posicion: i + 1,
  etiqueta: `Usuario ${i + 1}`,
  valor: 100 - i,
}));

describe('RankingTableComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RankingTableComponent] });
  });

  function crear(filas: RankingTableFila[], limite?: number) {
    const fixture = TestBed.createComponent(RankingTableComponent);
    fixture.componentRef.setInput('filas', filas);
    if (limite !== undefined) fixture.componentRef.setInput('limite', limite);
    fixture.detectChanges();
    return fixture;
  }

  it('limita a 10 filas por defecto (Top 10)', () => {
    const fixture = crear(FILAS);
    expect(fixture.componentInstance['filasVisibles']().length).toBe(10);
  });

  it('respeta un límite distinto pasado por input', () => {
    const fixture = crear(FILAS, 5);
    expect(fixture.componentInstance['filasVisibles']().length).toBe(5);
  });

  it('límite 0 muestra todas las filas (sin recorte)', () => {
    const fixture = crear(FILAS, 0);
    expect(fixture.componentInstance['filasVisibles']().length).toBe(15);
  });

  it('esPrimerPuesto() coerciona a número — funciona aunque posicion llegue como string', () => {
    const fixture = crear(FILAS);
    const instancia = fixture.componentInstance;

    expect(instancia['esPrimerPuesto']({ posicion: 1, etiqueta: 'A', valor: 10 })).toBe(true);
    expect(instancia['esPrimerPuesto']({ posicion: '1' as unknown as number, etiqueta: 'A', valor: 10 })).toBe(true);
    expect(instancia['esPrimerPuesto']({ posicion: 2, etiqueta: 'B', valor: 10 })).toBe(false);
  });

  it('formatPosicion() rellena con cero a la izquierda las posiciones de un dígito', () => {
    const fixture = crear(FILAS);
    const instancia = fixture.componentInstance;

    expect(instancia['formatPosicion'](1)).toBe('01');
    expect(instancia['formatPosicion'](9)).toBe('09');
    expect(instancia['formatPosicion'](10)).toBe('10');
    expect(instancia['formatPosicion'](23)).toBe('23');
  });

  it('formatPosicion() devuelve el valor original si no es un número válido', () => {
    const fixture = crear(FILAS);
    expect(fixture.componentInstance['formatPosicion']('N/A')).toBe('N/A');
  });

  it('en modo cargando genera tantas filas de esqueleto como el límite (tope 10)', () => {
    const fixture = crear(FILAS, 5);
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();

    expect(fixture.componentInstance['filasSkeleton']().length).toBe(5);
  });

  it('el esqueleto nunca muestra más de 10 filas aunque el límite sea mayor', () => {
    const fixture = crear(FILAS, 100);
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();

    expect(fixture.componentInstance['filasSkeleton']().length).toBe(10);
  });

  it('muestra el título en el header de la tarjeta', () => {
    const fixture = TestBed.createComponent(RankingTableComponent);
    fixture.componentRef.setInput('titulo', 'Zona Norte');
    fixture.componentRef.setInput('filas', []);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Zona Norte');
  });
});

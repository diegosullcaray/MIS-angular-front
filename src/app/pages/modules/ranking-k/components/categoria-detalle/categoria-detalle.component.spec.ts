import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CategoriaDetalleComponent } from './categoria-detalle.component';
import { KaypachaService } from '../../services/kaypacha.service';
import { RedirectOverlayService } from '../../../../../shared/services/redirect-overlay.service';
import type { DetalleRanking, FilaDetalleRanking } from '../../models';

function fila(overrides: Partial<FilaDetalleRanking> = {}): FilaDetalleRanking {
  return { ROWNUMBER: 1, HCOLNOM: 'Ana Torres', TOTAL_MES: 100, hdester: 'Norte', ...overrides };
}

describe('CategoriaDetalleComponent', () => {
  let kaypachaFalso: { buscarCategoria: ReturnType<typeof vi.fn>; cargarCategorias: ReturnType<typeof vi.fn>; obtenerDetalle: ReturnType<typeof vi.fn> };
  let redirectFalso: { redirigir: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    kaypachaFalso = {
      buscarCategoria: vi.fn().mockReturnValue(undefined),
      cargarCategorias: vi.fn(),
      obtenerDetalle: vi.fn().mockReturnValue(of({ filas: [], fechaActualizacion: null } as DetalleRanking)),
    };
    redirectFalso = { redirigir: vi.fn() };

    TestBed.configureTestingModule({
      imports: [CategoriaDetalleComponent],
      providers: [
        { provide: KaypachaService, useValue: kaypachaFalso },
        { provide: RedirectOverlayService, useValue: redirectFalso },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function crear(id: string) {
    const fixture = TestBed.createComponent(CategoriaDetalleComponent);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    return fixture;
  }

  it('carga las categorías al construirse (para poder mostrar el nombre real si se entra directo por URL)', () => {
    crear('z1');
    expect(kaypachaFalso.cargarCategorias).toHaveBeenCalled();
  });

  it('pide el detalle de la categoría del route param al iniciar', () => {
    crear('z1');
    expect(kaypachaFalso.obtenerDetalle).toHaveBeenCalledWith('z1');
  });

  it('vuelve a pedir el detalle cuando cambia el :id (navegar entre categorías reutiliza la instancia)', () => {
    const fixture = crear('z1');
    fixture.componentRef.setInput('id', 'z2');
    fixture.detectChanges();

    expect(kaypachaFalso.obtenerDetalle).toHaveBeenCalledTimes(2);
    expect(kaypachaFalso.obtenerDetalle).toHaveBeenLastCalledWith('z2');
  });

  it('dispara el overlay de redirección si el :id parece un enlace externo (imparables/jira)', () => {
    crear('Imparables');
    expect(redirectFalso.redirigir).toHaveBeenCalledWith('Imparables');
  });

  it('no dispara el overlay para un id normal', () => {
    crear('z1');
    expect(redirectFalso.redirigir).not.toHaveBeenCalled();
  });

  it('guarda las filas y la fecha de actualización tras cargar el detalle con éxito', () => {
    kaypachaFalso.obtenerDetalle.mockReturnValue(of({ filas: [fila()], fechaActualizacion: '2026-08-01' } as DetalleRanking));

    const fixture = crear('z1');

    expect(fixture.componentInstance['filas']()).toEqual([fila()]);
    expect(fixture.componentInstance['fechaActualizacion']()).toBe('2026-08-01');
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra un mensaje de error si falla la carga del detalle', () => {
    kaypachaFalso.obtenerDetalle.mockReturnValue(throwError(() => new Error('backend caído')));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const fixture = crear('z1');

    expect(fixture.componentInstance['error']()).toBe('No se pudo cargar el detalle de esta categoría.');
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('agrupa las filas por hdester y las ordena por posición dentro de cada grupo', () => {
    kaypachaFalso.obtenerDetalle.mockReturnValue(
      of({
        filas: [
          fila({ ROWNUMBER: 2, HCOLNOM: 'Beto', hdester: 'Norte' }),
          fila({ ROWNUMBER: 1, HCOLNOM: 'Ana', hdester: 'Norte' }),
          fila({ ROWNUMBER: 1, HCOLNOM: 'Carla', hdester: 'Sur' }),
        ],
        fechaActualizacion: null,
      } as DetalleRanking)
    );

    const fixture = crear('z1');
    const grupos = fixture.componentInstance['grupos']();

    expect(grupos.find((g) => g.hdester === 'Norte')?.filas.map((f) => f.etiqueta)).toEqual(['Ana', 'Beto']);
    expect(grupos.find((g) => g.hdester === 'Sur')?.filas.map((f) => f.etiqueta)).toEqual(['Carla']);
  });

  it('lugaresDisponibles(), puntosMinDisponible() y puntosMaxDisponible() derivan de las filas cargadas', () => {
    kaypachaFalso.obtenerDetalle.mockReturnValue(
      of({
        filas: [fila({ hdester: 'Norte', TOTAL_MES: 50 }), fila({ hdester: 'Sur', TOTAL_MES: 300 })],
        fechaActualizacion: null,
      } as DetalleRanking)
    );

    const fixture = crear('z1');

    expect(fixture.componentInstance['lugaresDisponibles']()).toEqual(['Norte', 'Sur']);
    expect(fixture.componentInstance['puntosMinDisponible']()).toBe(50);
    expect(fixture.componentInstance['puntosMaxDisponible']()).toBe(300);
  });

  it('sin filas, los límites de puntos caen a 0-100 (valores por defecto)', () => {
    const fixture = crear('z1');
    expect(fixture.componentInstance['puntosMinDisponible']()).toBe(0);
    expect(fixture.componentInstance['puntosMaxDisponible']()).toBe(100);
  });

  it('grupos() filtra por usuario, lugar y rango de puntos cuando hay filtros aplicados', () => {
    kaypachaFalso.obtenerDetalle.mockReturnValue(
      of({
        filas: [
          fila({ HCOLNOM: 'Ana Torres', hdester: 'Norte', TOTAL_MES: 100 }),
          fila({ HCOLNOM: 'Beto Ruiz', hdester: 'Sur', TOTAL_MES: 300 }),
        ],
        fechaActualizacion: null,
      } as DetalleRanking)
    );
    const fixture = crear('z1');

    fixture.componentInstance['onAplicarFiltros']({ usuario: 'ana', lugares: [], puntosMin: 0, puntosMax: 1000, limitePosiciones: 10 });

    const grupos = fixture.componentInstance['grupos']();
    expect(grupos.length).toBe(1);
    expect(grupos[0].hdester).toBe('Norte');
  });

  it('hayFiltrosActivos() es false sin filtros aplicados', () => {
    const fixture = crear('z1');
    expect(fixture.componentInstance['hayFiltrosActivos']()).toBe(false);
  });

  it('hayFiltrosActivos() es true si se escribió un usuario', () => {
    const fixture = crear('z1');
    fixture.componentInstance['onAplicarFiltros']({ usuario: 'ana', lugares: [], puntosMin: 0, puntosMax: 100, limitePosiciones: 10 });
    expect(fixture.componentInstance['hayFiltrosActivos']()).toBe(true);
  });

  it('hayFiltrosActivos() es true si se cambió el límite de posiciones (distinto de 10)', () => {
    const fixture = crear('z1');
    fixture.componentInstance['onAplicarFiltros']({ usuario: '', lugares: [], puntosMin: 0, puntosMax: 100, limitePosiciones: 50 });
    expect(fixture.componentInstance['hayFiltrosActivos']()).toBe(true);
  });

  it('onAplicarFiltros() activa el modo esqueleto de inmediato y lo apaga tras la transición de 350ms', () => {
    vi.useFakeTimers();
    kaypachaFalso.obtenerDetalle.mockReturnValue(of({ filas: [fila()], fechaActualizacion: null } as DetalleRanking));
    const fixture = crear('z1');

    fixture.componentInstance['onAplicarFiltros']({ usuario: '', lugares: [], puntosMin: 0, puntosMax: 1000, limitePosiciones: 10 });

    expect(fixture.componentInstance['aplicandoFiltros']()).toBe(true);
    expect(fixture.componentInstance['gruposEsqueleto']()).toBeGreaterThan(0);

    vi.advanceTimersByTime(350);
    expect(fixture.componentInstance['aplicandoFiltros']()).toBe(false);
  });

  it('arrayDe(n) devuelve un arreglo de longitud n para repetir la tarjeta-esqueleto', () => {
    const fixture = crear('z1');
    expect(fixture.componentInstance['arrayDe'](3).length).toBe(3);
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { BloqueReporteService } from './bloque-reporte.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';
import type { OpcionFiltro } from '../models/filtros.model';

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

/** El selector de periodo no devuelve una tabla: la lista viaja en `meta1[0].json_result`. */
function respuestaPeriodos(jsonResult: unknown) {
  return of({ code: '0', headers: {}, body: { resultado: { meta1: [{ json_result: jsonResult }] } } });
}

/**
 * Regresión de la tarea 5 de `incidencias-mora-actualizado.md` y de la tarea 2
 * de `incidencias-carteras-actualizado.md`: el "filtro de fecha" que faltaba en
 * "Seguros Optativos" y en "Gestión Comercial".
 *
 * No es un calendario libre. El legado (`loadFilter()`) pide `RS_FECH` o
 * `RS_FECH02` con `{ fec }` y saca la lista de cortes de `meta1[0].json_result`,
 * un JSON serializado de `{ label, val }`.
 */
describe('BloqueReporteService.periodos()', () => {
  let getRegularTableResult: ReturnType<typeof vi.fn>;
  let servicio: BloqueReporteService;

  beforeEach(() => {
    getRegularTableResult = vi.fn().mockReturnValue(respuestaPeriodos('[]'));
    TestBed.configureTestingModule({ providers: [{ provide: ModReportesService, useValue: { getRegularTableResult } }] });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(BloqueReporteService);
  });

  it('pide el bloque que le digan con el corte del usuario en `fec`', () => {
    servicio.periodos('RS_FECH').subscribe();

    expect(getRegularTableResult).toHaveBeenCalledWith('RS_FECH', { fec: '2025-11-30' });
  });

  it('traduce `{ label, val }` a las opciones del desplegable', () => {
    getRegularTableResult.mockReturnValue(
      respuestaPeriodos(JSON.stringify([
        { label: 'Noviembre 2025', val: '2025-11-30' },
        { label: 'Octubre 2025', val: '2025-10-31' },
      ])),
    );

    let opciones: OpcionFiltro[] | undefined;
    servicio.periodos('RS_FECH02').subscribe((o) => (opciones = o));

    expect(opciones).toEqual([
      { id: '2025-11-30', desc: 'Noviembre 2025' },
      { id: '2025-10-31', desc: 'Octubre 2025' },
    ]);
  });

  it('acepta `text` como etiqueta y cae al propio `val` si no viene ninguna', () => {
    getRegularTableResult.mockReturnValue(
      respuestaPeriodos(JSON.stringify([{ text: 'Nov 2025', val: '2025-11-30' }, { val: '2025-10-31' }])),
    );

    let opciones: OpcionFiltro[] | undefined;
    servicio.periodos('RS_FECH').subscribe((o) => (opciones = o));

    expect(opciones).toEqual([
      { id: '2025-11-30', desc: 'Nov 2025' },
      { id: '2025-10-31', desc: '2025-10-31' },
    ]);
  });

  it('descarta las opciones sin `val`: sin fecha no hay nada que consultar', () => {
    getRegularTableResult.mockReturnValue(
      respuestaPeriodos(JSON.stringify([{ label: 'Vacío', val: '' }, { label: 'Sin val' }, { label: 'Ok', val: '2025-11-30' }])),
    );

    let opciones: OpcionFiltro[] | undefined;
    servicio.periodos('RS_FECH').subscribe((o) => (opciones = o));

    expect(opciones).toEqual([{ id: '2025-11-30', desc: 'Ok' }]);
  });

  it('acepta `meta1` serializado, no solo el array ya parseado', () => {
    getRegularTableResult.mockReturnValue(
      of({
        code: '0',
        headers: {},
        body: { resultado: { meta1: JSON.stringify([{ json_result: JSON.stringify([{ label: 'Nov', val: '2025-11-30' }]) }]) } },
      }),
    );

    let opciones: OpcionFiltro[] | undefined;
    servicio.periodos('RS_FECH').subscribe((o) => (opciones = o));

    expect(opciones).toEqual([{ id: '2025-11-30', desc: 'Nov' }]);
  });

  /**
   * El legado hace lo mismo (`catch` → `filter1 = []`): sin lista, el reporte se
   * queda con el corte del usuario en vez de romperse.
   */
  it.each([
    ['un `json_result` que no es JSON', respuestaPeriodos('esto no es json')],
    ['un payload sin `meta1`', of({ code: '0', headers: {}, body: { resultado: { data: [] } } })],
    ['un `meta1` vacío', of({ code: '0', headers: {}, body: { resultado: { meta1: [] } } })],
  ])('devuelve lista vacía ante %s', (_caso, respuesta) => {
    getRegularTableResult.mockReturnValue(respuesta);

    let opciones: OpcionFiltro[] | undefined;
    servicio.periodos('RS_FECH').subscribe((o) => (opciones = o));

    expect(opciones).toEqual([]);
  });

  it('un error del backend tampoco tumba la pantalla', () => {
    getRegularTableResult.mockReturnValue(throwError(() => new Error('500')));

    let opciones: OpcionFiltro[] | undefined;
    servicio.periodos('RS_FECH').subscribe((o) => (opciones = o));

    expect(opciones).toEqual([]);
  });
});

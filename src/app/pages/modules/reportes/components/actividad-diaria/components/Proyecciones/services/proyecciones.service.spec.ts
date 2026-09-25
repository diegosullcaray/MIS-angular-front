import { HttpContext, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProyeccionesService } from './proyecciones.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };
const RESPUESTA = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

/**
 * `PROYEC_COLREC` tenía el mismo defecto que los cuatro reportes de
 * `incidencias-mora.md` — su host es `report-cra-v11`, que también llama
 * `cs.getRegularData()` — pero nadie lo reportó porque todavía no lo habían
 * abierto. Este spec lo fija para que no vuelva.
 */
describe('ProyeccionesService', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let getDeprecatedData: ReturnType<typeof vi.fn>;
  let servicio: ProyeccionesService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of(RESPUESTA));
    getDeprecatedData = vi.fn().mockReturnValue(of(RESPUESTA));
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData, getDeprecatedData } }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(ProyeccionesService);
  });

  it('"Proyección colocación" va por `regularData` aunque su `reportType` esté comentado (host `-v11`)', () => {
    servicio.colocacionResumen(NODO).subscribe();
    servicio.colocacionDetalle(NODO).subscribe();

    expect(getDeprecatedData).not.toHaveBeenCalled();
    expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual(['PROYEC_COLREC_01', 'PROYEC_COLREC_03']);
  });

  it('el resumen (`_01`) lleva `fec`, como declara el mapa', () => {
    servicio.colocacionResumen(NODO).subscribe();

    expect(getRegularData.mock.calls[0][1]).toEqual({ tip_cod: 9, cod_rel: 'FC', fec: '20251130' });
  });

  /**
   * Incidencia: la pestaña "Detalle" daba 500 ("Resultado vacio para: regularData"). El legado
   * (`report-cra-v11.component.ts`, `rendererSync()`) pide el `_03` paginado, con `pagen` y el nodo
   * completo de la jerarquía, sin `fec`; el Host lo pedía solo con `tip_cod`/`cod_rel`.
   */
  it('el detalle (`_03`) va paginado: `pagen` y el nodo completo, sin `fec`', () => {
    const nodo = { tip_cod: 18, cod_rel: 'U5', des_rel: 'Unidad 5', lbl_hier: 'UNIDAD', lvl_hier: 4 };
    servicio.colocacionDetalle(nodo, 3).subscribe();

    expect(getRegularData).toHaveBeenCalledWith('PROYEC_COLREC_03', { pagen: 3, ...nodo });
    expect(getRegularData.mock.calls[0][1]).not.toHaveProperty('fec');
  });

  it('una página sin filas (500 "resultado vacío") queda como tabla vacía; otro error se propaga', () => {
    getRegularData.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Resultado vacio para: regularData' })),
    );
    let tabla: unknown;
    servicio.colocacionDetalle(NODO).subscribe((t) => (tabla = t));
    expect(tabla).toEqual({ headers: [], body: [], additional: {} });

    getRegularData.mockReturnValueOnce(throwError(() => new Error('red caída')));
    const error = vi.fn();
    servicio.colocacionDetalle(NODO).subscribe({ error });
    expect(error).toHaveBeenCalled();
  });

  it('"Proyección diaria" pide `_01` y `_02`: el `_03` está comentado en el mapa', () => {
    servicio.diariaColocacion(NODO).subscribe();

    expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual([
      'PROYEC_DIACOLREC_01',
      'PROYEC_DIACOLREC_02',
    ]);
  });

  /**
   * Incidencia reportada en Proyecciones: el reporte se caía con el 500
   * (`NullPointerException: Resultado vacio para: regularData`) y no terminaba
   * de cargar dentro del timeout global de 30 s. Hoy no hay timeout global, así
   * que lo único que queda es tolerar el bloque vacío.
   */
  describe('bloques vacíos de "Proyección colocación"', () => {
    /** El `HttpContext` es el tercer argumento de `getRegularData`. */
    function contextoDe(indice: number): HttpContext | undefined {
      return getRegularData.mock.calls[indice][2];
    }

    it('el resumen va sin contexto de timeout', () => {
      servicio.colocacionResumen(NODO).subscribe();

      expect(contextoDe(0)).toBeUndefined();
    });

    it('un resumen sin datos queda como tabla vacía', () => {
      getRegularData.mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 500, statusText: 'Resultado vacio para: regularData' })),
      );

      let tabla: unknown;
      servicio.colocacionResumen(NODO).subscribe((t) => (tabla = t));

      expect(tabla).toEqual({ headers: [], body: [], additional: {} });
    });

    it('"Proyección diaria" tampoco', () => {
      servicio.diariaColocacion(NODO).subscribe();

      expect(contextoDe(0)).toBeUndefined();
    });
  });
});

import { HttpContext } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  TIMEOUT_MS,
  TIMEOUT_REPORTE_PESADO_MS,
} from '../../../../../../../../core/interceptors/auth.interceptor';
import { of, throwError } from 'rxjs';
import { CarteraMoraCraService } from './cartera-mora-cra.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };
const RESPUESTA = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

/**
 * Regresión de `docs/09-incidencias/incidencias-mora.md` (2, 3, 4 y 5).
 *
 * Los cuatro reportes daban HTTP 500 o tabla vacía por la misma causa: se
 * pedían por el strand equivocado. El `reportType` de `cra-map.ts` solo lo
 * miran los hosts que llaman `getMixData()`; los hosts `-v4`, `-v7` y `-v11`
 * llaman `cs.getRegularData()` directamente, y además arman sus parámetros como
 * `{ ...getParamsAdd(), ...filter, ...level }`, SIN `fec`.
 */
describe('CarteraMoraCraService', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let getDeprecatedData: ReturnType<typeof vi.fn>;
  let servicio: CarteraMoraCraService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of(RESPUESTA));
    getDeprecatedData = vi.fn().mockReturnValue(of(RESPUESTA));
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData, getDeprecatedData } }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(CarteraMoraCraService);
  });

  describe('reportes de los hosts `-v4` y `-v7` (incidencias 2, 3 y 4)', () => {
    it('"Monitor Efectividades" NO usa el strand deprecado: va por `regularData`', () => {
      servicio.monitorEfectividadesResumen(NODO).subscribe();

      expect(getDeprecatedData).not.toHaveBeenCalled();
      expect(getRegularData).toHaveBeenCalled();
    });

    it('el resumen pide el `_01` y el `_03` dos veces, una por tramo (el `_02` es del detalle)', () => {
      servicio.monitorEfectividadesResumen(NODO).subscribe();

      expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual([
        'RS_MON_EFEC_01',
        'RS_MON_EFEC_03',
        'RS_MON_EFEC_03',
      ]);
      expect(getRegularData.mock.calls[1][1]).toMatchObject({ tram: '1. -30-0' });
      expect(getRegularData.mock.calls[2][1]).toMatchObject({ tram: '2. 1-30' });
    });

    it('el detalle pide el `_02` con sus filtros y con `pagen`', () => {
      servicio.monitorEfectividadesDetalle(NODO, { prod: 'AGROPECUARIO' }, 3).subscribe();

      expect(getRegularData.mock.calls[0][0]).toBe('RS_MON_EFEC_02');
      expect(getRegularData.mock.calls[0][1]).toMatchObject({ prod: 'AGROPECUARIO', pagen: 3 });
    });

    it('la página pedida gana sobre el `pagen` fijo que trae `paramsDetalleComunes`', () => {
      servicio.monitorEfectividadesDetalle(NODO, { pagen: 1 }, 5).subscribe();

      expect(getRegularData.mock.calls[0][1]).toMatchObject({ pagen: 5 });
    });

    /**
     * El backend contesta 500 (`NullPointerException: Resultado vacio`) cuando un
     * bloque no tiene filas. Dentro del `forkJoin` eso tumbaba el reporte entero.
     */
    it('un bloque que falla no tumba a los demás: devuelve tabla vacía', () => {
      getRegularData
        .mockReturnValueOnce(of(RESPUESTA))
        .mockReturnValueOnce(throwError(() => new Error('500 Resultado vacio para: regularData')))
        .mockReturnValueOnce(of(RESPUESTA));

      let tablas: unknown[] | undefined;
      servicio.monitorEfectividadesResumen(NODO).subscribe((t) => (tablas = t));

      expect(tablas).toHaveLength(3);
      expect(tablas?.[1]).toEqual({ headers: [], body: [], additional: {} });
    });

    it('ningún bloque de `-v4` manda `fec`: el host solo manda los params del mapa y el nodo', () => {
      servicio.monitorEfectividadesResumen(NODO).subscribe();

      for (const [, params] of getRegularData.mock.calls) {
        expect(params).not.toHaveProperty('fec');
        expect(params).toMatchObject({ tip_cod: 9, cod_rel: 'FC', fecha: '20251130' });
      }
    });

    it.each([
      ['seguimientoReprogramados', 'RS_MON_EFECREPRO_01'],
      ['reportePagoPuntual', 'RS_MON_EFECTRAMOSC_01'],
    ])('"%s" va por `regularData` con `fecha` y sin `fec`', (metodo, codRep) => {
      (servicio[metodo as 'seguimientoReprogramados' | 'reportePagoPuntual'])(NODO).subscribe();

      expect(getDeprecatedData).not.toHaveBeenCalled();
      expect(getRegularData).toHaveBeenCalledTimes(1);
      expect(getRegularData.mock.calls[0][0]).toBe(codRep);
      expect(getRegularData.mock.calls[0][1]).toEqual({ tip_cod: 9, cod_rel: 'FC', fecha: '20251130' });
    });
  });

  describe('"Seguimiento de Portafolio" (incidencia 5)', () => {
    it('pide el mismo bloque tres veces, una por `mode`', () => {
      servicio.seguimientoPortafolio(NODO).subscribe();

      expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual([
        'RS_AVA_POR_01',
        'RS_AVA_POR_01',
        'RS_AVA_POR_01',
      ]);
      expect(getRegularData.mock.calls.map(([, p]) => p['mode'])).toEqual([1, 2, 3]);
    });

    it('no manda `fec` junto al `fecha` del mapa: ese par era lo que devolvía 500', () => {
      servicio.seguimientoPortafolio(NODO).subscribe();

      for (const [, params] of getRegularData.mock.calls) {
        expect(params).not.toHaveProperty('fec');
        expect(params).toMatchObject({ fecha: '20251130' });
      }
    });
  });

  /**
   * Tareas 3 y 4 de `incidencias-mora-actualizado.md`: los dos reportes de data
   * masiva se cortaban por el timeout global de 30 s. Piden el suyo por
   * `HttpContext` en vez de subir el global para toda la app.
   */
  describe('timeout largo de los reportes pesados', () => {
    /** El `HttpContext` es el tercer argumento de `getRegularData`. */
    function contextoDe(indice: number): HttpContext | undefined {
      return getRegularData.mock.calls[indice][2];
    }

    it.each([
      ['seguimientoReprogramados'],
      ['reportePagoPuntual'],
    ])('"%s" pide el timeout largo', (metodo) => {
      (servicio[metodo as 'seguimientoReprogramados' | 'reportePagoPuntual'])(NODO).subscribe();

      expect(contextoDe(0)?.get(TIMEOUT_MS)).toBe(TIMEOUT_REPORTE_PESADO_MS);
    });

    it('"Seguimiento de Portafolio" lo pide en sus tres bloques', () => {
      servicio.seguimientoPortafolio(NODO).subscribe();

      for (let i = 0; i < 3; i++) expect(contextoDe(i)?.get(TIMEOUT_MS)).toBe(TIMEOUT_REPORTE_PESADO_MS);
    });

    it('un reporte normal NO pide timeout largo: se queda con el global', () => {
      servicio.cmgMora(NODO).subscribe();

      expect(contextoDe(0)).toBeUndefined();
    });
  });

  describe('reportes que sí van por el motor mixto con `fec` (no deben cambiar)', () => {
    it.each([
      ['cmgMora', 'cuadro_Variable_Riesgo_01'],
      ['cmgMoraSinImpulso', 'cmg_mora_simp_01'],
    ])('"%s" sigue mandando el `fec` común', (metodo, codRep) => {
      (servicio[metodo as 'cmgMora' | 'cmgMoraSinImpulso'])(NODO).subscribe();

      expect(getRegularData.mock.calls[0][0]).toBe(codRep);
      expect(getRegularData.mock.calls[0][1]).toEqual({ tip_cod: 9, cod_rel: 'FC', fec: '20251130' });
    });

    it('"Top Variables de Riesgos" usa el id sin guion bajo y sus tres cortes', () => {
      servicio.topVariablesRiesgo(NODO).subscribe();

      expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual(['RSRTOPV01', 'RSRTOPV01', 'RSRTOPV01']);
      expect(getRegularData.mock.calls.map(([, p]) => p['tip_cod2'])).toEqual(['7', '20', '18']);
    });
  });
});

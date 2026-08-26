import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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
      servicio.monitorEfectividades(NODO, {}).subscribe();

      expect(getDeprecatedData).not.toHaveBeenCalled();
      expect(getRegularData).toHaveBeenCalled();
    });

    it('"Monitor Efectividades" pide sus 4 bloques, con el `_03` dos veces por tramo', () => {
      servicio.monitorEfectividades(NODO, {}).subscribe();

      expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual([
        'RS_MON_EFEC_01',
        'RS_MON_EFEC_02',
        'RS_MON_EFEC_03',
        'RS_MON_EFEC_03',
      ]);
      expect(getRegularData.mock.calls[2][1]).toMatchObject({ tram: '1. -30-0' });
      expect(getRegularData.mock.calls[3][1]).toMatchObject({ tram: '2. 1-30' });
    });

    it('los filtros del bloque `_02` viajan solo en ese bloque', () => {
      servicio.monitorEfectividades(NODO, { tramof: 'TODO', prod: 'AGROPECUARIO' }).subscribe();

      expect(getRegularData.mock.calls[1][1]).toMatchObject({ prod: 'AGROPECUARIO' });
      expect(getRegularData.mock.calls[0][1]).not.toHaveProperty('prod');
    });

    it('ningún bloque de `-v4` manda `fec`: el host solo manda los params del mapa y el nodo', () => {
      servicio.monitorEfectividades(NODO, {}).subscribe();

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

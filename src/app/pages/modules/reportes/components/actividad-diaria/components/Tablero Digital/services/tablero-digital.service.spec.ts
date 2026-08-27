import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TableroDigitalService } from './tablero-digital.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';

const NODO = { tip_cod: 2, cod_rel: 'OFI-01' };
const NODO_COMPLETO = { tip_cod: 2, cod_rel: 'OFI-01', des_rel: 'Oficina 1', lbl_hier: 'Oficina', lvl_hier: 3 };
const RESPUESTA = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

/**
 * Los seis reportes de "Tablero Digital", resueltos contra `cra-map.ts` y
 * `rda-administracion-routing.module.ts`.
 *
 * Este spec existe porque `docs/10-migraciones/ejercicio-03.md` propuso otros
 * `cod_rep`, otros `id` y otras jerarquías, ninguno de los cuales está en el
 * legado. Lo que se fija acá es el mapa real.
 */
describe('TableroDigitalService', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let getRegularTableResult: ReturnType<typeof vi.fn>;
  let getDeprecatedData: ReturnType<typeof vi.fn>;
  let servicio: TableroDigitalService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of(RESPUESTA));
    getDeprecatedData = vi.fn().mockReturnValue(of(RESPUESTA));
    getRegularTableResult = vi
      .fn()
      .mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { headers: '[]', data: [] } } }));
    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: { getRegularData, getRegularTableResult, getDeprecatedData } },
      ],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(TableroDigitalService);
  });

  it('"APP Cliente - Home Banking" pide sus DOS bloques: el host `cra-v1p4` pinta `_01` y `_02`', () => {
    servicio.appClienteHomeBanking(NODO).subscribe();

    expect(getRegularData.mock.calls.map(([codRep]) => codRep)).toEqual(['TABDIG_01', 'TABDIG_02']);
    for (const [, params] of getRegularData.mock.calls) {
      expect(params).toEqual({ tip_cod: 2, cod_rel: 'OFI-01', fec: '20251130' });
    }
  });

  /**
   * Los dos reportes de "Gestión" declaran `_02` en el mapa. Pedir `_01` —que
   * es lo que propone `ejercicio-03.md`— apunta a un bloque que no existe.
   */
  it.each([
    ['gestionCanal', 'GCTABDIG_VR2_OPE_02'],
    ['gestionCorresponsal', 'RVIUWGCORE_02'],
  ])('"%s" usa el id `_02`, no `_01`', (metodo, codRep) => {
    (servicio[metodo as 'gestionCanal' | 'gestionCorresponsal'])(NODO).subscribe();

    expect(getRegularData.mock.calls[0][0]).toBe(codRep);
  });

  it.each([
    ['vistaGeneralCanal', 'TABDIG_VR2_01'],
    ['vistaGeneralCorresponsal', 'RVIUWGCOR_01'],
  ])('"%s" pide su bloque `_01`', (metodo, codRep) => {
    (servicio[metodo as 'vistaGeneralCanal' | 'vistaGeneralCorresponsal'])(NODO).subscribe();

    expect(getRegularData.mock.calls[0][0]).toBe(codRep);
  });

  it('todos van por `regularData`: sus entradas del mapa declaran `ReportType.REGULAR`', () => {
    servicio.vistaGeneralCanal(NODO).subscribe();
    servicio.gestionCanal(NODO).subscribe();
    servicio.vistaGeneralCorresponsal(NODO).subscribe();
    servicio.gestionCorresponsal(NODO).subscribe();

    expect(getDeprecatedData).not.toHaveBeenCalled();
    expect(getRegularData).toHaveBeenCalledTimes(4);
  });

  it('los bloques cuya tabla declara `params: { fec }` lo mandan', () => {
    servicio.vistaGeneralCanal(NODO).subscribe();

    expect(getRegularData.mock.calls[0][1]).toEqual({ tip_cod: 2, cod_rel: 'OFI-01', fec: '20251130' });
  });

  /**
   * `cra-V10` arma `{ ...page, ...filter, ...level }`: `pagen` y el nodo
   * COMPLETO, no solo `tip_cod`/`cod_rel`. Sin eso el backend responde
   * "Resultado vacio para: regularData".
   */
  describe('"Detalle Corresponsales" (host paginado `cra-V10`)', () => {
    it('manda `pagen` y el nodo completo, más el `fec` de su tabla', () => {
      servicio.detalleCorresponsales(NODO_COMPLETO).subscribe();

      expect(getRegularData.mock.calls[0][0]).toBe('RDETCORR_01');
      expect(getRegularData.mock.calls[0][1]).toEqual({
        pagen: 1,
        tip_cod: 2,
        cod_rel: 'OFI-01',
        des_rel: 'Oficina 1',
        lbl_hier: 'Oficina',
        lvl_hier: 3,
        fec: '20251130',
      });
    });

    it('la página pedida viaja en `pagen`', () => {
      servicio.detalleCorresponsales(NODO_COMPLETO, 4).subscribe();

      expect(getRegularData.mock.calls[0][1]).toMatchObject({ pagen: 4 });
    });
  });

  /**
   * "Tablero Digital Comercial" no está en `cra-map.ts`: vive en el repositorio
   * y su corte sale del selector de periodo, no de la fecha del usuario.
   */
  describe('"Tablero Digital Comercial" (repositorio)', () => {
    it('va por el motor `table.regular`, no por `regularData`', () => {
      servicio.tableroComercial({ tip_cod: 9, cod_rel: 'FC' }).subscribe();

      expect(getRegularData).not.toHaveBeenCalled();
      expect(getRegularTableResult).toHaveBeenCalledWith('RS_TAB_COM_01', {
        tip_cod: 9,
        cod_rel: 'FC',
        fec: '2025-11-30',
      });
    });

    it('el periodo elegido reemplaza al corte del usuario', () => {
      servicio.tableroComercial({ tip_cod: 9, cod_rel: 'FC' }, '2025-10-31').subscribe();

      expect(getRegularTableResult.mock.calls[0][1]).toMatchObject({ fec: '2025-10-31' });
    });

    it('las opciones salen de `RS_FECH`', () => {
      getRegularTableResult.mockReturnValue(
        of({ code: '0', headers: {}, body: { resultado: { meta1: [{ json_result: '[]' }] } } }),
      );

      servicio.periodosTableroComercial().subscribe();

      expect(getRegularTableResult).toHaveBeenCalledWith('RS_FECH', { fec: '2025-11-30' });
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CarteraCraService } from './cartera-cra.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

describe('CarteraCraService (reportes de Cartera del `report-cra-v1p1`)', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let servicio: CarteraCraService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } }));
    TestBed.configureTestingModule({ providers: [{ provide: ModReportesService, useValue: { getRegularData } }] });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(CarteraCraService);
  });

  /** `cod_rep` pedido y parámetros propios (sin los comunes de nodo/`fec`). */
  function llamadas(): { codRep: string; extra: Record<string, unknown> }[] {
    return getRegularData.mock.calls.map(([codRep, params]) => {
      const { tip_cod: _t, cod_rel: _c, fec: _f, ...extra } = params;
      return { codRep, extra };
    });
  }

  it('"Saldo Cartera" pide sus 5 bloques en el orden del legado, empezando por el `_04`', () => {
    servicio.saldoCartera(NODO).subscribe();

    expect(llamadas().map((l) => l.codRep)).toEqual([
      'RS_SAL_CAR_04',
      'RS_SAL_CAR_05',
      'RS_SAL_CAR_01',
      'RS_SAL_CAR_02',
      'RS_SAL_CAR_03',
    ]);
  });

  it('los bloques que el legado declara con `fecha` lo reciben aparte del `fec` común', () => {
    servicio.saldoCartera(NODO).subscribe();

    // `cra-map.ts` declara `params: { fecha: fec_day_ult }` para estos bloques.
    expect(llamadas()[0].extra).toEqual({ fecha: '20251130' });
  });

  it('"Datos por Producto" pide sus 4 bloques', () => {
    servicio.datosProducto(NODO).subscribe();
    expect(llamadas().map((l) => l.codRep)).toEqual(['RS_DAT_PRO_01', 'RS_DAT_PRO_02', 'RS_DAT_PRO_03', 'RS_DAT_PRO_04']);
  });

  it('"Comité de Créditos" pide el bloque `_02`, que es el único que declara el legado', () => {
    servicio.comiteCreditos(NODO).subscribe();
    expect(llamadas()).toEqual([{ codRep: 'GCOMCRE_02', extra: {} }]);
  });

  it('"Desembolsos PDM" manda `fecha`, no solo el `fec` común', () => {
    servicio.desembolsosPdm(NODO).subscribe();
    expect(llamadas()).toEqual([{ codRep: 'DET_INCEN_PDM_01', extra: { fecha: '20251130' } }]);
  });

  it.each([
    ['portafolioAgro', 'PortafolioAgro_01'],
    ['destinoCredito', 'DESCRED_01'],
    ['rankingAutonomias', 'reporte_autonomia_newdiaria_01'],
    ['activasPdm', 'RACTGP_01'],
    ['moraPdm', 'RESMORAGP_01'],
    ['detalleIncentivosPdm', 'RESINCGRUP_01'],
  ])('%s pide %s sin parámetros propios', (metodo, codRep) => {
    (servicio[metodo as keyof CarteraCraService] as (n: typeof NODO) => { subscribe: () => void }).call(servicio, NODO).subscribe();
    expect(llamadas()).toEqual([{ codRep, extra: {} }]);
  });

  it('todos mandan el nodo y la fecha de corte del backend', () => {
    servicio.activasPdm(NODO).subscribe();
    expect(getRegularData.mock.calls[0][1]).toMatchObject({ tip_cod: 9, cod_rel: 'FC', fec: '20251130' });
  });
});

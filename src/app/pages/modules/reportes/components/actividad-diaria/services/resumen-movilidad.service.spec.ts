import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ResumenMovilidadService } from './resumen-movilidad.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../core/interfaces/shell-state.model';

const NODO_COMPLETO = { tip_cod: 9, cod_rel: 'FC', des_rel: 'Financiera', lbl_hier: 'Unidad', lvl_hier: 1 };
const RESPUESTA = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };

function usuario(extra: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: '1',
    nombre: 'Ana',
    email: 'ana@confianza.pe',
    rol: 'admin-general',
    subsistemas: [],
    fechaCorte: '20251130',
    ...extra,
  };
}

describe('ResumenMovilidadService', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let getDeprecatedData: ReturnType<typeof vi.fn>;
  let shell: ShellStateService;
  let servicio: ResumenMovilidadService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of(RESPUESTA));
    getDeprecatedData = vi.fn().mockReturnValue(of(RESPUESTA));
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData, getDeprecatedData } }],
    });
    shell = TestBed.inject(ShellStateService);
    shell.setUsuarioActivo(usuario({ numDoc: '44556677' }));
    servicio = TestBed.inject(ResumenMovilidadService);
  });

  /**
   * Los dos se parecen en el nombre y en nada más: `res-mov` sale del host
   * paginado `cra-V10` y `res-mov-rec` del `cra-v6`, que ni siquiera usa la
   * jerarquía.
   */
  describe('"Resumen de Movilidad Comercial" (host paginado `cra-V10`)', () => {
    it('manda `pagen` y el nodo completo', () => {
      servicio.comercial(NODO_COMPLETO).subscribe();

      expect(getRegularData.mock.calls[0][0]).toBe('RESNMOV_01');
      expect(getRegularData.mock.calls[0][1]).toEqual({
        pagen: 1,
        tip_cod: 9,
        cod_rel: 'FC',
        des_rel: 'Financiera',
        lbl_hier: 'Unidad',
        lvl_hier: 1,
      });
    });

    /** Su entrada del mapa no declara `params`, así que no lleva `fec`. */
    it('NO manda `fec`: su tabla no lo declara en el mapa', () => {
      servicio.comercial(NODO_COMPLETO).subscribe();

      expect(getRegularData.mock.calls[0][1]).not.toHaveProperty('fec');
    });
  });

  describe('"Resumen de Movilidad Recuperaciones" (host `cra-v6`)', () => {
    it('manda los parámetros del nodo y la fecha de corte', () => {
      servicio.recuperaciones(NODO_COMPLETO).subscribe();

      expect(getRegularData.mock.calls[0][0]).toBe('RESNMOVR_01');
      expect(getRegularData.mock.calls[0][1]).toEqual({
        fec: '20251130',
        tip_cod: 9,
        cod_rel: 'FC',
      });
    });

    it('va por `regularData`: su entrada del mapa declara `ReportType.REGULAR`', () => {
      servicio.recuperaciones(NODO_COMPLETO).subscribe();

      expect(getDeprecatedData).not.toHaveBeenCalled();
    });
  });
});

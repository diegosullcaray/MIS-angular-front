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

  /**
   * `cra-v6` arma los parámetros del nodo y después los PISA enteros con los del
   * usuario logueado. El reporte es siempre el del propio usuario, sin importar
   * qué nivel se elija — por eso su pantalla no lleva selector de jerarquía.
   */
  describe('"Resumen de Movilidad Recuperaciones" (host `cra-v6`)', () => {
    it('consulta por el documento del usuario, no por la jerarquía', () => {
      servicio.recuperaciones('44556677').subscribe();

      expect(getRegularData.mock.calls[0][0]).toBe('RESNMOVR_01');
      expect(getRegularData.mock.calls[0][1]).toEqual({
        fec: '20251130',
        secuency: '[{"tip_cod":2,"cod_rel":"44556677","order":0}]',
        tip_cod: 2,
        cod_rel: '44556677',
      });
    });

    it('el `tip_cod` es 2 (personas), no el 9 de la jerarquía de unidades', () => {
      servicio.recuperaciones('44556677').subscribe();

      expect(getRegularData.mock.calls[0][1]).toMatchObject({ tip_cod: 2 });
    });

    it('va por `regularData`: su entrada del mapa declara `ReportType.REGULAR`', () => {
      servicio.recuperaciones('44556677').subscribe();

      expect(getDeprecatedData).not.toHaveBeenCalled();
    });

    it('`documentoUsuario()` devuelve el `num_doc` del perfil', () => {
      expect(servicio.documentoUsuario()).toBe('44556677');
    });

    /** Sin documento no hay consulta posible: la pantalla lo dice en vez de pedir datos de otro. */
    it('`documentoUsuario()` devuelve undefined si el backend no lo mandó', () => {
      shell.setUsuarioActivo(usuario());

      expect(servicio.documentoUsuario()).toBeUndefined();
    });
  });
});

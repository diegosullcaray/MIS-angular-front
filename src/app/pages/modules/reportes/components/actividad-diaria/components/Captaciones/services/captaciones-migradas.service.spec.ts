import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RecaudosServiciosService } from './recaudos-servicios.service';
import { CaptacionCanalComercialService } from './captacion-canal-comercial.service';
import { CaptacionCanalOperacionesService } from './captacion-canal-operaciones.service';
import { CmgClientesPasivosService } from './cmg-clientes-pasivos.service';
import { SeguimientoBancaPreferenteService } from './seguimiento-banca-preferente.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';

const NODO = { tip_cod: 13, cod_rel: 'FC' };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

/**
 * Los 8 reportes que faltaban migrar salen todos del `report-cra-v1p1` del
 * legado: mismo motor (`regularData`), y lo único propio de cada uno es su
 * `cod_rep` (`module` + `id` de `cra-map.ts`) y sus filtros.
 */
describe('Reportes de Captaciones migrados desde `report-cra-v1p1`', () => {
  let getRegularData: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } }));
    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData } }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
  });

  /** `cod_rep` pedido y parámetros propios (sin los comunes de nodo/fecha). */
  function llamada(): { codRep: string; extra: Record<string, unknown> } {
    const [codRep, params] = getRegularData.mock.calls[0];
    const { tip_cod: _t, cod_rel: _c, fec: _f, ...extra } = params;
    return { codRep, extra };
  }

  it('"Recaudo de Servicios" pide RECSERV_PAS_01 sin filtros propios', () => {
    TestBed.inject(RecaudosServiciosService).obtener(NODO).subscribe();
    expect(llamada()).toEqual({ codRep: 'RECSERV_PAS_01', extra: {} });
  });

  it('"Captación por Canal Comercial" pide CARACT_CARTERA_01 con el filtro `prod`', () => {
    TestBed.inject(CaptacionCanalComercialService).obtener(NODO, 'AHORROS').subscribe();
    expect(llamada()).toEqual({ codRep: 'CARACT_CARTERA_01', extra: { prod: 'AHORROS' } });
  });

  it('"Captación por Canal Operaciones" pide CARACT_pas_01 con `prod` y `segmento`', () => {
    TestBed.inject(CaptacionCanalOperacionesService).obtener(NODO, 'CTS', 'Rural').subscribe();
    expect(llamada()).toEqual({ codRep: 'CARACT_pas_01', extra: { prod: 'CTS', segmento: 'Rural' } });
  });

  it('"CMG Clientes Pasivo" pide CMG_CLI_PAS_01 con el filtro `agru`', () => {
    TestBed.inject(CmgClientesPasivosService).flujo(NODO, 'Saldo').subscribe();
    expect(llamada()).toEqual({ codRep: 'CMG_CLI_PAS_01', extra: { agru: 'Saldo' } });
  });

  it('"CMG Clientes Pasivo Stock" pide el bloque `_02`, no el `_01` como sus hermanos', () => {
    TestBed.inject(CmgClientesPasivosService).stock(NODO).subscribe();
    expect(llamada()).toEqual({ codRep: 'CMG_CLI_PAS_STOCK_02', extra: {} });
  });

  it('"CMG Clientes Pasivo Detalle" pide CMG_CLI_PAS_DETA_01 con `agru` y `grupo`', () => {
    TestBed.inject(CmgClientesPasivosService).flujoDetalle(NODO, 'Cuentas', 'Anual').subscribe();
    expect(llamada()).toEqual({ codRep: 'CMG_CLI_PAS_DETA_01', extra: { agru: 'Cuentas', grupo: 'Anual' } });
  });

  it('"Seguimiento Captaciones Banca Preferente" pide CAP_SEGUI_BP_01 con el filtro `prod`', () => {
    TestBed.inject(SeguimientoBancaPreferenteService).bancaPreferente(NODO, 'Cts').subscribe();
    expect(llamada()).toEqual({ codRep: 'CAP_SEGUI_BP_01', extra: { prod: 'Cts' } });
  });

  it('"Gestión Red de Agencias" pide CAP_SEGUI_FC_BP_01 sin filtros propios', () => {
    TestBed.inject(SeguimientoBancaPreferenteService).redAgencias(NODO).subscribe();
    expect(llamada()).toEqual({ codRep: 'CAP_SEGUI_FC_BP_01', extra: {} });
  });

  it('todos mandan el nodo y la fecha de corte del backend', () => {
    TestBed.inject(RecaudosServiciosService).obtener(NODO).subscribe();
    expect(getRegularData.mock.calls[0][1]).toMatchObject({ tip_cod: 13, cod_rel: 'FC', fec: '20251130' });
  });
});

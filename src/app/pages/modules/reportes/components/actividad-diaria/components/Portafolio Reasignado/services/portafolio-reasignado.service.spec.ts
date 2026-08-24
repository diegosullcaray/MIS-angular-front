import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PortafolioReasignadoService } from './portafolio-reasignado.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import type { UsuarioActivo } from '../../../../../../../../core/interfaces/shell-state.model';
import { paramsDetalleComunes, TODO } from '../models/portafolio-reasignado.model';

const NODO = { tip_cod: 9, cod_rel: 'FC' };

function usuario(): UsuarioActivo {
  return { id: '1', nombre: 'Ana', email: 'ana@confianza.pe', rol: 'admin-general', subsistemas: [], fechaCorte: '20251130' };
}

describe('PortafolioReasignadoService', () => {
  let getRegularData: ReturnType<typeof vi.fn>;
  let getRegularTableResult: ReturnType<typeof vi.fn>;
  let servicio: PortafolioReasignadoService;

  beforeEach(() => {
    getRegularData = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } }));
    getRegularTableResult = vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { resultado: { headers: '[]', data: [] } } }));

    TestBed.configureTestingModule({
      providers: [{ provide: ModReportesService, useValue: { getRegularData, getRegularTableResult } }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario());
    servicio = TestBed.inject(PortafolioReasignadoService);
  });

  it('"Efectividad por tramos" va por `table.regular` con su filtro `imp`', () => {
    servicio.efectividadPorTramos(NODO, 2).subscribe();

    expect(getRegularData).not.toHaveBeenCalled();
    expect(getRegularTableResult).toHaveBeenCalledWith('RS_MON_EFECREASIG_03', {
      tip_cod: 9,
      cod_rel: 'FC',
      fec: '2025-11-30',
      imp: 2,
    });
  });

  it('el resumen de "Gestión de Cartera Reasignada" pide RS_AGE_COM_CR_01 con `ver`', () => {
    servicio.gestionResumen(NODO, 1).subscribe();

    const [codRep, params] = getRegularData.mock.calls[0];
    expect(codRep).toBe('RS_AGE_COM_CR_01');
    expect(params).toMatchObject({ tip_cod: 9, cod_rel: 'FC', fecha: '20251130', ver: 1 });
  });

  it('el detalle de "Gestión" pide el bloque `_03`, aunque el mapa declare ese tramo como `_02`', () => {
    servicio.gestionDetalle(NODO, 0, { pagen: 2 }).subscribe();

    const [codRep, params] = getRegularData.mock.calls[0];
    expect(codRep).toBe('RS_AGE_COM_CR_03');
    expect(params).toMatchObject({ ver: 0, pagen: 2 });
  });

  it('"Monitor Efectividades" separa el bloque de resumen del de detalle', () => {
    servicio.monitorResumen(NODO).subscribe();
    servicio.monitorDetalle(NODO, { tramof: TODO }).subscribe();

    expect(getRegularData.mock.calls.map((c) => c[0])).toEqual(['RS_MON_EFECREASIG_01', 'RS_MON_EFECREASIG_02']);
  });

  it('estos bloques declaran su corte como `fecha`, no como el `fec` que agrega el servicio base', () => {
    servicio.monitorResumen(NODO).subscribe();
    expect(getRegularData.mock.calls[0][1]).toMatchObject({ fecha: '20251130' });
  });

  it('las opciones de "Última Gestión" salen del backend, con TODO al frente', () => {
    getRegularData.mockReturnValue(
      of({
        code: '0',
        headers: {},
        body: { result: { headers: [], body: [{ id: 'CONTACTADO', desc: 'Contactado' }], additional: {} } },
      }),
    );

    let opciones: unknown;
    servicio.opcionesUltimaGestion().subscribe((o) => (opciones = o));

    expect(getRegularData.mock.calls[0][0]).toBe('SEL_EFEC_01');
    expect(opciones).toEqual([
      { id: TODO, desc: 'TODO' },
      { id: 'CONTACTADO', desc: 'Contactado' },
    ]);
  });
});

describe('paramsDetalleComunes', () => {
  it('manda el asesor entre comodines, como espera el backend', () => {
    expect(paramsDetalleComunes({ asesor: 'perez', fechaCompromiso: null, ultimaGestion: TODO, pagina: 1 })).toMatchObject({
      nom: '%perez%',
    });
  });

  it('sin asesor escrito, los comodines quedan vacíos y no filtran', () => {
    expect(paramsDetalleComunes({ asesor: '', fechaCompromiso: null, ultimaGestion: TODO, pagina: 1 })['nom']).toBe('%%');
  });

  it('sin fecha de compromiso manda TODO, no una fecha inventada', () => {
    expect(paramsDetalleComunes({ asesor: '', fechaCompromiso: null, ultimaGestion: TODO, pagina: 1 })['fcompro']).toBe(TODO);
  });

  it('con fecha la manda en `dd/MM/yyyy`, el formato del legado', () => {
    const params = paramsDetalleComunes({
      asesor: '',
      fechaCompromiso: new Date(2026, 2, 7),
      ultimaGestion: TODO,
      pagina: 1,
    });
    expect(params['fcompro']).toBe('07/03/2026');
  });

  it('la página viaja como `pagen`, empezando en 1', () => {
    expect(paramsDetalleComunes({ asesor: '', fechaCompromiso: null, ultimaGestion: TODO, pagina: 3 })['pagen']).toBe(3);
  });
});

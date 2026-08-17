import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientesReprogramadosService } from './clientes-reprogramados.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ModSeccionesService } from '../../../../../../core/winder/instances/mod-secciones.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

describe('ClientesReprogramadosService', () => {
  let service: ClientesReprogramadosService;
  let reportesFalso: { getRegularData: ReturnType<typeof vi.fn> };
  let seccionesFalso: { postRegularUpdate: ReturnType<typeof vi.fn> };
  let asesorSecFalso: { obtenerAsesores: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };
    reportesFalso = { getRegularData: vi.fn().mockReturnValue(of(respuesta)) };
    seccionesFalso = { postRegularUpdate: vi.fn().mockReturnValue(of({})) };
    asesorSecFalso = { obtenerAsesores: vi.fn().mockReturnValue(of([])) };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: reportesFalso },
        { provide: ModSeccionesService, useValue: seccionesFalso },
        { provide: AsesorSecService, useValue: asesorSecFalso },
      ],
    });
    service = TestBed.inject(ClientesReprogramadosService);
  });

  it('obtenerClientes() pide RES_SEC_REP_01 con tip_cod/cod_rel', () => {
    service.obtenerClientes({ tip_cod: 2, cod_rel: '12345678' }).subscribe();
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('RES_SEC_REP_01', { tip_cod: 2, cod_rel: '12345678' });
  });

  it('guardar() manda el cliente + respuestas como un único string JSON bajo la clave "json" — no como campos sueltos', () => {
    const cliente = { nom_cli: 'María López', num_doc: '87654321' };
    const respuestas = { preg_01: 'SI', preg_02: 'Total', preg_03: 0.5, preg_04: 'Si Acepta Masiva' };

    service.guardar(cliente, respuestas).subscribe();

    expect(seccionesFalso.postRegularUpdate).toHaveBeenCalledWith('UP_REPRO_01', {
      json: JSON.stringify({ ...cliente, ...respuestas }),
    });
  });
});

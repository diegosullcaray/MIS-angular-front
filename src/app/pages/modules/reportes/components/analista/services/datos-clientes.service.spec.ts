import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DatosClientesService } from './datos-clientes.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ModSeccionesService } from '../../../../../../core/winder/instances/mod-secciones.service';
import { AsesorSecService } from './asesor-sec.service';
import { DATOS_CLIENTE_FORM_VACIO } from '../models/datos-clientes.model';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

describe('DatosClientesService', () => {
  let service: DatosClientesService;
  let reportesFalso: { getRegularData: ReturnType<typeof vi.fn> };
  let seccionesFalso: { postRegularUpdate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };
    reportesFalso = { getRegularData: vi.fn().mockReturnValue(of(respuesta)) };
    seccionesFalso = { postRegularUpdate: vi.fn().mockReturnValue(of({})) };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: reportesFalso },
        { provide: ModSeccionesService, useValue: seccionesFalso },
        { provide: AsesorSecService, useValue: { obtenerAsesores: vi.fn().mockReturnValue(of([])) } },
      ],
    });
    service = TestBed.inject(DatosClientesService);
  });

  it('obtenerClientes() pide DET_CLI_01 con tip_cod/cod_rel', () => {
    service.obtenerClientes({ tip_cod: 2, cod_rel: '12345678' }).subscribe();
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('DET_CLI_01', { tip_cod: 2, cod_rel: '12345678' });
  });

  it('obtenerCiiu() pide SEL_CIU_01 (distinto de SEL_CIU_02, el de Encuesta Clientes)', () => {
    service.obtenerCiiu().subscribe();
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('SEL_CIU_01', {});
  });

  it('guardar() manda UPD_CLI_01 con el cliente + formulario como un único string JSON', () => {
    const cliente = { nom_cli: 'María López', num_doc: '87654321' };
    const referencia = { cel: '999888777', ciu: 'COM-01' };

    service.guardar(cliente, DATOS_CLIENTE_FORM_VACIO, referencia).subscribe();

    expect(seccionesFalso.postRegularUpdate).toHaveBeenCalledTimes(1);
    const [codRep, params] = seccionesFalso.postRegularUpdate.mock.calls[0];
    expect(codRep).toBe('UPD_CLI_01');
    const enviado = JSON.parse((params as { json: string }).json);
    expect(enviado.nom_cli).toBe('María López');
    expect(enviado.bantotal).toEqual({ ciu: 'COM-01', cel: '999888777' });
  });
});

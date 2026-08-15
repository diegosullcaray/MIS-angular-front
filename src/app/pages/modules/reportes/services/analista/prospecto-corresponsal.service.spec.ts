import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ProspectoCorresponsalService } from './prospecto-corresponsal.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ModSeccionesService } from '../../../../core/winder/instances/mod-secciones.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../core/interfaces/shell-state.model';

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return { id: 'u-1', nombre: 'Ana Torres', email: 'ana@confianza.pe', rol: 'admin-sistema', subsistemas: [], ...overrides };
}

describe('ProspectoCorresponsalService', () => {
  let service: ProspectoCorresponsalService;
  let shell: ShellStateService;
  let reportesFalso: { getRegularData: ReturnType<typeof vi.fn> };
  let seccionesFalso: { postRegularUpdate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };
    reportesFalso = { getRegularData: vi.fn().mockReturnValue(of(respuesta)) };
    seccionesFalso = { postRegularUpdate: vi.fn().mockReturnValue(of(respuesta)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: reportesFalso },
        { provide: ModSeccionesService, useValue: seccionesFalso },
        { provide: AsesorSecService, useValue: { obtenerAsesores: vi.fn().mockReturnValue(of([])) } },
      ],
    });
    service = TestBed.inject(ProspectoCorresponsalService);
    shell = TestBed.inject(ShellStateService);
  });

  it('obtenerProspectos() pide LIS_PROSPE_01 vía getRegularData', () => {
    service.obtenerProspectos({ tip_cod: 2, cod_rel: '12345678' }).subscribe();
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('LIS_PROSPE_01', { tip_cod: 2, cod_rel: '12345678' });
  });

  it('obtenerJerarquia() pide SEL_JER_01 vía getRegularData', () => {
    service.obtenerJerarquia().subscribe();
    expect(reportesFalso.getRegularData).toHaveBeenCalledWith('SEL_JER_01', {});
  });

  it('guardarProspecto() manda ADD_PROS_CORRE_01 con el formulario y el cod_bt del usuario activo, como json', () => {
    shell.setUsuarioActivo(usuario({ codBt: 'BT-001' }));

    const formulario = { HAPENOMB: 'Juan Pérez' } as never;
    service.guardarProspecto(formulario).subscribe();

    expect(seccionesFalso.postRegularUpdate).toHaveBeenCalledWith('ADD_PROS_CORRE_01', {
      json: JSON.stringify({ HCODSEC: 'BT-001', HAPENOMB: 'Juan Pérez' }),
    });
  });
});

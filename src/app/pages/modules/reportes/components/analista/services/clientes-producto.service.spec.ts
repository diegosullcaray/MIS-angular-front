import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ClientesProductoService } from './clientes-producto.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

describe('ClientesProductoService', () => {
  let service: ClientesProductoService;
  let reportesFalso: { getDeprecatedData: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };
    reportesFalso = { getDeprecatedData: vi.fn().mockReturnValue(of(respuesta)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: reportesFalso },
        { provide: AsesorSecService, useValue: { obtenerAsesores: vi.fn().mockReturnValue(of([])) } },
      ],
    });
    service = TestBed.inject(ClientesProductoService);
  });

  it('obtenerClientesProducto() pide los 3 bloques por el path completo del legado, vía getDeprecatedData', () => {
    service.obtenerClientesProducto({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    const params = { tip_cod: 2, cod_rel: '12345678' };
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/cliente_producto/cliente_producto_sec_01', params);
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/cliente_producto/cliente_producto_sec_02', params);
    expect(reportesFalso.getDeprecatedData).toHaveBeenCalledWith('rda/sectorista/cliente_producto/cliente_producto_sec_03', params);
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InversionStockMoraService } from './inversion-stock-mora.service';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import type { IWinderResponse } from '../../../../../core/winder/winder/winder.interface';

describe('InversionStockMoraService', () => {
  let service: InversionStockMoraService;
  let reportesFalso: { getGraphicData: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const respuesta: IWinderResponse = { code: '0', headers: {}, body: { result: [] } };
    reportesFalso = { getGraphicData: vi.fn().mockReturnValue(of(respuesta)) };

    TestBed.configureTestingModule({
      providers: [
        { provide: ModReportesService, useValue: reportesFalso },
        { provide: AsesorSecService, useValue: { obtenerAsesores: vi.fn().mockReturnValue(of([])) } },
      ],
    });
    service = TestBed.inject(InversionStockMoraService);
  });

  it('obtenerGraficos() pide el único bloque por el path completo del legado, vía getGraphicData', () => {
    service.obtenerGraficos({ tip_cod: 2, cod_rel: '12345678' }).subscribe();

    expect(reportesFalso.getGraphicData).toHaveBeenCalledWith('rda/sectorista/brecha/brecha_inversion_sec_01', {
      tip_cod: 2,
      cod_rel: '12345678',
    });
  });

  it('obtenerGraficos() mapea `result` a `graficos`', () => {
    reportesFalso.getGraphicData.mockReturnValue(
      of({
        code: '0',
        headers: {},
        body: { result: [{ graphName: 'Inversión', categories: [{ columnDef: ['Ene'] }], series: [{ name: 'Real', data: [1] }] }] },
      }),
    );

    let resultado: unknown;
    service.obtenerGraficos({ tip_cod: 2, cod_rel: '12345678' }).subscribe((r) => (resultado = r));

    expect(resultado).toEqual({
      graficos: [{ titulo: 'Inversión', subtitulo: undefined, categorias: ['Ene'], series: [{ nombre: 'Real', datos: [1], color: undefined }], tituloEjeY: undefined }],
    });
  });
});

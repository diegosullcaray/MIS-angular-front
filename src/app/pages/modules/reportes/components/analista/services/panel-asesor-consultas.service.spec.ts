import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PanelAsesorConsultasService } from './panel-asesor-consultas.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { REPORTES_ASESOR } from '../constantes/panel-asesor.constantes';
import { FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO } from '../models/monitor-efectividades.model';
import type { IWinderResponse } from '../../../../../../core/winder/winder/winder.interface';

describe('PanelAsesorConsultasService', () => {
  const vacia: IWinderResponse = { code: '0', headers: {}, body: { result: { headers: [], body: [], additional: {} } } };
  let reportes: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    const falso = () => vi.fn().mockReturnValue(of(vacia));
    const grafica: IWinderResponse = { code: '0', headers: {}, body: { result: [] } };
    reportes = { getDeprecatedData: falso(), getRegularData: falso(), getGraphicData: vi.fn().mockReturnValue(of(grafica)) };
    TestBed.configureTestingModule({
      providers: [PanelAsesorConsultasService, { provide: ModReportesService, useValue: reportes }],
    });
  });

  it('los 17 reportes del panel llegan a Ant con el DNI del asesor como nodo tip_cod 2', () => {
    const servicio = TestBed.inject(PanelAsesorConsultasService);
    for (const { codigo } of REPORTES_ASESOR) {
      Object.values(reportes).forEach((fn) => fn.mockClear());
      let error: unknown = null;
      servicio.consultar(codigo, '12345678', FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO).subscribe({ error: (e) => (error = e) });
      expect(error, codigo).toBeNull();
      const llamadas = Object.values(reportes).flatMap((fn) => fn.mock.calls);
      expect(llamadas.length, codigo).toBeGreaterThan(0);
      for (const [, parametros] of llamadas) {
        expect(parametros, codigo).toEqual(expect.objectContaining({ tip_cod: 2, cod_rel: '12345678' }));
      }
    }
  });

  it('efectividades envía sus filtros del legado', () => {
    TestBed.inject(PanelAsesorConsultasService)
      .consultar('L_MON_EFE_DET_SEC', '1', { ...FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO, prod: 'CONSUMO' })
      .subscribe();
    expect(reportes['getRegularData']).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ prod: 'CONSUMO' }));
  });

  it('un código desconocido falla en vez de devolver vacío', () => {
    let error: unknown = null;
    TestBed.inject(PanelAsesorConsultasService)
      .consultar('X', '1', FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO)
      .subscribe({ error: (e) => (error = e) });
    expect(error).toBeInstanceOf(Error);
  });
});

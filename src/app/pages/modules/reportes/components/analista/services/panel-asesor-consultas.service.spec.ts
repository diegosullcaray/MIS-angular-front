import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PanelAsesorConsultasService } from './panel-asesor-consultas.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { CODIGO_CLIENTES_CONSOLIDADO, REPORTES_ASESOR } from '../constantes/panel-asesor.constantes';
import { COD_ANALISTA } from '../constantes/analista.constantes';
import { TABLA_PENDIENTE } from '../../../models/tabla-reporte.model';
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

  it('los reportes del panel llegan a Ant con el DNI del asesor como nodo tip_cod 2', () => {
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

  it('la vista consolidada de clientes pide Grupos PDM, Clientes N y R y Clientes Producto, y reparte sus 5 tablas', () => {
    const resultados: Record<string, unknown>[] = [];
    TestBed.inject(PanelAsesorConsultasService)
      .consultar(CODIGO_CLIENTES_CONSOLIDADO, '12345678', FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO)
      .subscribe((r) => resultados.push(r as Record<string, unknown>));
    // 1 (Grupos PDM) + 1 (Clientes N y R) + 3 (Clientes Producto) consultas al motor.
    expect(reportes['getDeprecatedData']).toHaveBeenCalledTimes(5);
    const final = resultados.at(-1)!;
    expect(Object.keys(final).sort()).toEqual(['tabla1', 'tabla2', 'tabla3', 'tabla4', 'tabla5']);
    expect(Object.values(final).every((t) => t !== TABLA_PENDIENTE)).toBe(true);
  });

  it('si Grupos PDM llega sin datos, la vista consolidada no lo incluye', () => {
    const conFilas: IWinderResponse = { code: '0', headers: {}, body: { result: { headers: [], body: [{ a: 1 }], additional: {} } } };
    const nula: IWinderResponse = { code: '0', headers: {}, body: { result: null } };
    reportes['getDeprecatedData'].mockImplementation((cod: string) => of(cod === COD_ANALISTA.gruposPorVencer ? nula : conFilas));
    const resultados: Record<string, unknown>[] = [];
    TestBed.inject(PanelAsesorConsultasService)
      .consultar(CODIGO_CLIENTES_CONSOLIDADO, '12345678', FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO)
      .subscribe((r) => resultados.push(r as Record<string, unknown>));
    expect(resultados.at(-1)!['tabla1']).toBeUndefined();
    expect(resultados.at(-1)!['tabla2']).not.toBe(TABLA_PENDIENTE);
  });

  it('los reportes dados de baja del panel ya no se consultan desde aquí', () => {
    for (const codigo of ['L_CAPT_SEC', 'L_PROYDIAOPERSEC', 'L_REG_PROS_SEC', 'L_CER_CUO_SEC', 'L_INVERS_STOCK_SEC', 'L_PLAN_SEC', 'L_RES_MOV_ASESOR', 'L_DESEMP_SOC_SEC']) {
      let error: unknown = null;
      TestBed.inject(PanelAsesorConsultasService)
        .consultar(codigo, '1', FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO)
        .subscribe({ error: (e) => (error = e) });
      expect(error, codigo).toBeInstanceOf(Error);
    }
  });

  it('un código desconocido falla en vez de devolver vacío', () => {
    let error: unknown = null;
    TestBed.inject(PanelAsesorConsultasService)
      .consultar('X', '1', FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO)
      .subscribe({ error: (e) => (error = e) });
    expect(error).toBeInstanceOf(Error);
  });
});

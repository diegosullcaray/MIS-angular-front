import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { BloqueReporteService } from '../../../../../services/bloque-reporte.service';
import { CeroCuotasNuevasService } from './cero-cuotas-nuevas.service';

const NODO = { tip_cod: 9, cod_rel: 'FC' };
const RESPUESTA = { body: { resultado: { data: [] } } };

describe('CeroCuotasNuevasService', () => {
  let regular: ReturnType<typeof vi.fn>;
  let paginado: ReturnType<typeof vi.fn>;
  let tablaRegularCon: ReturnType<typeof vi.fn>;
  let getRegularTableResult: ReturnType<typeof vi.fn>;
  let servicio: CeroCuotasNuevasService;

  beforeEach(() => {
    regular = vi.fn().mockReturnValue(of({ headers: [], body: [], additional: {} }));
    paginado = vi.fn().mockReturnValue(of({ headers: [], body: [], additional: {} }));
    tablaRegularCon = vi.fn().mockReturnValue(of({ columnas: [], filas: [] }));
    getRegularTableResult = vi.fn().mockReturnValue(of(RESPUESTA));

    TestBed.configureTestingModule({
      providers: [
        CeroCuotasNuevasService,
        {
          provide: BloqueReporteService,
          useValue: {
            fec: () => '20260924',
            fecha: () => '2026-09-24',
            regulares: regular,
            regularPaginado: paginado,
            tablaRegularCon,
          },
        },
        { provide: ModReportesService, useValue: { getRegularTableResult } },
      ],
    });
    servicio = TestBed.inject(CeroCuotasNuevasService);
  });

  it('consulta los dos bloques del dashboard de repositorio con fecha ISO y jerarquía', () => {
    servicio.dashboardRevision(NODO).subscribe();

    expect(getRegularTableResult.mock.calls.map(([codigo]) => codigo)).toEqual([
      'REP_CERCUOT_01',
      'REP_CERCUOT_02',
    ]);
    for (const [, params] of getRegularTableResult.mock.calls) {
      expect(params).toEqual({ tip_cod: 9, cod_rel: 'FC', fecha: '2026-09-24' });
    }
  });

  it('conserva los diez cortes del Top de cero cuotas', () => {
    servicio.top(NODO, { tipcuota: '1' }).subscribe();

    expect(regular).toHaveBeenCalledWith(
      expect.arrayContaining([
        { codRep: 'CEROCUOTA_TOPCNUEVA_01', extra: { tipcuota: '1', tip_cod2: '20' } },
        { codRep: 'CEROCUOTA_TOPCNUEVA_05', extra: { tipcuota: '1', tip_cod2: '18' } },
      ]),
      NODO,
    );
    expect(regular.mock.calls[0][0]).toHaveLength(10);
  });

  it('solicita el Top 10 y ambos mapas usando la misma fecha de corte ISO', () => {
    servicio.topAsesoresDashboardRevision(NODO).subscribe();
    servicio.mapasCalorDashboardRevision(NODO).subscribe();

    expect(tablaRegularCon).toHaveBeenCalledWith('RS_TOP_ZCUO_01', {
      tip_cod: 9,
      cod_rel: 'FC',
      fecha: '2026-09-24',
    });
    expect(getRegularTableResult.mock.calls.slice(-2).map(([codigo]) => codigo)).toEqual([
      'GRAF_ZCUO_03',
      'GRAF_ZCUO_04',
    ]);
  });

  it('extrae las cuatro KPI desde RS_CARD_ZCUO_01', () => {
    getRegularTableResult.mockReturnValueOnce(
      of({ body: { resultado: { data: [{ saldo_act: '3000000', men60_act: '1000000' }] } } }),
    );

    let kpis: unknown;
    servicio.kpisDashboardRevision(NODO).subscribe((resultado) => (kpis = resultado));

    expect(getRegularTableResult).toHaveBeenCalledWith('RS_CARD_ZCUO_01', {
      tip_cod: 9,
      cod_rel: 'FC',
      fecha: '2026-09-24',
    });
    expect(kpis).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ etiqueta: 'Total Cero Cuotas (S/)', actual: 3000000 }),
      ]),
    );
  });
});

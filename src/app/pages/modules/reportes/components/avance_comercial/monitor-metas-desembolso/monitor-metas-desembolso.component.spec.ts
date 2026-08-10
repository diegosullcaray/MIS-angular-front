import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MonitorMetasDesembolsoComponent } from './monitor-metas-desembolso.component';
import { ReportesService } from '../../../services/reportes.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { HierarquiaNodo, TablaReporteResultado } from '../../../models';

const NODO: HierarquiaNodo = { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1', lvl: 2 };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('MonitorMetasDesembolsoComponent', () => {
  let reportesFalso: { obtenerBloqueReporte: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    reportesFalso = { obtenerBloqueReporte: vi.fn() };
    TestBed.configureTestingModule({
      imports: [MonitorMetasDesembolsoComponent],
      providers: [{ provide: ReportesService, useValue: reportesFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(MonitorMetasDesembolsoComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('sin nivel elegido, no pide ningún reporte', () => {
    crear();
    expect(reportesFalso.obtenerBloqueReporte).not.toHaveBeenCalled();
  });

  it('onNivelSeleccionado() pide los 4 bloques del reporte con tip_cod/cod_rel del nivel', () => {
    reportesFalso.obtenerBloqueReporte.mockReturnValue(of(tabla()));
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(reportesFalso.obtenerBloqueReporte).toHaveBeenCalledWith('Monitor_Dese_01', { tip_cod: 4, cod_rel: 'A1', tipmet: 1 });
    expect(reportesFalso.obtenerBloqueReporte).toHaveBeenCalledWith('Monitor_Dese_02', { tip_cod: 4, cod_rel: 'A1', tipmet: 1 });
    expect(reportesFalso.obtenerBloqueReporte).toHaveBeenCalledWith('Monitor_Dese_03', { tip_cod: 4, cod_rel: 'A1', tipmet: 1 });
    expect(reportesFalso.obtenerBloqueReporte).toHaveBeenCalledWith('Monitor_Dese_04', { tip_cod: 4, cod_rel: 'A1' });
  });

  it('onNivelSeleccionado() arma las tarjetas KPI desde el additional de cada bloque', () => {
    reportesFalso.obtenerBloqueReporte.mockImplementation((codRep: string) => {
      if (codRep === 'Monitor_Dese_01') {
        return of(tabla({ additional: { fecha: '2026-08-10', hora: '10:00', cumpl_des_acum: '85%' } }));
      }
      if (codRep === 'Monitor_Dese_02') {
        return of(tabla({ additional: { cumpl_ope_acum: '92%' } }));
      }
      return of(tabla({ headers: [{ columns: [{ columnDef: 'x', header: 'X', isdata: 1 }] }], body: [{ x: 1 }] }));
    });
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(fixture.componentInstance['kpiOperaciones']()).toEqual({ fecha: '2026-08-10', hora: '10:00', cumpl_des_acum: '85%' });
    expect(fixture.componentInstance['kpiMonto']()).toEqual({ cumpl_ope_acum: '92%' });
    expect(fixture.componentInstance['tablaOperaciones']().body).toEqual([{ x: 1 }]);
    expect(fixture.componentInstance['tablaMontos']().body).toEqual([{ x: 1 }]);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('onNivelSeleccionado() ante un error del backend muestra un toast y apaga el loading', () => {
    reportesFalso.obtenerBloqueReporte.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });
});

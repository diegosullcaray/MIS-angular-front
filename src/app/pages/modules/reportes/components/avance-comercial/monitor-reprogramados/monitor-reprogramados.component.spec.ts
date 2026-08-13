import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MonitorReprogramadosComponent } from './monitor-reprogramados.component';
import { ReportesService } from '../../../services/reportes.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const NODO: HierarquiaNodo = { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1', lvl: 2 };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('MonitorReprogramadosComponent', () => {
  let reportesFalso: {
    obtenerBloqueReporte: ReturnType<typeof vi.fn>;
    fechaUltimoDia: ReturnType<typeof vi.fn>;
    obtenerJerarquiaBase: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    reportesFalso = {
      obtenerBloqueReporte: vi.fn().mockReturnValue(of(tabla())),
      fechaUltimoDia: vi.fn().mockReturnValue('20260809'),
      obtenerJerarquiaBase: vi.fn().mockReturnValue(of([])),
    };
    TestBed.configureTestingModule({
      imports: [MonitorReprogramadosComponent],
      providers: [{ provide: ReportesService, useValue: reportesFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(MonitorReprogramadosComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('sin nivel elegido, no pide el reporte', () => {
    crear();
    expect(reportesFalso.obtenerBloqueReporte).not.toHaveBeenCalled();
  });

  it('onNivelSeleccionado() pide RS_MON_REP_01 con tip_cod/cod_rel/car (tipo por defecto=1)/fec', () => {
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(reportesFalso.obtenerBloqueReporte).toHaveBeenCalledWith('RS_MON_REP_01', {
      tip_cod: 4,
      cod_rel: 'A1',
      car: 1,
      fec: '20260809',
    });
  });

  it('onTipoSeleccionado() sin nivel elegido todavía, no pide nada', () => {
    const fixture = crear();

    fixture.componentInstance['onTipoSeleccionado'](2);

    expect(reportesFalso.obtenerBloqueReporte).not.toHaveBeenCalled();
    expect(fixture.componentInstance['tipoSeleccionado']()).toBe(2);
  });

  it('onTipoSeleccionado() con un nivel ya elegido, recarga el reporte con el nuevo tipo', () => {
    const fixture = crear();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    reportesFalso.obtenerBloqueReporte.mockClear();

    fixture.componentInstance['onTipoSeleccionado'](2);

    expect(reportesFalso.obtenerBloqueReporte).toHaveBeenCalledWith('RS_MON_REP_01', {
      tip_cod: 4,
      cod_rel: 'A1',
      car: 2,
      fec: '20260809',
    });
  });

  it('carga la tabla devuelta por el backend y apaga el loading', () => {
    reportesFalso.obtenerBloqueReporte.mockReturnValue(
      of(tabla({ headers: [{ columns: [{ columnDef: 'x', header: 'X', isdata: 1 }] }], body: [{ x: 1 }] }))
    );
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(fixture.componentInstance['tablaReprogramados']().body).toEqual([{ x: 1 }]);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('ante un error del backend, muestra un toast y apaga el loading', () => {
    reportesFalso.obtenerBloqueReporte.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });
});

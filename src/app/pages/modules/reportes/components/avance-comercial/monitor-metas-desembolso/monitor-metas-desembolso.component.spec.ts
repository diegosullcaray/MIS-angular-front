import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MonitorMetasDesembolsoComponent } from './monitor-metas-desembolso.component';
import { AvanceComercialService } from '../../../services/avance-comercial.service';
import { ModSysAdminService } from '../../../../../../core/winder/instances/mod-sys-admin.service';
import type { ReporteMonitorMetasDesembolso } from '../../../models/avance-comercial/avance-comercial.model';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const NODO: HierarquiaNodo = { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1', lvl: 2 };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

function reporte(overrides: Partial<ReporteMonitorMetasDesembolso> = {}): ReporteMonitorMetasDesembolso {
  return {
    kpiOperaciones: null,
    kpiMonto: null,
    tabla1: tabla(),
    tabla2: tabla(),
    tabla3: tabla(),
    tabla4: tabla(),
    ...overrides,
  };
}

describe('MonitorMetasDesembolsoComponent', () => {
  let servicioFalso: { obtenerMonitorMetasDesembolso: ReturnType<typeof vi.fn> };
  let antAdminFalso: { getBaseHierarchy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = { obtenerMonitorMetasDesembolso: vi.fn() };
    antAdminFalso = { getBaseHierarchy: vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { base_hierarchy: [] } })) };
    TestBed.configureTestingModule({
      imports: [MonitorMetasDesembolsoComponent],
      providers: [
        { provide: AvanceComercialService, useValue: servicioFalso },
        { provide: ModSysAdminService, useValue: antAdminFalso },
        MessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(MonitorMetasDesembolsoComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('sin nivel elegido, no pide ningún reporte', () => {
    crear();
    expect(servicioFalso.obtenerMonitorMetasDesembolso).not.toHaveBeenCalled();
  });

  it('onNivelSeleccionado() pide el reporte con tip_cod/cod_rel del nivel', () => {
    servicioFalso.obtenerMonitorMetasDesembolso.mockReturnValue(of(reporte()));
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(servicioFalso.obtenerMonitorMetasDesembolso).toHaveBeenCalledWith({ tip_cod: 4, cod_rel: 'A1' });
  });

  it('onNivelSeleccionado() vuelca las tarjetas KPI y tablas devueltas por el service', () => {
    servicioFalso.obtenerMonitorMetasDesembolso.mockReturnValue(
      of(
        reporte({
          kpiOperaciones: { fecha: '2026-08-10', hora: '10:00', cumpl_des_acum: '85%' },
          kpiMonto: { cumpl_ope_acum: '92%' },
          tabla1: tabla({ additional: { fecha: '2026-08-10', hora: '10:00', cumpl_des_acum: '85%' } }),
          tabla3: tabla({ headers: [{ columns: [{ columnDef: 'x', header: 'X', isdata: 1 }] }], body: [{ x: 1 }] }),
          tabla4: tabla({ headers: [{ columns: [{ columnDef: 'x', header: 'X', isdata: 1 }] }], body: [{ x: 1 }] }),
        })
      )
    );
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(fixture.componentInstance['kpiOperaciones']()).toEqual({ fecha: '2026-08-10', hora: '10:00', cumpl_des_acum: '85%' });
    expect(fixture.componentInstance['kpiMonto']()).toEqual({ cumpl_ope_acum: '92%' });
    expect(fixture.componentInstance['tabla1']().additional).toEqual({ fecha: '2026-08-10', hora: '10:00', cumpl_des_acum: '85%' });
    expect(fixture.componentInstance['tabla3']().body).toEqual([{ x: 1 }]);
    expect(fixture.componentInstance['tabla4']().body).toEqual([{ x: 1 }]);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('onNivelSeleccionado() ante un error del backend muestra un toast y apaga el loading', () => {
    servicioFalso.obtenerMonitorMetasDesembolso.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { MonitorMetasDesembolsoAnalistaComponent } from './monitor-metas-desembolso.component';
import { MonitorMetasDesembolsoService } from '../../../services/analista/monitor-metas-desembolso.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

function reporte(overrides: Record<string, unknown> = {}) {
  return {
    kpiOperaciones: { fecha: '2026-08-14', hora: '10:00', cumpl_des_acum: '85%' },
    kpiMonto: { cumpl_ope_acum: '90%' },
    tabla1: tabla({ body: [{ nom_cli: 'a' }] }),
    tabla2: tabla(),
    tabla3: tabla(),
    ...overrides,
  };
}

describe('MonitorMetasDesembolsoAnalistaComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerMonitorMetasDesembolso: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerMonitorMetasDesembolso: vi.fn().mockReturnValue(of(reporte())),
    };
    TestBed.configureTestingModule({
      imports: [MonitorMetasDesembolsoAnalistaComponent],
      providers: [
        { provide: MonitorMetasDesembolsoService, useValue: servicioFalso },
        ToastService,
        MessageService,
        PrimeNgMessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(MonitorMetasDesembolsoAnalistaComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores', () => {
    crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
  });

  it('onAsesorSeleccionado() carga las tarjetas KPI y las 3 tablas del asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerMonitorMetasDesembolso).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['kpiOperaciones']()).toEqual({ fecha: '2026-08-14', hora: '10:00', cumpl_des_acum: '85%' });
    expect(fixture.componentInstance['kpiMonto']()).toEqual({ cumpl_ope_acum: '90%' });
    expect(fixture.componentInstance['tabla1']().body).toEqual([{ nom_cli: 'a' }]);
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerMonitorMetasDesembolso.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si las 3 tablas vienen vacías', () => {
    servicioFalso.obtenerMonitorMetasDesembolso.mockReturnValue(
      of(reporte({ tabla1: tabla(), tabla2: tabla(), tabla3: tabla() })),
    );
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

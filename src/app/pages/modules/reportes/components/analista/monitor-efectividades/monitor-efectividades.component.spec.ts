import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { MonitorEfectividadesComponent } from './monitor-efectividades.component';
import { MonitorEfectividadesService } from '../../../services/monitor-efectividades.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('MonitorEfectividadesComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerMonitorEfectividades: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerMonitorEfectividades: vi.fn().mockReturnValue(of({ tabla1: tabla({ body: [{ nom_cli: 'a' }] }) })),
    };
    TestBed.configureTestingModule({
      imports: [MonitorEfectividadesComponent],
      providers: [
        { provide: MonitorEfectividadesService, useValue: servicioFalso },
        ToastService,
        MessageService,
        PrimeNgMessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(MonitorEfectividadesComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores; los filtros arrancan en TODO', () => {
    const fixture = crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
    expect(fixture.componentInstance['filtros']().tramof).toBe('TODO');
  });

  it('onAsesorSeleccionado() carga la tabla con los filtros actuales', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerMonitorEfectividades).toHaveBeenCalledWith(
      { tip_cod: 2, cod_rel: ASESOR.dni },
      fixture.componentInstance['filtros'](),
    );
    expect(fixture.componentInstance['tabla1']().body).toEqual([{ nom_cli: 'a' }]);
  });

  it('actualizarFiltro() recarga la tabla si ya hay un asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);
    servicioFalso.obtenerMonitorEfectividades.mockClear();

    fixture.componentInstance['actualizarFiltro']('prod', 'CONSUMO');

    expect(fixture.componentInstance['filtros']().prod).toBe('CONSUMO');
    expect(servicioFalso.obtenerMonitorEfectividades).toHaveBeenCalledWith(
      { tip_cod: 2, cod_rel: ASESOR.dni },
      expect.objectContaining({ prod: 'CONSUMO' }),
    );
  });

  it('actualizarFiltro() no llama al servicio si todavía no hay asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['actualizarFiltro']('prod', 'CONSUMO');
    expect(servicioFalso.obtenerMonitorEfectividades).not.toHaveBeenCalled();
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerMonitorEfectividades.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si la tabla viene vacía', () => {
    servicioFalso.obtenerMonitorEfectividades.mockReturnValue(of({ tabla1: tabla() }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { PlanDatosComponent } from './plan-datos.component';
import { PlanDatosService } from '../../services/plan-datos.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('PlanDatosComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerPlanDatos: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerPlanDatos: vi.fn().mockReturnValue(of({ tabla1: tabla({ body: [{ nom_cli: 'a' }] }) })),
    };
    TestBed.configureTestingModule({
      imports: [PlanDatosComponent],
      providers: [{ provide: PlanDatosService, useValue: servicioFalso }, ToastService, MessageService, PrimeNgMessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(PlanDatosComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores; la fecha base arranca con un valor por defecto', () => {
    const fixture = crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
    expect(fixture.componentInstance['fechaBase']()).toMatch(/^\d{8}$/);
  });

  it('onAsesorSeleccionado() carga la tabla con la fecha base actual', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerPlanDatos).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni }, fixture.componentInstance['fechaBase']());
  });

  it('onFechaBaseSeleccionada() recarga la tabla si ya hay un asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);
    servicioFalso.obtenerPlanDatos.mockClear();

    fixture.componentInstance['onFechaBaseSeleccionada']('20250630');

    expect(servicioFalso.obtenerPlanDatos).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni }, '20250630');
  });

  it('onFechaBaseSeleccionada() no llama al servicio si todavía no hay asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onFechaBaseSeleccionada']('20250630');
    expect(servicioFalso.obtenerPlanDatos).not.toHaveBeenCalled();
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerPlanDatos.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si la tabla viene vacía', () => {
    servicioFalso.obtenerPlanDatos.mockReturnValue(of({ tabla1: tabla() }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

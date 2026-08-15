import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { PlanillaMovilidadComponent } from './planilla-movilidad.component';
import { PlanillaMovilidadService } from '../../../services/analista/planilla-movilidad.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('PlanillaMovilidadComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerPlanillaMovilidad: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerPlanillaMovilidad: vi
        .fn()
        .mockReturnValue(of({ tabla1: tabla({ body: [{ nom_cli: 'a' }] }), tabla2: tabla(), tabla3: tabla(), tabla4: tabla() })),
    };
    TestBed.configureTestingModule({
      imports: [PlanillaMovilidadComponent],
      providers: [
        { provide: PlanillaMovilidadService, useValue: servicioFalso },
        ToastService,
        MessageService,
        PrimeNgMessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(PlanillaMovilidadComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores; muestra el período formateado', () => {
    const fixture = crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
    expect(fixture.componentInstance['periodo']).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('onAsesorSeleccionado() carga las 4 tablas del asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerPlanillaMovilidad).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['tabla1']().body).toEqual([{ nom_cli: 'a' }]);
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerPlanillaMovilidad.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si las 4 tablas vienen vacías', () => {
    servicioFalso.obtenerPlanillaMovilidad.mockReturnValue(of({ tabla1: tabla(), tabla2: tabla(), tabla3: tabla(), tabla4: tabla() }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

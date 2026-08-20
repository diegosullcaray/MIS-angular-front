import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { AutonomiaTasasComponent } from './autonomia-tasas.component';
import { AutonomiaTasasService } from '../../services/autonomia-tasas.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('AutonomiaTasasComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerAutonomiaTasas: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerAutonomiaTasas: vi
        .fn()
        .mockReturnValue(of({ tabla1: tabla({ body: [{ nom_cli: 'a' }] }), tabla2: tabla(), tabla3: tabla(), tabla4: tabla() })),
    };
    TestBed.configureTestingModule({
      imports: [AutonomiaTasasComponent],
      providers: [
        { provide: AutonomiaTasasService, useValue: servicioFalso },
        ToastService,
        PrimeNgMessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(AutonomiaTasasComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores', () => {
    crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
  });

  it('onAsesorSeleccionado() carga las 4 tablas del asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerAutonomiaTasas).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['tabla1']().body).toEqual([{ nom_cli: 'a' }]);
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerAutonomiaTasas.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si las 4 tablas vienen vacías', () => {
    servicioFalso.obtenerAutonomiaTasas.mockReturnValue(of({ tabla1: tabla(), tabla2: tabla(), tabla3: tabla(), tabla4: tabla() }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(ToastService), 'advertencia');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { CarteraComponent } from './cartera.component';
import { CarteraService } from '../../services/cartera.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('CarteraComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerCartera: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerCartera: vi.fn().mockReturnValue(of({ tabla1: tabla({ body: [{ nom_cli: 'a' }] }), tabla2: tabla() })),
    };
    TestBed.configureTestingModule({
      imports: [CarteraComponent],
      providers: [{ provide: CarteraService, useValue: servicioFalso }, ToastService, MessageService, PrimeNgMessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(CarteraComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores', () => {
    crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
  });

  it('onAsesorSeleccionado() carga las 2 tablas de la cartera del asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerCartera).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['tabla1']().body).toEqual([{ nom_cli: 'a' }]);
  });

  it('avisa con un toast si falla la carga de asesores', () => {
    servicioFalso.obtenerAsesores.mockReturnValue(throwError(() => new Error('falló')));
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    crear();
    expect(toastSpy).toHaveBeenCalled();
  });

  it('avisa con un toast si falla la carga de la cartera', () => {
    servicioFalso.obtenerCartera.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si ambas tablas vienen vacías', () => {
    servicioFalso.obtenerCartera.mockReturnValue(of({ tabla1: tabla(), tabla2: tabla() }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

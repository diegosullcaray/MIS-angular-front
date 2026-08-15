import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { CampanaAgilComponent } from './campana-agil.component';
import { CampanaAgilService } from '../../../services/campana-agil.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('CampanaAgilComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerCampanaAgil: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerCampanaAgil: vi.fn().mockReturnValue(of({ tabla1: tabla({ body: [{ nom_cli: 'a' }] }) })),
    };
    TestBed.configureTestingModule({
      imports: [CampanaAgilComponent],
      providers: [{ provide: CampanaAgilService, useValue: servicioFalso }, ToastService, MessageService, PrimeNgMessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(CampanaAgilComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores; la semana arranca en 1', () => {
    const fixture = crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
    expect(fixture.componentInstance['semana']()).toBe(1);
  });

  it('onAsesorSeleccionado() carga la tabla con la semana actual', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerCampanaAgil).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni }, 1);
    expect(fixture.componentInstance['tabla1']().body).toEqual([{ nom_cli: 'a' }]);
  });

  it('onSemanaSeleccionada() recarga la tabla si ya hay un asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);
    servicioFalso.obtenerCampanaAgil.mockClear();

    fixture.componentInstance['onSemanaSeleccionada'](3);

    expect(servicioFalso.obtenerCampanaAgil).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni }, 3);
  });

  it('onSemanaSeleccionada() no llama al servicio si todavía no hay asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onSemanaSeleccionada'](2);
    expect(servicioFalso.obtenerCampanaAgil).not.toHaveBeenCalled();
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerCampanaAgil.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si la tabla viene vacía', () => {
    servicioFalso.obtenerCampanaAgil.mockReturnValue(of({ tabla1: tabla() }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { ClientesNuevosRecurrentesComponent } from './clientes-nuevos-recurrentes.component';
import { ClientesNuevosRecurrentesService } from '../../services/clientes-nuevos-recurrentes.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('ClientesNuevosRecurrentesComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerClientesNuevosRecurrentes: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerClientesNuevosRecurrentes: vi.fn().mockReturnValue(of({ tabla1: tabla({ body: [{ nom_cli: 'a' }] }) })),
    };
    TestBed.configureTestingModule({
      imports: [ClientesNuevosRecurrentesComponent],
      providers: [
        { provide: ClientesNuevosRecurrentesService, useValue: servicioFalso },
        ToastService,
        MessageService,
        PrimeNgMessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(ClientesNuevosRecurrentesComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores', () => {
    crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
  });

  it('onAsesorSeleccionado() carga la tabla del asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerClientesNuevosRecurrentes).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['tabla1']().body).toEqual([{ nom_cli: 'a' }]);
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerClientesNuevosRecurrentes.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si la tabla viene vacía', () => {
    servicioFalso.obtenerClientesNuevosRecurrentes.mockReturnValue(of({ tabla1: tabla() }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

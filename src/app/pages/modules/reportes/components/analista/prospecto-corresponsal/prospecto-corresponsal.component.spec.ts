import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { ProspectoCorresponsalComponent } from './prospecto-corresponsal.component';
import { ProspectoCorresponsalService } from '../../../services/prospecto-corresponsal.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('ProspectoCorresponsalComponent', () => {
  let servicioFalso: {
    obtenerAsesores: ReturnType<typeof vi.fn>;
    obtenerProspectos: ReturnType<typeof vi.fn>;
    obtenerJerarquia: ReturnType<typeof vi.fn>;
    guardarProspecto: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerProspectos: vi.fn().mockReturnValue(of(tabla({ body: [{ nom_cli: 'a' }] }))),
      obtenerJerarquia: vi.fn().mockReturnValue(of([])),
      guardarProspecto: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [ProspectoCorresponsalComponent],
      providers: [
        { provide: ProspectoCorresponsalService, useValue: servicioFalso },
        ToastService,
        MessageService,
        PrimeNgMessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(ProspectoCorresponsalComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores', () => {
    crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
  });

  it('onAsesorSeleccionado() carga la lista de prospectos del asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerProspectos).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['tabla1']().body).toEqual([{ nom_cli: 'a' }]);
  });

  it('avisa con un toast si falla la carga de prospectos', () => {
    servicioFalso.obtenerProspectos.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si la lista de prospectos viene vacía', () => {
    servicioFalso.obtenerProspectos.mockReturnValue(of(tabla()));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });

  it('onProspectoGuardado() avisa con un toast de éxito y recarga la lista', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);
    servicioFalso.obtenerProspectos.mockClear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'exito');

    fixture.componentInstance['onProspectoGuardado']();

    expect(toastSpy).toHaveBeenCalled();
    expect(servicioFalso.obtenerProspectos).toHaveBeenCalled();
  });
});

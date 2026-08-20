import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { GruposPorVencerComponent } from './grupos-por-vencer.component';
import { GruposPorVencerService } from '../../services/grupos-por-vencer.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('GruposPorVencerComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerGruposPorVencer: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerGruposPorVencer: vi.fn().mockReturnValue(of({ tabla1: tabla({ body: [{ nom_cli: 'a' }] }) })),
    };
    TestBed.configureTestingModule({
      imports: [GruposPorVencerComponent],
      providers: [{ provide: GruposPorVencerService, useValue: servicioFalso }, ToastService, PrimeNgMessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(GruposPorVencerComponent);
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

    expect(servicioFalso.obtenerGruposPorVencer).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['tabla1']().body).toEqual([{ nom_cli: 'a' }]);
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerGruposPorVencer.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si la tabla viene vacía', () => {
    servicioFalso.obtenerGruposPorVencer.mockReturnValue(of({ tabla1: tabla() }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(ToastService), 'advertencia');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

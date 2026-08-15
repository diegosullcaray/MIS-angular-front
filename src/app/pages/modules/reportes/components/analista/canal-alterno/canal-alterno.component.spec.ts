import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { CanalAlternoComponent } from './canal-alterno.component';
import { CanalAlternoService } from '../../../services/canal-alterno.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('CanalAlternoComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerCanalAlterno: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerCanalAlterno: vi.fn().mockReturnValue(of({ tabla1: tabla({ body: [{ nom_cli: 'Juan' }, { nom_cli: 'María' }] }) })),
    };
    TestBed.configureTestingModule({
      imports: [CanalAlternoComponent],
      providers: [{ provide: CanalAlternoService, useValue: servicioFalso }, ToastService, MessageService, PrimeNgMessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(CanalAlternoComponent);
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

    expect(servicioFalso.obtenerCanalAlterno).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['tabla1']().body.length).toBe(2);
  });

  it('filasFiltradas() filtra localmente por el texto de búsqueda', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    fixture.componentInstance['busqueda'].set('juan');
    expect(fixture.componentInstance['filasFiltradas']()).toEqual([{ nom_cli: 'Juan' }]);
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerCanalAlterno.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si la tabla viene vacía', () => {
    servicioFalso.obtenerCanalAlterno.mockReturnValue(of({ tabla1: tabla() }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

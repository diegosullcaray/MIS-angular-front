import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { InversionStockMoraComponent } from './inversion-stock-mora.component';
import { InversionStockMoraService } from '../../../services/inversion-stock-mora.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { BloqueGrafico } from '../../../models/grafico-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };

const GRAFICO: BloqueGrafico = {
  titulo: 'Inversión',
  categorias: ['Ene', 'Feb'],
  series: [{ nombre: 'Real', datos: [1, 2] }],
};

describe('InversionStockMoraComponent', () => {
  let servicioFalso: { obtenerAsesores: ReturnType<typeof vi.fn>; obtenerGraficos: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerGraficos: vi.fn().mockReturnValue(of({ graficos: [GRAFICO] })),
    };
    TestBed.configureTestingModule({
      imports: [InversionStockMoraComponent],
      providers: [
        { provide: InversionStockMoraService, useValue: servicioFalso },
        ToastService,
        MessageService,
        PrimeNgMessageService,
      ],
    });
  });

  // No se llama fixture.detectChanges() después de elegir un asesor: dejaría que Angular
  // instancie <app-grafico-reporte> (Chart.js), que necesita un canvas 2D real —
  // jsdom no lo provee y no hay paquete `canvas` en el proyecto (mismo motivo por el
  // que `app-heatmap`, el otro consumidor de Chart.js, tampoco tiene spec). Alcanza con
  // verificar el estado de los signals: la lógica de carga es independiente del render.
  function crear() {
    const fixture = TestBed.createComponent(InversionStockMoraComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores', () => {
    crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
  });

  it('onAsesorSeleccionado() carga los gráficos del asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerGraficos).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['graficos']()).toEqual([GRAFICO]);
  });

  it('avisa con un toast si falla la carga', () => {
    servicioFalso.obtenerGraficos.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('muestra una advertencia si no hay gráficos', () => {
    servicioFalso.obtenerGraficos.mockReturnValue(of({ graficos: [] }));
    const fixture = crear();
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'warn');

    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(warnSpy).toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ControlCargasComponent } from './control-cargas.component';
import { ControlCargasService } from './control-cargas.service';
import { TABLA_VACIA } from '../../models/tabla-reporte.model';

describe('ControlCargasComponent', () => {
  let servicioSpy: { obtenerReporte: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = {
      obtenerReporte: vi.fn().mockReturnValue(
        of({
          produccion: TABLA_VACIA,
          procesos: TABLA_VACIA,
        })
      ),
    };

    TestBed.configureTestingModule({
      imports: [ControlCargasComponent],
      providers: [
        { provide: ControlCargasService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('se crea correctamente y carga el reporte inicial', () => {
    const fixture = TestBed.createComponent(ControlCargasComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
    expect(servicioSpy.obtenerReporte).toHaveBeenCalled();
  });

  it('refrescar() pide el reporte de inmediato sin esperar el intervalo', () => {
    const fixture = TestBed.createComponent(ControlCargasComponent);
    fixture.detectChanges();
    expect(servicioSpy.obtenerReporte).toHaveBeenCalledTimes(1);

    fixture.componentInstance['refrescar']();

    expect(servicioSpy.obtenerReporte).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });
});

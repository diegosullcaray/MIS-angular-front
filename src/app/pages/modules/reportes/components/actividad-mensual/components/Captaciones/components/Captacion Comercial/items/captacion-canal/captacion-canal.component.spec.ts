import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CaptacionCanalComercialComponent } from './captacion-canal.component';
import { ActividadMensualCraService } from '../../../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('CaptacionCanalComercialComponent', () => {
  let servicioSpy: { captacionCanalComercial: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { captacionCanalComercial: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [CaptacionCanalComercialComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(CaptacionCanalComercialComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a captacionCanalComercial con producto y fechaBase', () => {
    const fixture = TestBed.createComponent(CaptacionCanalComercialComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.captacionCanalComercial).toHaveBeenCalledWith(NODO, 'TODOS', expect.any(String));
  });

  it('al cambiar fechaBase debe volver a consultar captacionCanalComercial', () => {
    const fixture = TestBed.createComponent(CaptacionCanalComercialComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    servicioSpy.captacionCanalComercial.mockClear();

    fixture.componentInstance['fechaBase'].set('20260131');
    fixture.detectChanges();

    expect(servicioSpy.captacionCanalComercial).toHaveBeenCalledWith(NODO, 'TODOS', '20260131');
  });
});

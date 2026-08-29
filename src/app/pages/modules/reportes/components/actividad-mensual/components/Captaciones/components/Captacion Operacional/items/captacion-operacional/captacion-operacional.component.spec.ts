import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CaptacionOperacionalComponent } from './captacion-operacional.component';
import { ActividadMensualCraService } from '../../../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('CaptacionOperacionalComponent', () => {
  let servicioSpy: { captacionOperacional: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { captacionOperacional: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [CaptacionOperacionalComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(CaptacionOperacionalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a captacionOperacional con producto, segmento y fechaBase', () => {
    const fixture = TestBed.createComponent(CaptacionOperacionalComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.captacionOperacional).toHaveBeenCalledWith(
      NODO,
      'TODOS',
      'TODOS',
      expect.any(String),
    );
  });

  it('al cambiar fechaBase debe volver a consultar captacionOperacional', () => {
    const fixture = TestBed.createComponent(CaptacionOperacionalComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    servicioSpy.captacionOperacional.mockClear();

    fixture.componentInstance['fechaBase'].set('20260131');
    fixture.detectChanges();

    expect(servicioSpy.captacionOperacional).toHaveBeenCalledWith(
      NODO,
      'TODOS',
      'TODOS',
      '20260131',
    );
  });
});

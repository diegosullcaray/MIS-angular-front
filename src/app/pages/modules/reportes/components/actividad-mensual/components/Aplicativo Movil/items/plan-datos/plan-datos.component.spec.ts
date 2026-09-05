import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PlanDatosComponent } from './plan-datos.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('PlanDatosComponent', () => {
  let servicioSpy: { planDatos: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { planDatos: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [PlanDatosComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(PlanDatosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar al servicio planDatos con el nodo y fechaBase', () => {
    const fixture = TestBed.createComponent(PlanDatosComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.planDatos).toHaveBeenCalledWith(NODO, expect.any(String));
  });

  it('al cambiar fechaBase debe volver a consultar el servicio', () => {
    const fixture = TestBed.createComponent(PlanDatosComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    servicioSpy.planDatos.mockClear();

    fixture.componentInstance['fechaBase'].set('20260131');
    fixture.detectChanges();

    expect(servicioSpy.planDatos).toHaveBeenCalledWith(NODO, '20260131');
  });
});

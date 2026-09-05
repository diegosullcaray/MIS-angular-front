import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SeguimientoBpComponent } from './seguimiento-bp.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC', desc_rel: 'Financiera Confianza', lvl: 1 };

describe('SeguimientoBpComponent', () => {
  let servicioSpy: { seguimientoBp: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { seguimientoBp: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [SeguimientoBpComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(SeguimientoBpComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a seguimientoBp con producto y fechaBase', () => {
    const fixture = TestBed.createComponent(SeguimientoBpComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.seguimientoBp).toHaveBeenCalledWith(NODO, 'TODOS', expect.any(String));
  });

  it('al cambiar fechaBase debe volver a consultar seguimientoBp', () => {
    const fixture = TestBed.createComponent(SeguimientoBpComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    servicioSpy.seguimientoBp.mockClear();

    fixture.componentInstance['fechaBase'].set('20260131');
    fixture.detectChanges();

    expect(servicioSpy.seguimientoBp).toHaveBeenCalledWith(NODO, 'TODOS', '20260131');
  });
});

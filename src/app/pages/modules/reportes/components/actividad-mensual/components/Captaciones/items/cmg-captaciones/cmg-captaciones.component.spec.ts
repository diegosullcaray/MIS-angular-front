import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CmgCaptacionesComponent } from './cmg-captaciones.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Oficina 100', lvl: 1 };

describe('CmgCaptacionesComponent', () => {
  let servicioSpy: { cmgCaptaciones: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { cmgCaptaciones: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [CmgCaptacionesComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(CmgCaptacionesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a cmgCaptaciones con nodo y fechaBase', () => {
    const fixture = TestBed.createComponent(CmgCaptacionesComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.cmgCaptaciones).toHaveBeenCalledWith(NODO, expect.any(String));
  });

  it('al cambiar fechaBase debe volver a consultar cmgCaptaciones', () => {
    const fixture = TestBed.createComponent(CmgCaptacionesComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    servicioSpy.cmgCaptaciones.mockClear();

    fixture.componentInstance['fechaBase'].set('20260131');
    fixture.detectChanges();

    expect(servicioSpy.cmgCaptaciones).toHaveBeenCalledWith(NODO, '20260131');
  });
});

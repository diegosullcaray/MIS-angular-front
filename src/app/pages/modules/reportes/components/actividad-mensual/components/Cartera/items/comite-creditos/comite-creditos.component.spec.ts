import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ComiteCreditosComponent } from './comite-creditos.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('ComiteCreditosComponent', () => {
  let servicioSpy: { comiteCreditos: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { comiteCreditos: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [ComiteCreditosComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(ComiteCreditosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a comiteCreditos', () => {
    const fixture = TestBed.createComponent(ComiteCreditosComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.comiteCreditos).toHaveBeenCalledWith(
      { tip_cod: 1, cod_rel: '100' },
      expect.any(String),
    );
  });
});

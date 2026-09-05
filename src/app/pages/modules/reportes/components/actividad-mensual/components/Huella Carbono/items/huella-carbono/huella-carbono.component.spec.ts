import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { HuellaCarbonoComponent } from './huella-carbono.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 2, cod_rel: '200', desc_rel: 'Oficina 200', lvl: 1 };

describe('HuellaCarbonoComponent', () => {
  let servicioSpy: { huellaCarbono: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { huellaCarbono: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [HuellaCarbonoComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(HuellaCarbonoComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a huellaCarbono con cargaAmbiental y fechaBase', () => {
    const fixture = TestBed.createComponent(HuellaCarbonoComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.huellaCarbono).toHaveBeenCalledWith(NODO, 'TODOS', expect.any(String));
  });

  it('al cambiar fechaBase debe volver a consultar huellaCarbono', () => {
    const fixture = TestBed.createComponent(HuellaCarbonoComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    servicioSpy.huellaCarbono.mockClear();

    fixture.componentInstance['fechaBase'].set('20260131');
    fixture.detectChanges();

    expect(servicioSpy.huellaCarbono).toHaveBeenCalledWith(NODO, 'TODOS', '20260131');
  });
});

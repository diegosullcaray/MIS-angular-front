import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CmgCarteraMoraSinImpulsaComponent } from './cmg-cartera-mora-sin-impulsa.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('CmgCarteraMoraSinImpulsaComponent', () => {
  let servicioSpy: { cmgCarteraMoraSinImpulsa: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { cmgCarteraMoraSinImpulsa: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [CmgCarteraMoraSinImpulsaComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(CmgCarteraMoraSinImpulsaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a cmgCarteraMoraSinImpulsa', () => {
    const fixture = TestBed.createComponent(CmgCarteraMoraSinImpulsaComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.cmgCarteraMoraSinImpulsa).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
    );
  });
});

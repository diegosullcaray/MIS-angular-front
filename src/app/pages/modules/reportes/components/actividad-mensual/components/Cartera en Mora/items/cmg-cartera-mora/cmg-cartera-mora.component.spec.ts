import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CmgCarteraMoraComponent } from './cmg-cartera-mora.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('CmgCarteraMoraComponent', () => {
  let servicioSpy: { cmgCarteraMora: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { cmgCarteraMora: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [CmgCarteraMoraComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(CmgCarteraMoraComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a cmgCarteraMora', () => {
    const fixture = TestBed.createComponent(CmgCarteraMoraComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.cmgCarteraMora).toHaveBeenCalledWith(
      { tip_cod: 1, cod_rel: '100' },
      expect.any(String),
    );
  });
});

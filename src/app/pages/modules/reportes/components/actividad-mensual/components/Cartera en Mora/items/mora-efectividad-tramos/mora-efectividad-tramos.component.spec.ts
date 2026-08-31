import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MoraEfectividadTramosComponent } from './mora-efectividad-tramos.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { MORA_EFECTIVIDAD_TRAMOS_VACIO } from './models/mora-efectividad-tramos.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('MoraEfectividadTramosComponent', () => {
  let servicioSpy: { moraEfectividadTramos: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { moraEfectividadTramos: vi.fn().mockReturnValue(of(MORA_EFECTIVIDAD_TRAMOS_VACIO)) };

    TestBed.configureTestingModule({
      imports: [MoraEfectividadTramosComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(MoraEfectividadTramosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a moraEfectividadTramos', () => {
    const fixture = TestBed.createComponent(MoraEfectividadTramosComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.moraEfectividadTramos).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
    );
  });
});

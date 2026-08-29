import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { RankingKaypachaComercialComponent } from './comercial.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC', desc_rel: 'Financiera Confianza', lvl: 1 };

describe('RankingKaypachaComercialComponent', () => {
  let servicioSpy: { rankingKaypachaComercial: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { rankingKaypachaComercial: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [RankingKaypachaComercialComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(RankingKaypachaComercialComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a rankingKaypachaComercial', () => {
    const fixture = TestBed.createComponent(RankingKaypachaComercialComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.rankingKaypachaComercial).toHaveBeenCalledWith(
      { tip_cod: 9, cod_rel: 'FC' },
      expect.any(String),
    );
  });
});

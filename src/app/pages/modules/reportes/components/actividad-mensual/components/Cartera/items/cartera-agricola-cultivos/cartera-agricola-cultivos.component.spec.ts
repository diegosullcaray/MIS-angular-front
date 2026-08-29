import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CarteraAgricolaCultivosComponent } from './cartera-agricola-cultivos.component';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { CARTERA_AGRICOLA_VACIA } from '../../../../../actividad-diaria/components/Cartera/models/cartera-agricola.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('CarteraAgricolaCultivosComponent', () => {
  let servicioSpy: {
    periodos: ReturnType<typeof vi.fn>;
    carteraAgricola: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    servicioSpy = {
      periodos: vi.fn().mockReturnValue(of([{ id: '2026-08', desc: 'Agosto 2026' }])),
      carteraAgricola: vi.fn().mockReturnValue(of(CARTERA_AGRICOLA_VACIA)),
    };

    TestBed.configureTestingModule({
      imports: [CarteraAgricolaCultivosComponent],
      providers: [
        { provide: ActividadMensualRepoService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(CarteraAgricolaCultivosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a carteraAgricola', () => {
    const fixture = TestBed.createComponent(CarteraAgricolaCultivosComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.carteraAgricola).toHaveBeenCalledWith(
      { tip_cod: 1, cod_rel: '100' },
      '2026-08',
    );
  });
});

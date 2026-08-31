import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TableroDigitalComercialComponent } from './tablero-digital-comercial.component';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { TABLA_DINAMICA_VACIA } from '../../../../../../models/tabla-dinamica.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('TableroDigitalComercialComponent', () => {
  let servicioSpy: {
    periodos: ReturnType<typeof vi.fn>;
    tableroDigitalComercial: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    servicioSpy = {
      periodos: vi.fn().mockReturnValue(of([{ id: '2026-08', desc: 'Agosto 2026' }])),
      tableroDigitalComercial: vi.fn().mockReturnValue(of(TABLA_DINAMICA_VACIA)),
    };

    TestBed.configureTestingModule({
      imports: [TableroDigitalComercialComponent],
      providers: [
        { provide: ActividadMensualRepoService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(TableroDigitalComercialComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a tableroDigitalComercial', () => {
    const fixture = TestBed.createComponent(TableroDigitalComercialComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.tableroDigitalComercial).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
    );
  });
});

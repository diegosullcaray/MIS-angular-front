import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { EstructuraDesembolsosComponent } from './estructura-desembolsos.component';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { TABLA_DINAMICA_VACIA } from '../../../../../../models/tabla-dinamica.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('EstructuraDesembolsosComponent', () => {
  let servicioSpy: {
    estructuraDesembolsosMensual: ReturnType<typeof vi.fn>;
    periodos: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    servicioSpy = {
      estructuraDesembolsosMensual: vi.fn().mockReturnValue(of(TABLA_DINAMICA_VACIA)),
      periodos: vi.fn().mockReturnValue(of([{ id: '2026-08', label: '2026-08' }])),
    };

    TestBed.configureTestingModule({
      imports: [EstructuraDesembolsosComponent],
      providers: [
        { provide: ActividadMensualRepoService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(EstructuraDesembolsosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a estructuraDesembolsosMensual', () => {
    const fixture = TestBed.createComponent(EstructuraDesembolsosComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.estructuraDesembolsosMensual).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
    );
  });
});

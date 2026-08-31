import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CmgCarteraComponent } from './cmg-cartera.component';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { CMG_CARTERA_VACIO } from '../../../../../actividad-diaria/components/Cartera/models/cmg-cartera.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('CmgCarteraComponent', () => {
  let servicioSpy: {
    periodos: ReturnType<typeof vi.fn>;
    cmgCartera: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    servicioSpy = {
      periodos: vi.fn().mockReturnValue(of([{ id: '2026-08', desc: 'Agosto 2026' }])),
      cmgCartera: vi.fn().mockReturnValue(of(CMG_CARTERA_VACIO)),
    };

    TestBed.configureTestingModule({
      imports: [CmgCarteraComponent],
      providers: [
        { provide: ActividadMensualRepoService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(CmgCarteraComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a cmgCartera', () => {
    const fixture = TestBed.createComponent(CmgCarteraComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.cmgCartera).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      1,
      expect.any(String),
    );
  });
});

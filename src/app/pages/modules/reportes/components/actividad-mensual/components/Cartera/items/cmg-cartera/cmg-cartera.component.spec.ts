import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CmgCarteraComponent } from './cmg-cartera.component';
import { ActividadMensualRepoService } from '../../../../services/actividad-mensual-repo.service';
import { CMG_CARTERA_VACIO } from '../../../../../../models/cmg-cartera.model';
import type { CmgCarteraResultado } from '../../../../../../models/cmg-cartera.model';
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
      providers: [{ provide: ActividadMensualRepoService, useValue: servicioSpy }, MessageService],
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

  it('la pestaña de fase vuelve a consultar con esa fase', () => {
    const fixture = TestBed.createComponent(CmgCarteraComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();

    fixture.componentInstance['cambiarFase'](2);
    fixture.detectChanges();
    expect(servicioSpy.cmgCartera).toHaveBeenLastCalledWith(
      expect.anything(),
      2,
      expect.anything(),
    );
  });

  it('cancela la respuesta del periodo anterior', () => {
    const anterior = new Subject<CmgCarteraResultado>();
    const actual = new Subject<CmgCarteraResultado>();
    servicioSpy.cmgCartera.mockReturnValueOnce(anterior).mockReturnValueOnce(actual);
    const fixture = TestBed.createComponent(CmgCarteraComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    fixture.componentInstance['periodo'].set('2026-09');
    fixture.detectChanges();
    expect(anterior.observed).toBe(false);
    actual.next(CMG_CARTERA_VACIO);
    expect(fixture.componentInstance['reporte']()).toEqual(CMG_CARTERA_VACIO);
  });
});

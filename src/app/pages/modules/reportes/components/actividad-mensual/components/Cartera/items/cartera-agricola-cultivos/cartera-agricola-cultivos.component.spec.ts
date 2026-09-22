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
    detalleGraficosAgricola: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    servicioSpy = {
      periodos: vi.fn().mockReturnValue(of([{ id: '2026-08', desc: 'Agosto 2026' }])),
      carteraAgricola: vi.fn().mockReturnValue(of(CARTERA_AGRICOLA_VACIA)),
      detalleGraficosAgricola: vi.fn().mockReturnValue(of({ graficos: [], filasPorGrafico: {} })),
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
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
    );
  });

  it('debe resaltar toda la fila del nodo activo', () => {
    const fixture = TestBed.createComponent(CarteraAgricolaCultivosComponent);
    fixture.componentInstance['nivelActual'].set(NODO);

    expect(fixture.componentInstance['destacarNodoActivo']({ htipcod: 1, cod_rel: '100' })).toBe(true);
    expect(fixture.componentInstance['destacarNodoActivo']({ htipcod: 1, cod_rel: '200' })).toBe(false);
  });

  it('debe volver al nivel elegido desde el breadcrumb', () => {
    const fixture = TestBed.createComponent(CarteraAgricolaCultivosComponent);
    const component = fixture.componentInstance;
    const raiz = NODO;
    const hijo: HierarquiaNodo = { tip_cod: 18, cod_rel: '200', desc_rel: 'Asesor 200', lvl: 2 };
    component['rutaJerarquica'].set([raiz, hijo]);
    component['nivelActual'].set(hijo);

    component['volverANivel'](0);

    expect(component['rutaJerarquica']()).toEqual([raiz]);
    expect(component['nivelActual']()).toEqual(raiz);
  });
});

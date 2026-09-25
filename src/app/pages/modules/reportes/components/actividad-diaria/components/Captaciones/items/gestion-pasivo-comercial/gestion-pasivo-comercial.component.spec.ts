import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { GestionPasivoComercialComponent } from './gestion-pasivo-comercial.component';
import { GestionPasivoComercialService } from '../../services/gestion-pasivo-comercial.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };


describe('GestionPasivoComercialComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      obtener: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [GestionPasivoComercialComponent],
      providers: [
        MessageService,
        {
      provide: ToastService,
      useValue: {
        error: vi.fn(),
        exito: vi.fn(),
        advertencia: vi.fn(),
        info: vi.fn(),
      },
    },
        { provide: GestionPasivoComercialService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(GestionPasivoComercialComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('drill down', () => {
    const TOTAL = { htipcod: 9, cod_rel: 'FC', descripcion: 'Total', style: 1 };
    const HIJA = { htipcod: 18, cod_rel: 'AG-1', descripcion: 'Agencia Centro' };

    function conFilas(filas: Record<string, unknown>[]) {
      const fixture = TestBed.createComponent(GestionPasivoComercialComponent);
      const cmp = fixture.componentInstance;
      cmp['nivelActual'].set(NODO);
      cmp['tabla'].set({ columnas: [], filas });
      return cmp;
    }

    it('vuelve clicable la descripción solo si alguna fila trae un nodo hijo', () => {
      expect(conFilas([TOTAL, HIJA])['columnasDrillDown']()).toEqual(['descripcion']);
      // La fila de totales es el nivel actual: sola, no ofrece drill.
      expect(conFilas([TOTAL])['columnasDrillDown']()).toEqual([]);
      expect(conFilas([{ descripcion: 'Sin nodo' }])['columnasDrillDown']()).toEqual([]);
    });

    it('al hacer clic en la descripción de una fila baja a su nivel', () => {
      const cmp = conFilas([TOTAL, HIJA]);
      cmp['onCeldaSeleccionada']({ clave: 'descripcion', fila: HIJA });

      expect(servicioSpy['obtener']).toHaveBeenCalledWith({ tip_cod: 18, cod_rel: 'AG-1' });
      expect(cmp['nivelActual']()).toMatchObject({ tip_cod: 18, cod_rel: 'AG-1' });
    });

    it('ignora la fila de totales y las otras columnas', () => {
      const cmp = conFilas([TOTAL, HIJA]);
      cmp['onCeldaSeleccionada']({ clave: 'descripcion', fila: TOTAL });
      cmp['onCeldaSeleccionada']({ clave: 'CAP_4', fila: HIJA });

      expect(servicioSpy['obtener']).not.toHaveBeenCalled();
    });
  });

});

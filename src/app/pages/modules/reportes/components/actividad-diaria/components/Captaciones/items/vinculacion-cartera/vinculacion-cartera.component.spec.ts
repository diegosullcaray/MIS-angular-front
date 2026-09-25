import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { VinculacionCarteraComponent } from './vinculacion-cartera.component';
import { VinculacionCarteraService } from '../../services/vinculacion-cartera.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };


describe('VinculacionCarteraComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      obtener: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [VinculacionCarteraComponent],
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
        { provide: VinculacionCarteraService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(VinculacionCarteraComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  describe('drill down', () => {
    const COLUMNAS = [{ key: 'DESUNI', label: 'Descripción' }, { key: 'SALDO', label: 'Saldo' }];
    const TOTAL = { htipcod: 9, cod_rel: 'FC', DESUNI: 'Financiera', style: 1 };
    const HIJA = { htipcod: 18, cod_rel: 'AG-1', DESUNI: 'Agencia Centro' };

    function conFilas(filas: Record<string, unknown>[]) {
      const cmp = TestBed.createComponent(VinculacionCarteraComponent).componentInstance;
      cmp['nivelActual'].set(NODO);
      cmp['rutaJerarquica'].set([{ ...NODO, des_rel: 'Financiera' }]);
      cmp['tabla'].set({ columnas: COLUMNAS, filas });
      return cmp;
    }

    it('la primera columna es clicable solo si alguna fila trae un nodo hijo', () => {
      expect(conFilas([TOTAL, HIJA])['columnasDrillDown']()).toEqual(['DESUNI']);
      expect(conFilas([TOTAL])['columnasDrillDown']()).toEqual([]);
    });

    it('al hacer clic en la descripción baja a ese nivel y lo suma a las migas', () => {
      const cmp = conFilas([TOTAL, HIJA]);
      cmp['onCeldaSeleccionada']({ clave: 'DESUNI', fila: HIJA });

      expect(servicioSpy['obtener']).toHaveBeenCalledWith({ tip_cod: 18, cod_rel: 'AG-1' });
      expect(cmp['rutaJerarquica']().map((n) => n.des_rel)).toEqual(['Financiera', 'Agencia Centro']);
    });

    it('ignora la fila de totales y las otras columnas', () => {
      const cmp = conFilas([TOTAL, HIJA]);
      cmp['onCeldaSeleccionada']({ clave: 'DESUNI', fila: TOTAL });
      cmp['onCeldaSeleccionada']({ clave: 'SALDO', fila: HIJA });
      expect(servicioSpy['obtener']).not.toHaveBeenCalled();
    });

    it('si las filas no traen su nodo, baja por nombre con las opciones del selector oculto', () => {
      const agencia: HierarquiaNodo = { tip_cod: 18, cod_rel: 'AG-1', desc_rel: 'Agencia Centro' };
      const selector = {
        opcionPorDescripcion: vi.fn((texto: string) => (texto === 'Agencia Centro' ? agencia : null)),
        seleccionarNodo: vi.fn(() => true),
      };
      const cmp = conFilas([{ DESUNI: 'Financiera', style: 1 }, { DESUNI: 'Agencia Centro' }]);
      Object.defineProperty(cmp, 'selectorJerarquia', { value: () => selector });

      expect(cmp['columnasDrillDown']()).toEqual(['DESUNI']);
      cmp['onCeldaSeleccionada']({ clave: 'DESUNI', fila: { DESUNI: 'Agencia Centro' } });
      expect(selector.seleccionarNodo).toHaveBeenCalledWith(agencia);
    });

    it('una miga vuelve a ese nivel y recorta la ruta', () => {
      const cmp = conFilas([TOTAL, HIJA]);
      cmp['onCeldaSeleccionada']({ clave: 'DESUNI', fila: HIJA });
      servicioSpy['obtener'].mockClear();

      cmp['volverANivel'](0);
      expect(servicioSpy['obtener']).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC' });
      expect(cmp['rutaJerarquica']().length).toBe(1);
    });
  });

});

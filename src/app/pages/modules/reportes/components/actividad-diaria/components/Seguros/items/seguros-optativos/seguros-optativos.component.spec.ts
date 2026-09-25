import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { SegurosOptativosComponent } from './seguros-optativos.component';
import { SegurosService } from '../../services/seguros.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };


describe('SegurosOptativosComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      periodosSegurosOptativos: vi.fn().mockReturnValue(of([])),
      segurosOptativos: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [SegurosOptativosComponent],
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
        { provide: SegurosService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(SegurosOptativosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  /** Drill down del legado (`ddHier` sobre `RNOMSUB`, `changeHier` sobre `hierBuffer`). */
  describe('drill down', () => {
    const TOTAL = { RNOMSUB: 'Financiera Confianza', htipcod: 9, hcodrel: 'FC', style: 1 };
    const TERRITORIO = { RNOMSUB: 'Territorio Norte', htipcod: 20, hcodrel: 'T1', style: 0 };
    const SIN_NIVEL = { RNOMSUB: 'Otros', htipcod: 999, hcodrel: 'X' };

    type Instancia = {
      onNivelSeleccionado(n: HierarquiaNodo): void;
      onRutaSeleccionada(r: HierarquiaNodo[]): void;
      onCeldaSeleccionada(e: { clave: string; fila: Record<string, unknown> }): void;
      volverANivel(i: number): void;
      columnasDrillDown(): string[];
      rutaJerarquica(): HierarquiaNodo[];
    };

    function crearCon(filas: Record<string, unknown>[]) {
      servicioSpy['segurosOptativos'].mockReturnValue(of({ columnas: [{ key: 'RNOMSUB', label: 'Descripción' }], filas }));
      const fixture = TestBed.createComponent(SegurosOptativosComponent);
      const inst = fixture.componentInstance as unknown as Instancia;
      inst.onRutaSeleccionada([NODO]);
      inst.onNivelSeleccionado(NODO);
      TestBed.tick();
      return inst;
    }

    it('RNOMSUB es clicable solo si alguna fila baja de nivel', () => {
      expect(crearCon([TOTAL, TERRITORIO]).columnasDrillDown()).toEqual(['RNOMSUB']);
      expect(crearCon([TOTAL, SIN_NIVEL]).columnasDrillDown()).toEqual([]);
    });

    it('clic en RNOMSUB baja con htipcod/hcodrel y lo suma a las migas; otras columnas no bajan', () => {
      const inst = crearCon([TOTAL, TERRITORIO]);
      servicioSpy['segurosOptativos'].mockClear();

      inst.onCeldaSeleccionada({ clave: 'OTRA', fila: TERRITORIO });
      inst.onCeldaSeleccionada({ clave: 'RNOMSUB', fila: TOTAL });
      TestBed.tick();
      expect(servicioSpy['segurosOptativos']).not.toHaveBeenCalled();

      inst.onCeldaSeleccionada({ clave: 'RNOMSUB', fila: TERRITORIO });
      TestBed.tick();
      expect(servicioSpy['segurosOptativos']).toHaveBeenLastCalledWith({ tip_cod: 20, cod_rel: 'T1' }, undefined);
      expect(inst.rutaJerarquica().map((n) => n.cod_rel)).toEqual(['FC', 'T1']);
    });

    it('una miga vuelve a ese nivel y recorta la ruta', () => {
      const inst = crearCon([TOTAL, TERRITORIO]);
      inst.onCeldaSeleccionada({ clave: 'RNOMSUB', fila: TERRITORIO });
      TestBed.tick();
      inst.volverANivel(0);
      TestBed.tick();

      expect(servicioSpy['segurosOptativos']).toHaveBeenLastCalledWith({ tip_cod: 9, cod_rel: 'FC' }, undefined);
      expect(inst.rutaJerarquica().map((n) => n.cod_rel)).toEqual(['FC']);
    });
  });
});


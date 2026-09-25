import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { BancaSolidariaComponent } from './banca-solidaria.component';
import { ReportesPdmService } from '../../services/reportes-pdm.service';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { BANCA_SOLIDARIA_VACIA } from '../../models/banca-solidaria.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };


describe('BancaSolidariaComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      bancaSolidaria: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [BancaSolidariaComponent],
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
        { provide: ReportesPdmService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(BancaSolidariaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  /** Drill down del legado (`ddHier` sobre `descripcion`, `changeHier` sobre `hierBuffer`). */
  describe('drill down', () => {
    const TOTAL = { descripcion: 'Financiera Confianza', htipcod: 9, hcodrel: 'FC', style: 1 };
    const TERRITORIO = { descripcion: 'Territorio Norte', htipcod: 20, hcodrel: 'T1', style: 0 };

    type Instancia = {
      onNivelSeleccionado(n: HierarquiaNodo): void;
      onRutaSeleccionada(r: HierarquiaNodo[]): void;
      onCeldaSeleccionada(e: { clave: string; fila: Record<string, unknown> }): void;
      volverANivel(i: number): void;
      columnasDrillDown(): string[];
      rutaJerarquica(): HierarquiaNodo[];
    };

    function crearCon(filas: Record<string, unknown>[]) {
      servicioSpy['bancaSolidaria'].mockReturnValue(
        of({ ...BANCA_SOLIDARIA_VACIA, tabla: { columnas: [{ key: 'descripcion', label: 'Descripción' }], filas } }),
      );
      const fixture = TestBed.createComponent(BancaSolidariaComponent);
      const inst = fixture.componentInstance as unknown as Instancia;
      inst.onRutaSeleccionada([NODO]);
      inst.onNivelSeleccionado(NODO);
      TestBed.tick();
      return inst;
    }

    it('la descripción es clicable solo si alguna fila baja de nivel', () => {
      expect(crearCon([TOTAL, TERRITORIO]).columnasDrillDown()).toEqual(['descripcion']);
      expect(crearCon([TOTAL]).columnasDrillDown()).toEqual([]);
    });

    it('clic en la descripción baja con htipcod/hcodrel; el total y otras columnas no bajan', () => {
      const inst = crearCon([TOTAL, TERRITORIO]);
      servicioSpy['bancaSolidaria'].mockClear();

      inst.onCeldaSeleccionada({ clave: 'saldo', fila: TERRITORIO });
      inst.onCeldaSeleccionada({ clave: 'descripcion', fila: TOTAL });
      TestBed.tick();
      expect(servicioSpy['bancaSolidaria']).not.toHaveBeenCalled();

      inst.onCeldaSeleccionada({ clave: 'descripcion', fila: TERRITORIO });
      TestBed.tick();
      expect(servicioSpy['bancaSolidaria']).toHaveBeenLastCalledWith({ tip_cod: 20, cod_rel: 'T1' });
      expect(inst.rutaJerarquica().map((n) => n.cod_rel)).toEqual(['FC', 'T1']);
    });

    it('una miga vuelve a ese nivel y recorta la ruta', () => {
      const inst = crearCon([TOTAL, TERRITORIO]);
      inst.onCeldaSeleccionada({ clave: 'descripcion', fila: TERRITORIO });
      TestBed.tick();
      inst.volverANivel(0);
      TestBed.tick();

      expect(servicioSpy['bancaSolidaria']).toHaveBeenLastCalledWith({ tip_cod: 9, cod_rel: 'FC' });
      expect(inst.rutaJerarquica().map((n) => n.cod_rel)).toEqual(['FC']);
    });
  });
});


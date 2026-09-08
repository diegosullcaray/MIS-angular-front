import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReporteSimpleComponent } from './reporte-simple.component';
import { ModSysAdminService } from '../../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { TABLA_VACIA } from '../../models/tabla-reporte.model';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models/jerarquia.model';

const PARAMS: ParamsJerarquia = { code: 9, maxLvl: 2, dlgTitulo: 'JERARQUIA' };
const RAIZ: HierarquiaNodo = { tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 };

describe('ReporteSimpleComponent', () => {
  beforeEach(() => {
    const antAdmin = {
      getBaseHierarchy: vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { base_hierarchy: [RAIZ] } })),
      getLevelHierarchy: vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { level_hierarchy: [RAIZ] } })),
    };

    TestBed.configureTestingModule({
      imports: [ReporteSimpleComponent],
      providers: [
        { provide: ModSysAdminService, useValue: antAdmin },
        ShellStateService,
      ],
    });
  });

  it('muestra el estado vacío cuando nivel es null', () => {
    const fixture = TestBed.createComponent(ReporteSimpleComponent);
    fixture.componentRef.setInput('titulo', 'Reporte Prueba');
    fixture.componentRef.setInput('paramsHier', PARAMS);
    fixture.componentRef.setInput('nivel', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Elige un nivel');
  });

  it('muestra la tabla cuando se proporciona un nivel', () => {
    const fixture = TestBed.createComponent(ReporteSimpleComponent);
    fixture.componentRef.setInput('titulo', 'Reporte Prueba');
    fixture.componentRef.setInput('paramsHier', PARAMS);
    fixture.componentRef.setInput('nivel', RAIZ);
    fixture.componentRef.setInput('tabla', TABLA_VACIA);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Elige un nivel');
  });

  describe('actualizar', () => {
    function crear(nivel: HierarquiaNodo | null) {
      const fixture = TestBed.createComponent(ReporteSimpleComponent);
      fixture.componentRef.setInput('titulo', 'Reporte Prueba');
      fixture.componentRef.setInput('paramsHier', PARAMS);
      fixture.componentRef.setInput('nivel', nivel);
      fixture.componentRef.setInput('tabla', TABLA_VACIA);
      fixture.detectChanges();
      return fixture;
    }

    function boton(fixture: ReturnType<typeof crear>): HTMLElement | null {
      return fixture.nativeElement.querySelector('.mis-window-btn--esquina');
    }

    // Sin nivel no hay nada que volver a pedir: el botón no se ofrece.
    it('el botón no aparece mientras no haya nivel elegido', () => {
      expect(boton(crear(null))).toBeNull();
    });

    it('con nivel elegido, actualizar reemite el nodo para reconsultar', () => {
      const fixture = crear(RAIZ);
      const emitido = vi.fn();
      fixture.componentInstance.nivelSeleccionado.subscribe(emitido);

      boton(fixture)!.click();

      expect(emitido).toHaveBeenCalledWith(RAIZ);
    });

    /**
     * Se emite una copia, no la misma referencia: las pantallas que consultan
     * dentro de un `effect` sobre `nivelActual` no reaccionarían si la señal
     * recibiera el mismo objeto.
     */
    it('reemite una copia del nodo, no la misma referencia', () => {
      const fixture = crear(RAIZ);
      const emitido = vi.fn();
      fixture.componentInstance.nivelSeleccionado.subscribe(emitido);

      boton(fixture)!.click();

      expect(emitido.mock.calls[0][0]).not.toBe(RAIZ);
    });

    it('mientras carga, el botón queda bloqueado', () => {
      const fixture = crear(RAIZ);
      fixture.componentRef.setInput('cargando', true);
      fixture.detectChanges();
      const emitido = vi.fn();
      fixture.componentInstance.nivelSeleccionado.subscribe(emitido);

      boton(fixture)!.click();

      expect(emitido).not.toHaveBeenCalled();
    });
  });
});

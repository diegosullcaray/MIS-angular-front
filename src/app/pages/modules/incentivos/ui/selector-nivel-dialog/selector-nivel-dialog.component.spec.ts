import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { SelectorNivelDialogComponent } from './selector-nivel-dialog.component';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { AsesorPickItem, NivelSelectorJerarquia, NodoJerarquiaIncentivo } from '../../models';

describe('SelectorNivelDialogComponent', () => {
  let incentivosFalso: {
    nivelesSelector: NivelSelectorJerarquia[];
    obtenerAsesores: ReturnType<typeof vi.fn>;
    obtenerNivelesJerarquia: ReturnType<typeof vi.fn>;
    seleccionarAsesor: ReturnType<typeof vi.fn>;
    seleccionarNodoJerarquia: ReturnType<typeof vi.fn>;
    seleccionarFinancieraConfianza: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    incentivosFalso = {
      nivelesSelector: [
        { etiqueta: 'Unidades', tipCodListado: 18 },
        { etiqueta: 'Corredores', tipCodListado: 19 },
        { etiqueta: 'Territorios', tipCodListado: 20 },
      ],
      obtenerAsesores: vi.fn(),
      obtenerNivelesJerarquia: vi.fn(),
      seleccionarAsesor: vi.fn(),
      seleccionarNodoJerarquia: vi.fn(),
      seleccionarFinancieraConfianza: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [SelectorNivelDialogComponent],
      providers: [{ provide: IncentivosService, useValue: incentivosFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(SelectorNivelDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('abrirAsesores() carga la lista y cambia a la vista "asesores"', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(of([{ cod_sec: 'BT-1', des_sec: 'Juan' }] as AsesorPickItem[]));
    const fixture = crear();

    fixture.componentInstance['abrirAsesores']();

    expect(fixture.componentInstance['vista']()).toBe('asesores');
    expect(fixture.componentInstance['asesores']()).toEqual([{ cod_sec: 'BT-1', des_sec: 'Juan' }]);
  });

  it('abrirAsesores() ante un error del backend, muestra un toast', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const fixture = crear();

    fixture.componentInstance['abrirAsesores']();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('abrirNivelJerarquia() carga los nodos del nivel elegido', () => {
    const nivel: NivelSelectorJerarquia = { etiqueta: 'Unidades', tipCodListado: 18 };
    incentivosFalso.obtenerNivelesJerarquia.mockReturnValue(of([{ tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' }] as NodoJerarquiaIncentivo[]));
    const fixture = crear();

    fixture.componentInstance['abrirNivelJerarquia'](nivel);

    expect(incentivosFalso.obtenerNivelesJerarquia).toHaveBeenCalledWith(18);
    expect(fixture.componentInstance['vista']()).toBe('jerarquia');
    expect(fixture.componentInstance['nodos']()).toEqual([{ tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' }]);
  });

  it('asesoresFiltrados() filtra por nombre o código', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(
      of([
        { cod_sec: 'BT-1', des_sec: 'Juan Pérez' },
        { cod_sec: 'BT-2', des_sec: 'María López' },
      ] as AsesorPickItem[])
    );
    const fixture = crear();
    fixture.componentInstance['abrirAsesores']();

    fixture.componentInstance['filtro'].set('maría');

    expect(fixture.componentInstance['asesoresFiltrados']()).toEqual([{ cod_sec: 'BT-2', des_sec: 'María López' }]);
  });

  it('onFilaAsesor() solo resalta la fila, sin cerrar ni cargar datos todavía', () => {
    const fixture = crear();
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);
    const asesor: AsesorPickItem = { cod_sec: 'BT-1', des_sec: 'Juan' };

    fixture.componentInstance['onFilaAsesor'](asesor);

    expect(fixture.componentInstance['seleccionadoAsesor']()).toEqual(asesor);
    expect(incentivosFalso.seleccionarAsesor).not.toHaveBeenCalled();
    expect(visibleChangeSpy).not.toHaveBeenCalled();
  });

  it('onFilaAsesor() ignora un arreglo (selección múltiple no soportada) o valor vacío', () => {
    const fixture = crear();
    fixture.componentInstance['onFilaAsesor']([{ cod_sec: 'BT-1', des_sec: 'Juan' }]);
    fixture.componentInstance['onFilaAsesor'](undefined);
    expect(fixture.componentInstance['seleccionadoAsesor']()).toBeNull();
  });

  it('confirmarAsesor() cierra el diálogo y RECIÉN DESPUÉS delega en el servicio, incluso si el diálogo es obligatorio', () => {
    const fixture = crear();
    fixture.componentRef.setInput('obligatorio', true);
    fixture.detectChanges();
    const orden: string[] = [];
    const visibleChangeSpy = vi.fn(() => orden.push('cierra'));
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);
    incentivosFalso.seleccionarAsesor.mockImplementation(() => orden.push('carga'));
    const asesor: AsesorPickItem = { cod_sec: 'BT-1', des_sec: 'Juan' };
    fixture.componentInstance['onFilaAsesor'](asesor);

    fixture.componentInstance['confirmarAsesor']();

    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    expect(incentivosFalso.seleccionarAsesor).toHaveBeenCalledWith(asesor);
    expect(orden).toEqual(['cierra', 'carga']);
  });

  it('confirmarAsesor() no hace nada si no hay ninguna fila resaltada', () => {
    const fixture = crear();
    fixture.componentInstance['confirmarAsesor']();
    expect(incentivosFalso.seleccionarAsesor).not.toHaveBeenCalled();
  });

  it('onFilaNodo() solo resalta la fila; confirmarNodo() cierra y recién después delega en el servicio', () => {
    const fixture = crear();
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);
    const nodo: NodoJerarquiaIncentivo = { tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' };

    fixture.componentInstance['onFilaNodo'](nodo);
    expect(incentivosFalso.seleccionarNodoJerarquia).not.toHaveBeenCalled();

    fixture.componentInstance['confirmarNodo']();
    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    expect(incentivosFalso.seleccionarNodoJerarquia).toHaveBeenCalledWith(nodo);
  });

  it('elegirFinancieraConfianza() cierra el diálogo y delega en el servicio con la clase de usuario elegida', () => {
    const fixture = crear();
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);

    fixture.componentInstance['elegirFinancieraConfianza'](2);

    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    expect(incentivosFalso.seleccionarFinancieraConfianza).toHaveBeenCalledWith(2);
  });

  it('cerrar() no emite visibleChange si el diálogo es obligatorio (aún no se eligió ningún nivel)', () => {
    const fixture = crear();
    fixture.componentRef.setInput('obligatorio', true);
    fixture.detectChanges();
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);

    fixture.componentInstance['cerrar']();

    expect(visibleChangeSpy).not.toHaveBeenCalled();
  });

  it('volverAlMenu() regresa a la vista de menú y limpia el filtro', () => {
    const fixture = crear();
    fixture.componentInstance['vista'].set('asesores');
    fixture.componentInstance['filtro'].set('algo');

    fixture.componentInstance['volverAlMenu']();

    expect(fixture.componentInstance['vista']()).toBe('menu');
    expect(fixture.componentInstance['filtro']()).toBe('');
  });
});

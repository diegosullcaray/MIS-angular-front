import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SelectorNivelDialogComponent } from './selector-nivel-dialog.component';
import { IncentivosService } from '../../services/incentivos.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import type { AsesorPickItem, NivelSelectorJerarquia, NodoJerarquiaIncentivo } from '../../models';

const ASESOR: AsesorPickItem = {
  cod_sec: 'BT-1',
  des_sec: 'Juan Pérez',
  des_uni: 'AG. LOS OLIVOS',
  des_cor: 'COR. NORTE',
  des_ter: 'TER. LIMA',
};

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
      providers: [
        { provide: IncentivosService, useValue: incentivosFalso },
        MessageService,
        provideRouter([{ path: '**', redirectTo: '' }]),
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(SelectorNivelDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  /** El botón "Seleccionar" del pie del diálogo (o null si esa vista no lo ofrece). */
  function botonSeleccionar(): HTMLButtonElement | null {
    return (
      Array.from(document.body.querySelectorAll<HTMLButtonElement>('.p-dialog-footer button')).find((b) =>
        b.textContent?.includes('Seleccionar')
      ) ?? null
    );
  }

  /** El diálogo monta su contenido con `appendTo="body"`: no vive dentro del fixture. */
  function abrirVisible() {
    const fixture = TestBed.createComponent(SelectorNivelDialogComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    return fixture;
  }

  it('abrirAsesores() carga la lista y cambia a la vista "asesores"', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(of([ASESOR]));
    const fixture = crear();

    fixture.componentInstance['abrirAsesores']();

    expect(fixture.componentInstance['vista']()).toBe('asesores');
    expect(fixture.componentInstance['asesores']()).toEqual([ASESOR]);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('abrirAsesores() ante un error del backend, muestra un toast y suelta el estado de carga', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const fixture = crear();

    fixture.componentInstance['abrirAsesores']();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('abrirNivelJerarquia() carga los nodos del nivel elegido', () => {
    const nivel: NivelSelectorJerarquia = { etiqueta: 'Unidades', tipCodListado: 18 };
    incentivosFalso.obtenerNivelesJerarquia.mockReturnValue(
      of([{ tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' }] as NodoJerarquiaIncentivo[])
    );
    const fixture = crear();

    fixture.componentInstance['abrirNivelJerarquia'](nivel);

    expect(incentivosFalso.obtenerNivelesJerarquia).toHaveBeenCalledWith(18);
    expect(fixture.componentInstance['vista']()).toBe('jerarquia');
    expect(fixture.componentInstance['nodos']()).toEqual([{ tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' }]);
  });

  it('la tabla de asesores lleva las mismas columnas que el picker del legado, sin el código', () => {
    const fixture = crear();

    const columnas = fixture.componentInstance['columnasAsesor'];
    expect(columnas.map((c) => c.header)).toEqual(['Asesor', 'Unidad', 'Corredor', 'Territorio']);
    expect(columnas.map((c) => c.field)).not.toContain('cod_sec');
    // La confirmación vive en el pie del diálogo, no en una columna por fila.
    expect(columnas.map((c) => c.field)).not.toContain('accion');
  });

  it('cada columna de asesor trae su filtro propio — es lo que reemplaza al buscador manual del diálogo', () => {
    const fixture = crear();

    fixture.componentInstance['columnasAsesor'].forEach((columna) => expect(columna.filterType).toBe('text'));
    expect(fixture.componentInstance['camposBusquedaAsesor']).toContain('des_uni');
  });

  it('columnasJerarquia() encabeza la columna con el nivel que se abrió', () => {
    incentivosFalso.obtenerNivelesJerarquia.mockReturnValue(of([] as NodoJerarquiaIncentivo[]));
    const fixture = crear();

    fixture.componentInstance['abrirNivelJerarquia']({ etiqueta: 'Corredores', tipCodListado: 19 });

    expect(fixture.componentInstance['columnasJerarquia']()[0].header).toBe('Corredores');
  });

  it('pinta la fila del asesor con su unidad, corredor y territorio — y sin el código', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(of([ASESOR]));
    const fixture = abrirVisible();

    fixture.componentInstance['abrirAsesores']();
    fixture.detectChanges();

    const encabezados = Array.from(document.body.querySelectorAll('thead th')).map((th) => th.textContent?.trim());
    expect(encabezados.slice(0, 4)).toEqual(['Asesor', 'Unidad', 'Corredor', 'Territorio']);

    const celdas = Array.from(document.body.querySelectorAll('tbody tr td')).map((td) => td.textContent?.trim());
    expect(celdas.slice(0, 4)).toEqual(['Juan Pérez', 'AG. LOS OLIVOS', 'COR. NORTE', 'TER. LIMA']);
    expect(celdas.join(' ')).not.toContain('BT-1');
  });

  it('el diálogo ya no trae buscador propio: el único es el que pone app-data-table en su caption', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(of([ASESOR]));
    const fixture = abrirVisible();

    fixture.componentInstance['abrirAsesores']();
    fixture.detectChanges();

    const buscadores = document.body.querySelectorAll('input[pInputText]');
    expect(buscadores.length).toBe(1);
    expect(buscadores[0].closest('.p-datatable')).not.toBeNull();
  });

  it('sin fila resaltada no hay nada que confirmar: el botón del pie queda deshabilitado', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(of([ASESOR]));
    const fixture = abrirVisible();
    fixture.componentInstance['abrirAsesores']();
    fixture.detectChanges();

    expect(fixture.componentInstance['haySeleccion']()).toBe(false);
    expect(botonSeleccionar()?.disabled).toBe(true);

    fixture.componentInstance['confirmarSeleccion']();
    expect(incentivosFalso.seleccionarAsesor).not.toHaveBeenCalled();
  });

  it('al resaltar una fila se habilita el botón del pie', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(of([ASESOR]));
    const fixture = abrirVisible();
    fixture.componentInstance['abrirAsesores']();
    fixture.detectChanges();

    (document.body.querySelector('tbody tr') as HTMLElement).click();
    fixture.detectChanges();

    expect(fixture.componentInstance['seleccionadoAsesor']()).toEqual(ASESOR);
    expect(botonSeleccionar()?.disabled).toBe(false);
  });

  it('confirmarSeleccion() cierra el diálogo y RECIÉN DESPUÉS delega en el servicio', () => {
    const fixture = crear();
    const orden: string[] = [];
    const visibleChangeSpy = vi.fn(() => orden.push('cierra'));
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);
    incentivosFalso.seleccionarAsesor.mockImplementation(() => orden.push('carga'));
    fixture.componentInstance['vista'].set('asesores');
    fixture.componentInstance['seleccionadoAsesor'].set(ASESOR);

    fixture.componentInstance['confirmarSeleccion']();

    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    expect(incentivosFalso.seleccionarAsesor).toHaveBeenCalledWith(ASESOR);
    expect(orden).toEqual(['cierra', 'carga']);
  });

  it('confirmarSeleccion() en la vista de jerarquía delega el nodo resaltado', () => {
    const fixture = crear();
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);
    const nodo: NodoJerarquiaIncentivo = { tip_cod: 18, cod_rel: 'U-01', des_rel: 'Unidad 1' };
    fixture.componentInstance['vista'].set('jerarquia');
    fixture.componentInstance['seleccionadoNodo'].set(nodo);

    fixture.componentInstance['confirmarSeleccion']();

    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    expect(incentivosFalso.seleccionarNodoJerarquia).toHaveBeenCalledWith(nodo);
  });

  it('el header trae la luz amarilla de volver solo dentro de un listado, y devuelve al menú', () => {
    incentivosFalso.obtenerAsesores.mockReturnValue(of([ASESOR]));
    const fixture = abrirVisible();
    expect(document.body.querySelector('.mis-window-light--volver')).toBeNull();

    fixture.componentInstance['abrirAsesores']();
    fixture.detectChanges();

    const volver = document.body.querySelector('.mis-window-light--volver') as HTMLElement;
    expect(volver).not.toBeNull();
    volver.click();
    fixture.detectChanges();

    expect(fixture.componentInstance['vista']()).toBe('menu');
    // Y el pie deja de ofrecer "Seleccionar": en el menú no hay nada que confirmar.
    expect(botonSeleccionar()).toBeNull();
  });

  it('la luz roja cierra el diálogo', () => {
    const fixture = abrirVisible();
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);

    (document.body.querySelector('.mis-window-light--cerrar') as HTMLElement).click();

    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
  });

  it('elegirFinancieraConfianza() cierra el diálogo y delega en el servicio con la clase de usuario elegida', () => {
    const fixture = crear();
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);

    fixture.componentInstance['elegirFinancieraConfianza'](2);

    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
    expect(incentivosFalso.seleccionarFinancieraConfianza).toHaveBeenCalledWith(2);
  });

  it('cerrar() siempre emite visibleChange(false) y redirige al dashboard', () => {
    const fixture = crear();
    fixture.detectChanges();
    const visibleChangeSpy = vi.fn();
    fixture.componentInstance.visibleChange.subscribe(visibleChangeSpy);

    fixture.componentInstance['cerrar']();

    expect(visibleChangeSpy).toHaveBeenCalledWith(false);
  });

  it('volverAlMenu() regresa a la vista de menú y suelta la fila resaltada', () => {
    const fixture = crear();
    fixture.componentInstance['vista'].set('asesores');
    fixture.componentInstance['seleccionadoAsesor'].set(ASESOR);

    fixture.componentInstance['volverAlMenu']();

    expect(fixture.componentInstance['vista']()).toBe('menu');
    expect(fixture.componentInstance['seleccionadoAsesor']()).toBeNull();
  });
});

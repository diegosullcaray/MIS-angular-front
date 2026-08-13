import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ResponsablesComponent } from './responsables.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { ResponsableFila } from '../../../models/responsables.model';

describe('ResponsablesComponent', () => {
  let presupuestoFalso: {
    obtenerResponsables: ReturnType<typeof vi.fn>;
    guardarResponsables: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    presupuestoFalso = {
      obtenerResponsables: vi.fn().mockReturnValue(of([])),
      guardarResponsables: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [ResponsablesComponent],
      providers: [{ provide: PresupuestoService, useValue: presupuestoFalso }, MessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(ResponsablesComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al iniciar, carga los responsables del nivel "Administrador" por defecto (tip_cod 11)', () => {
    crear();
    expect(presupuestoFalso.obtenerResponsables).toHaveBeenCalledWith(11);
  });

  it('onNivelCambiado() vuelve a pedir los responsables del nuevo nivel y limpia el filtro', () => {
    const fixture = crear();
    fixture.componentInstance['filtro'].set('algo');

    fixture.componentInstance['onNivelCambiado']({ tip_cod: 4, des_lvl: 'Agencia' });

    expect(presupuestoFalso.obtenerResponsables).toHaveBeenCalledWith(4);
    expect(fixture.componentInstance['filtro']()).toBe('');
  });

  it('carga las filas y guarda un snapshot para poder reiniciar después', () => {
    const filas: ResponsableFila[] = [{ des_rel: 'Ag. 1', cod_res: 'ana@confianza.pe', usu_log: 'x', tim_log: 'y' }];
    presupuestoFalso.obtenerResponsables.mockReturnValue(of(filas));
    const fixture = crear();

    expect(fixture.componentInstance['filas']()).toEqual(filas);
  });

  it('muestra un toast de error si falla la carga', () => {
    presupuestoFalso.obtenerResponsables.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');

    crear();

    expect(errorSpy).toHaveBeenCalled();
  });

  it('esEditable() solo habilita la columna cod_res (Correo)', () => {
    const fixture = crear();
    expect(fixture.componentInstance['esEditable']({} as ResponsableFila, 'cod_res')).toBe(true);
    expect(fixture.componentInstance['esEditable']({} as ResponsableFila, 'des_rel')).toBe(false);
  });

  it('filasFiltradas() filtra por des_rel sin distinguir mayúsculas/minúsculas', () => {
    const filas: ResponsableFila[] = [
      { des_rel: 'Agencia Norte', cod_res: 'a@x.pe', usu_log: '', tim_log: '' },
      { des_rel: 'Agencia Sur', cod_res: 'b@x.pe', usu_log: '', tim_log: '' },
    ];
    presupuestoFalso.obtenerResponsables.mockReturnValue(of(filas));
    const fixture = crear();

    fixture.componentInstance['filtro'].set('sur');

    expect(fixture.componentInstance['filasFiltradas']()).toEqual([filas[1]]);
  });

  it('reiniciar() restaura las filas al snapshot original', () => {
    // El snapshot original (`filasOriginales`) se clona con `structuredClone`
    // al cargar — por eso acá se compara contra un literal independiente en
    // vez de reusar `filas`: mutar `filas()[0]` (misma referencia que el
    // array del mock) también mutaría `filas`, dando un falso negativo.
    const filas: ResponsableFila[] = [{ des_rel: 'Ag. 1', cod_res: 'ana@confianza.pe', usu_log: 'x', tim_log: 'y' }];
    presupuestoFalso.obtenerResponsables.mockReturnValue(of(filas));
    const fixture = crear();

    fixture.componentInstance['filas']()[0].cod_res = 'editado@confianza.pe';
    fixture.componentInstance['reiniciar']();

    expect(fixture.componentInstance['filas']()).toEqual([
      { des_rel: 'Ag. 1', cod_res: 'ana@confianza.pe', usu_log: 'x', tim_log: 'y' },
    ]);
  });

  it('guardar() envía todo el arreglo de filas (sin filtrar por ord, a diferencia de línea simple)', () => {
    const filas: ResponsableFila[] = [{ des_rel: 'Ag. 1', cod_res: 'ana@confianza.pe', usu_log: 'x', tim_log: 'y' }];
    presupuestoFalso.obtenerResponsables.mockReturnValue(of(filas));
    const fixture = crear();

    fixture.componentInstance['guardar']();

    expect(presupuestoFalso.guardarResponsables).toHaveBeenCalledWith(filas);
  });
});

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HierSelectorComponent } from './hier-selector.component';
import { ModSysAdminService } from '../../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import type { HierarquiaNodo, ParamsJerarquia } from '../../models/jerarquia.model';
import type { IWinderResponse } from '../../../../../core/winder/winder/winder.interface';
import type { UsuarioActivo } from '../../../../../core/interfaces/shell-state.model';

const PARAMS: ParamsJerarquia = { code: 9, maxLvl: 2, dlgTitulo: 'JERARQUIA UNIDAD' };

function usuario(overrides: Partial<UsuarioActivo> = {}): UsuarioActivo {
  return {
    id: 'u-1',
    nombre: 'Ana Torres',
    email: 'ana.torres@confianza.pe',
    rol: 'admin-sistema',
    subsistemas: [],
    codBt: 'BT-001',
    ...overrides,
  };
}

function respuesta(body: unknown): IWinderResponse {
  return { code: '0', headers: {}, body };
}

describe('HierSelectorComponent', () => {
  let antAdminFalso: { getBaseHierarchy: ReturnType<typeof vi.fn>; getLevelHierarchy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    antAdminFalso = {
      getBaseHierarchy: vi.fn().mockReturnValue(of(respuesta({ base_hierarchy: [] }))),
      getLevelHierarchy: vi.fn().mockReturnValue(of(respuesta({ level_hierarchy: [] }))),
    };

    TestBed.configureTestingModule({
      imports: [HierSelectorComponent],
      providers: [{ provide: ModSysAdminService, useValue: antAdminFalso }],
    });
    TestBed.inject(ShellStateService).setUsuarioActivo(usuario({ fechaCorte: '20260805' }));
  });

  function crear(params: ParamsJerarquia = PARAMS) {
    const fixture = TestBed.createComponent(HierSelectorComponent);
    fixture.componentRef.setInput('paramsHier', params);
    fixture.detectChanges();
    return fixture;
  }

  /** Sin `detectChanges()` — para poder suscribirse a `error`/`nodoSeleccionado` antes de que `ngOnInit()` dispare la carga (los observables mockeados emiten sincrónicamente). */
  function crearSinInit(params: ParamsJerarquia = PARAMS) {
    const fixture = TestBed.createComponent(HierSelectorComponent);
    fixture.componentRef.setInput('paramsHier', params);
    return fixture;
  }

  it('cargarRaiz() pide la jerarquía base al inicializarse, con el email del usuario activo', () => {
    antAdminFalso.getBaseHierarchy.mockReturnValue(
      of(respuesta({ base_hierarchy: [{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[] }))
    );
    crear();

    expect(antAdminFalso.getBaseHierarchy).toHaveBeenCalledWith('ana.torres@confianza.pe', 9);
  });

  it('cargarRaiz() pide level_hier del propio nivel de la raíz (root.lvl), no el nivel hijo', () => {
    antAdminFalso.getBaseHierarchy.mockReturnValue(
      of(respuesta({ base_hierarchy: [{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza', lvl: 1 } as HierarquiaNodo] }))
    );
    crear();

    // Confirmado contra el legado (log real de `hier-rem-selector.component.ts` en producción):
    // la primera llamada pide `lvl = root.lvl` (1) — devuelve la raíz "hidratada" con
    // des_rel/lbl_hier, no sus hijos.
    expect(antAdminFalso.getLevelHierarchy).toHaveBeenCalledWith(9, 1, 7, ['231'], expect.objectContaining({ key: 'fec', val: '2026-08-05' }));
  });

  it('onSeleccionarNivel() actualiza el nivel y pide el siguiente nivel si no supera maxLvl', () => {
    antAdminFalso.getBaseHierarchy.mockReturnValue(
      of(respuesta({ base_hierarchy: [{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[] }))
    );
    antAdminFalso.getLevelHierarchy.mockReturnValue(
      of(respuesta({ level_hierarchy: [{ tip_cod: 4, cod_rel: 'A1', des_rel: 'Agencia 1', lbl_hier: 'AGENCIA' }] as HierarquiaNodo[] }))
    );
    const fixture = crear({ code: 9, maxLvl: 2, dlgTitulo: 'x' });
    const instancia = fixture.componentInstance;
    const emitSpy = vi.fn();
    instancia.nodoSeleccionado.subscribe(emitSpy);

    const nodoElegido = { tip_cod: 4, cod_rel: 'A1', des_rel: 'Agencia 1', lvl: 2 };
    instancia['onSeleccionarNivel'](0, nodoElegido);

    expect(emitSpy).toHaveBeenCalledWith(nodoElegido);
  });

  it('emite error si la jerarquía base viene vacía — nunca llegaría a emitir nodoSeleccionado', () => {
    antAdminFalso.getBaseHierarchy.mockReturnValue(of(respuesta({ base_hierarchy: [] })));
    const fixture = crearSinInit();
    const errorSpy = vi.fn();
    fixture.componentInstance.error.subscribe(errorSpy);

    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('emite error si falla la petición de jerarquía base', () => {
    antAdminFalso.getBaseHierarchy.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crearSinInit();
    const errorSpy = vi.fn();
    fixture.componentInstance.error.subscribe(errorSpy);

    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('emite error si la carga inicial del primer nivel falla, aunque la raíz sí se haya resuelto', () => {
    antAdminFalso.getBaseHierarchy.mockReturnValue(
      of(respuesta({ base_hierarchy: [{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[] }))
    );
    antAdminFalso.getLevelHierarchy.mockReturnValue(throwError(() => new Error('caído')));
    const fixture = crearSinInit();
    const errorSpy = vi.fn();
    const nodoSpy = vi.fn();
    fixture.componentInstance.error.subscribe(errorSpy);
    fixture.componentInstance.nodoSeleccionado.subscribe(nodoSpy);

    fixture.detectChanges();

    expect(errorSpy).toHaveBeenCalled();
    expect(nodoSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('no emite error si el primer nivel sale bien pero un nivel más profundo falla (ya se emitió nodoSeleccionado antes)', () => {
    antAdminFalso.getBaseHierarchy.mockReturnValue(
      of(respuesta({ base_hierarchy: [{ tip_cod: 7, cod_rel: '231', desc_rel: 'Financiera Confianza' }] as HierarquiaNodo[] }))
    );
    antAdminFalso.getLevelHierarchy
      .mockReturnValueOnce(
        of(respuesta({ level_hierarchy: [{ tip_cod: 4, cod_rel: 'A1', des_rel: 'Agencia 1', lbl_hier: 'AGENCIA', lvl: 2 }] as HierarquiaNodo[] }))
      )
      .mockReturnValueOnce(throwError(() => new Error('caído')));
    const fixture = crearSinInit({ code: 9, maxLvl: 3, dlgTitulo: 'x' });
    const errorSpy = vi.fn();
    const nodoSpy = vi.fn();
    fixture.componentInstance.error.subscribe(errorSpy);
    fixture.componentInstance.nodoSeleccionado.subscribe(nodoSpy);

    fixture.detectChanges();

    expect(nodoSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

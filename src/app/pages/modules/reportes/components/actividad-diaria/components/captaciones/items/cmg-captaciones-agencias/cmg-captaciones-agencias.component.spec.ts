import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CmgCaptacionesAgenciasComponent } from './cmg-captaciones-agencias.component';
import { CmgCaptacionesAgenciasService } from '../../../../services/cmg-captaciones-agencias.service';
import { ModSysAdminService } from '../../../../../../../../../core/winder/instances/mod-sys-admin.service';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { PARAMS_HIER_OFICINA } from '../../../../../../models/jerarquia.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';

const NODO: HierarquiaNodo = { tip_cod: 2, cod_rel: 'AG01', desc_rel: 'Agencia 01', lvl: 2 };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('CmgCaptacionesAgenciasComponent', () => {
  let servicioFalso: { obtener: ReturnType<typeof vi.fn> };
  let antAdminFalso: { getBaseHierarchy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = { obtener: vi.fn() };
    antAdminFalso = { getBaseHierarchy: vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { base_hierarchy: [] } })) };
    TestBed.configureTestingModule({
      imports: [CmgCaptacionesAgenciasComponent],
      providers: [
        { provide: CmgCaptacionesAgenciasService, useValue: servicioFalso },
        { provide: ModSysAdminService, useValue: antAdminFalso },
        MessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(CmgCaptacionesAgenciasComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('usa la jerarquía de oficinas (OFI_1), no la de unidad', () => {
    const fixture = crear();
    expect(fixture.componentInstance['paramsHier']).toBe(PARAMS_HIER_OFICINA);
    expect(PARAMS_HIER_OFICINA.code).toBe(2);
    expect(PARAMS_HIER_OFICINA.maxLvl).toBe(5);
  });

  it('sin nivel elegido, no pide el reporte', () => {
    crear();
    expect(servicioFalso.obtener).not.toHaveBeenCalled();
  });

  it('onNivelSeleccionado() pide el reporte con tip_cod/cod_rel del nivel', () => {
    servicioFalso.obtener.mockReturnValue(of({ tabla1: tabla() }));
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(servicioFalso.obtener).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: 'AG01' });
  });

  it('onNivelSeleccionado() vuelca la tabla devuelta por el service y apaga el loading', () => {
    servicioFalso.obtener.mockReturnValue(
      of({
        tabla1: tabla({
          headers: [{ columns: [{ columnDef: 'age', header: 'Agencia', isdata: 1 }] }],
          body: [{ age: 'AG01' }],
        }),
      }),
    );
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(fixture.componentInstance['tabla1']().body).toEqual([{ age: 'AG01' }]);
    expect(fixture.componentInstance['nivelActual']()).toEqual(NODO);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('si el bloque viene vacío, avisa que los datos podrían seguir procesándose', () => {
    servicioFalso.obtener.mockReturnValue(of({ tabla1: tabla() }));
    const warnSpy = vi.spyOn(TestBed.inject(MessageService), 'add');
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(warnSpy).toHaveBeenCalled();
  });

  it('ante un error del backend muestra un toast y apaga el loading', () => {
    servicioFalso.obtener.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });
});

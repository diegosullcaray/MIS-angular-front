import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MonitorReprogramadosComponent } from './monitor-reprogramados.component';
import { AvanceComercialService } from '../../../services/avance-comercial.service';
import { ModSysAdminService } from '../../../../../../core/winder/instances/mod-sys-admin.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const NODO: HierarquiaNodo = { tip_cod: 4, cod_rel: 'A1', desc_rel: 'Agencia 1', lvl: 2 };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('MonitorReprogramadosComponent', () => {
  let servicioFalso: { obtenerMonitorReprogramados: ReturnType<typeof vi.fn> };
  let antAdminFalso: { getBaseHierarchy: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioFalso = { obtenerMonitorReprogramados: vi.fn().mockReturnValue(of(tabla())) };
    antAdminFalso = { getBaseHierarchy: vi.fn().mockReturnValue(of({ code: '0', headers: {}, body: { base_hierarchy: [] } })) };
    TestBed.configureTestingModule({
      imports: [MonitorReprogramadosComponent],
      providers: [
        { provide: AvanceComercialService, useValue: servicioFalso },
        { provide: ModSysAdminService, useValue: antAdminFalso },
        MessageService,
      ],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(MonitorReprogramadosComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('sin nivel elegido, no pide el reporte', () => {
    crear();
    expect(servicioFalso.obtenerMonitorReprogramados).not.toHaveBeenCalled();
  });

  it('onNivelSeleccionado() pide el reporte con tip_cod/cod_rel y tipo por defecto=1', () => {
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(servicioFalso.obtenerMonitorReprogramados).toHaveBeenCalledWith({ tip_cod: 4, cod_rel: 'A1' }, 1);
  });

  it('onTipoSeleccionado() sin nivel elegido todavía, no pide nada', () => {
    const fixture = crear();

    fixture.componentInstance['onTipoSeleccionado'](2);

    expect(servicioFalso.obtenerMonitorReprogramados).not.toHaveBeenCalled();
    expect(fixture.componentInstance['tipoSeleccionado']()).toBe(2);
  });

  it('onTipoSeleccionado() con un nivel ya elegido, recarga el reporte con el nuevo tipo', () => {
    const fixture = crear();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    servicioFalso.obtenerMonitorReprogramados.mockClear();

    fixture.componentInstance['onTipoSeleccionado'](2);

    expect(servicioFalso.obtenerMonitorReprogramados).toHaveBeenCalledWith({ tip_cod: 4, cod_rel: 'A1' }, 2);
  });

  it('carga la tabla devuelta por el backend y apaga el loading', () => {
    servicioFalso.obtenerMonitorReprogramados.mockReturnValue(
      of(tabla({ headers: [{ columns: [{ columnDef: 'x', header: 'X', isdata: 1 }] }], body: [{ x: 1 }] }))
    );
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(fixture.componentInstance['tablaReprogramados']().body).toEqual([{ x: 1 }]);
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });

  it('ante un error del backend, muestra un toast y apaga el loading', () => {
    servicioFalso.obtenerMonitorReprogramados.mockReturnValue(throwError(() => new Error('caído')));
    const errorSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    const fixture = crear();

    fixture.componentInstance['onNivelSeleccionado'](NODO);

    expect(errorSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['cargando']()).toBe(false);
  });
});

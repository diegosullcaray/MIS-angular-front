import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MonitorEfectividadesReasignadosComponent } from './monitor-efectividades-reasignados.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('MonitorEfectividadesReasignadosComponent', () => {
  let servicioSpy: { monitorEfectividadesReasignados: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = {
      monitorEfectividadesReasignados: vi.fn().mockReturnValue(of([TABLA_VACIA, TABLA_VACIA])),
    };

    TestBed.configureTestingModule({
      imports: [MonitorEfectividadesReasignadosComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(MonitorEfectividadesReasignadosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a monitorEfectividadesReasignados', () => {
    const fixture = TestBed.createComponent(MonitorEfectividadesReasignadosComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.monitorEfectividadesReasignados).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
    );
  });
});

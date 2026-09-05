import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MonitorProductosMisionalesComponent } from './monitor-productos-misionales.component';
import { DesarrolloSostenibleService } from '../../services/desarrollo-sostenible.service';
import { TABLA_VACIA } from '../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

describe('MonitorProductosMisionalesComponent', () => {
  let servicioSpy: { obtenerMonitorProductosMisionales: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = {
      obtenerMonitorProductosMisionales: vi.fn().mockReturnValue(
        of({
          kpiOperaciones: null,
          tablaDetalle: TABLA_VACIA,
          tablaSimple: TABLA_VACIA,
        })
      ),
    };

    TestBed.configureTestingModule({
      imports: [MonitorProductosMisionalesComponent],
      providers: [
        { provide: DesarrolloSostenibleService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(MonitorProductosMisionalesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel consulta el servicio con nodo y producto', () => {
    const fixture = TestBed.createComponent(MonitorProductosMisionalesComponent);
    fixture.detectChanges();

    fixture.componentInstance['onNivelSeleccionado'](NODO);
    expect(servicioSpy.obtenerMonitorProductosMisionales).toHaveBeenCalledWith(
      { tip_cod: 9, cod_rel: 'FC' },
      'TODOS'
    );
  });
});

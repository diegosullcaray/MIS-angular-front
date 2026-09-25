import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { MonitorEfectividadesComponent } from './monitor-efectividades.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('MonitorEfectividadesComponent', () => {
  let servicioSpy: Record<'monitorEfectividades' | 'detalleEfectividades' | 'opcionesUltimaGestion', ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    servicioSpy = {
      monitorEfectividades: vi.fn().mockReturnValue(of([TABLA_VACIA, TABLA_VACIA, TABLA_VACIA])),
      detalleEfectividades: vi.fn().mockReturnValue(of(TABLA_VACIA)),
      opcionesUltimaGestion: vi.fn().mockReturnValue(of([{ id: 'TODO', desc: 'TODO' }])),
    };

    TestBed.configureTestingModule({
      imports: [MonitorEfectividadesComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(MonitorEfectividadesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a monitorEfectividades', () => {
    const fixture = TestBed.createComponent(MonitorEfectividadesComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.monitorEfectividades).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
    );
  });

  it('la pestaña "Detalle de Efectividades" pide el `_02` con sus filtros propios, no el resumen', () => {
    const fixture = TestBed.createComponent(MonitorEfectividadesComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.detalleEfectividades).toHaveBeenCalledWith(
      'monitor',
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
      expect.objectContaining({ tramof: 'TODO', prod: 'TODO', comp_r: 'TODO', resp: 'TODO', fcompro: 'TODO', nom: '%%' }),
      1,
    );
  });
});

import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DatosProductoComponent } from './datos-producto.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('DatosProductoComponent', () => {
  let servicioSpy: { datosProducto: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = {
      datosProducto: vi.fn().mockReturnValue(of([TABLA_VACIA, TABLA_VACIA, TABLA_VACIA, TABLA_VACIA])),
    };

    TestBed.configureTestingModule({
      imports: [DatosProductoComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(DatosProductoComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a datosProducto', () => {
    const fixture = TestBed.createComponent(DatosProductoComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.datosProducto).toHaveBeenCalledWith(
      { tip_cod: 1, cod_rel: '100' },
      expect.any(String),
    );
  });
});

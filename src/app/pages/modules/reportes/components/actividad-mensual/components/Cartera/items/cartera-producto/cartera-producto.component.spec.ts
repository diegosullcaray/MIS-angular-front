import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CarteraProductoComponent } from './cartera-producto.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { CARTERA_PRODUCTO_VACIO } from './models/cartera-producto.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('CarteraProductoComponent', () => {
  let servicioSpy: { carteraProducto: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { carteraProducto: vi.fn().mockReturnValue(of(CARTERA_PRODUCTO_VACIO)) };

    TestBed.configureTestingModule({
      imports: [CarteraProductoComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(CarteraProductoComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a carteraProducto', () => {
    const fixture = TestBed.createComponent(CarteraProductoComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.carteraProducto).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
    );
  });
});

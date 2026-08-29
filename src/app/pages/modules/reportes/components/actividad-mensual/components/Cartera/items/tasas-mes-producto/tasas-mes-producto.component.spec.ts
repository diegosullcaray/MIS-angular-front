import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TasasMesProductoComponent } from './tasas-mes-producto.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 2, cod_rel: '200', desc_rel: 'Oficina 200', lvl: 1 };

describe('TasasMesProductoComponent', () => {
  let servicioSpy: { tasasMesProducto: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { tasasMesProducto: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [TasasMesProductoComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(TasasMesProductoComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a tasasMesProducto', () => {
    const fixture = TestBed.createComponent(TasasMesProductoComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.tasasMesProducto).toHaveBeenCalledWith(
      { tip_cod: 2, cod_rel: '200' },
      expect.any(String),
    );
  });
});

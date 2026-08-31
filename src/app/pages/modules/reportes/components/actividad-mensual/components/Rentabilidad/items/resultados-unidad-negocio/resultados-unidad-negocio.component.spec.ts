import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ResultadosUnidadNegocioComponent } from './resultados-unidad-negocio.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('ResultadosUnidadNegocioComponent', () => {
  let servicioSpy: { resultadosUnidadNegocio: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = { resultadosUnidadNegocio: vi.fn().mockReturnValue(of({ tabla1: TABLA_VACIA })) };

    TestBed.configureTestingModule({
      imports: [ResultadosUnidadNegocioComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(ResultadosUnidadNegocioComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a resultadosUnidadNegocio con canal RED', () => {
    const fixture = TestBed.createComponent(ResultadosUnidadNegocioComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.resultadosUnidadNegocio).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      'RED',
      expect.any(String),
    );
  });
});

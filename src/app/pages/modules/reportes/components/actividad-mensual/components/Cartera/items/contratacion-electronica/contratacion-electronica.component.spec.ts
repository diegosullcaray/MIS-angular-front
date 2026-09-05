import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ContratacionElectronicaComponent } from './contratacion-electronica.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('ContratacionElectronicaComponent', () => {
  let servicioSpy: { contratacionElectronica: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = {
      contratacionElectronica: vi.fn().mockReturnValue(of([TABLA_VACIA, TABLA_VACIA, TABLA_VACIA])),
    };

    TestBed.configureTestingModule({
      imports: [ContratacionElectronicaComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(ContratacionElectronicaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a contratacionElectronica', () => {
    const fixture = TestBed.createComponent(ContratacionElectronicaComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.contratacionElectronica).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      expect.any(String),
    );
  });
});

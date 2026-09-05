import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { GestionCarteraReasignadaComponent } from './gestion-cartera-reasignada.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('GestionCarteraReasignadaComponent', () => {
  let servicioSpy: { gestionCarteraReasignadaFlujo: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = {
      gestionCarteraReasignadaFlujo: vi.fn().mockReturnValue(of([TABLA_VACIA, TABLA_VACIA])),
    };

    TestBed.configureTestingModule({
      imports: [GestionCarteraReasignadaComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(GestionCarteraReasignadaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a gestionCarteraReasignadaFlujo', () => {
    const fixture = TestBed.createComponent(GestionCarteraReasignadaComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.gestionCarteraReasignadaFlujo).toHaveBeenCalledWith(
      expect.objectContaining({ tip_cod: 1, cod_rel: '100' }),
      0,
      expect.any(String),
    );
  });
});

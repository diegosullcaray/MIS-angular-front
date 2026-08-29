import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { GestionCarteraReasignadaMesComponent } from './gestion-cartera-reasignada-mes.component';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';
import { TABLA_VACIA } from '../../../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 1, cod_rel: '100', desc_rel: 'Unidad 100', lvl: 1 };

describe('GestionCarteraReasignadaMesComponent', () => {
  let servicioSpy: { gestionCarteraReasignadaMes: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = {
      gestionCarteraReasignadaMes: vi.fn().mockReturnValue(of([TABLA_VACIA, TABLA_VACIA])),
    };

    TestBed.configureTestingModule({
      imports: [GestionCarteraReasignadaMesComponent],
      providers: [
        { provide: ActividadMensualCraService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(GestionCarteraReasignadaMesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel debe llamar a gestionCarteraReasignadaMes', () => {
    const fixture = TestBed.createComponent(GestionCarteraReasignadaMesComponent);
    fixture.detectChanges();
    fixture.componentInstance['onNivelSeleccionado'](NODO);
    fixture.detectChanges();
    expect(servicioSpy.gestionCarteraReasignadaMes).toHaveBeenCalledWith(
      { tip_cod: 1, cod_rel: '100' },
      0,
      expect.any(String),
    );
  });
});

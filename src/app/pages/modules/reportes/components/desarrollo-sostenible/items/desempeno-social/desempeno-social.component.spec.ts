import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { DesempenoSocialComponent } from './desempeno-social.component';
import { DesarrolloSostenibleService } from '../../services/desarrollo-sostenible.service';
import { TABLA_VACIA } from '../../../../models/tabla-reporte.model';
import type { HierarquiaNodo } from '../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

describe('DesempenoSocialComponent', () => {
  let servicioSpy: { obtenerDesempenoSocial: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    servicioSpy = {
      obtenerDesempenoSocial: vi.fn().mockReturnValue(of(TABLA_VACIA)),
    };

    TestBed.configureTestingModule({
      imports: [DesempenoSocialComponent],
      providers: [
        { provide: DesarrolloSostenibleService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(DesempenoSocialComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel consulta el servicio obtenerDesempenoSocial', () => {
    const fixture = TestBed.createComponent(DesempenoSocialComponent);
    fixture.detectChanges();

    fixture.componentInstance['onNivelSeleccionado'](NODO);
    expect(servicioSpy.obtenerDesempenoSocial).toHaveBeenCalledWith({ tip_cod: 9, cod_rel: 'FC' });
  });
});

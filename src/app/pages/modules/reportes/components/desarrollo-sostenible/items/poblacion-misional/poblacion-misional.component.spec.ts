import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { PoblacionMisionalComponent } from './poblacion-misional.component';
import { DesarrolloSostenibleService } from '../../services/desarrollo-sostenible.service';
import { TABLA_DINAMICA_VACIA } from '../../../../models/tabla-dinamica.model';
import type { HierarquiaNodo } from '../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };

class ResizeObserverMock {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

describe('PoblacionMisionalComponent', () => {
  let servicioSpy: { obtenerPoblacionMisional: ReturnType<typeof vi.fn> };

  beforeAll(() => {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverMock;
  });

  beforeEach(() => {
    servicioSpy = {
      obtenerPoblacionMisional: vi.fn().mockReturnValue(
        of({
          territorio: TABLA_DINAMICA_VACIA,
          corredores: TABLA_DINAMICA_VACIA,
          unidad: TABLA_DINAMICA_VACIA,
          asesores: TABLA_DINAMICA_VACIA,
        })
      ),
    };

    TestBed.configureTestingModule({
      imports: [PoblacionMisionalComponent],
      providers: [
        { provide: DesarrolloSostenibleService, useValue: servicioSpy },
        MessageService,
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(PoblacionMisionalComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('al seleccionar nivel consulta el servicio con nodo y población seleccionada', () => {
    const fixture = TestBed.createComponent(PoblacionMisionalComponent);
    fixture.detectChanges();

    fixture.componentInstance['onNivelSeleccionado'](NODO);
    expect(servicioSpy.obtenerPoblacionMisional).toHaveBeenCalledWith(
      { tip_cod: 9, cod_rel: 'FC' },
      'ClientesNuevos'
    );
  });
});

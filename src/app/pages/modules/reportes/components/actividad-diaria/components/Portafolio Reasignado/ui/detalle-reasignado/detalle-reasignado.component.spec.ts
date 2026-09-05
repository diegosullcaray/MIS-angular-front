import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { DetalleReasignadoComponent } from './detalle-reasignado.component';

import type { HierarquiaNodo } from '../../../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };


describe('DetalleReasignadoComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      consultar: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
      opcionesUltimaGestion: vi.fn().mockReturnValue(of([])),
    };

    TestBed.configureTestingModule({
      imports: [DetalleReasignadoComponent],
      providers: [
        MessageService,
        {
      provide: ToastService,
      useValue: {
        error: vi.fn(),
        exito: vi.fn(),
        advertencia: vi.fn(),
        info: vi.fn(),
      },
    },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(DetalleReasignadoComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

});

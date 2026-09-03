import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { ResumenMovilidadRecuperacionesComponent } from './resumen-movilidad-recuperaciones.component';
import { ResumenMovilidadService } from '../../services/resumen-movilidad.service';
import type { HierarquiaNodo } from '../../../../models/jerarquia.model';

const NODO: HierarquiaNodo = { tip_cod: 9, cod_rel: 'FC' };


describe('ResumenMovilidadRecuperacionesComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  

  beforeEach(() => {
    servicioSpy = {
      documentoUsuario: vi.fn().mockReturnValue(of('12345678')),
      recuperaciones: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [ResumenMovilidadRecuperacionesComponent],
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
        { provide: ResumenMovilidadService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(ResumenMovilidadRecuperacionesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

});

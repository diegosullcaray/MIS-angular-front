import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { MovimientoClientesComponent } from './movimiento-clientes.component';
import { MovimientoClientesService } from '../../services/movimiento-clientes.service';


describe('MovimientoClientesComponent', () => {
  let servicioSpy: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(() => {
    servicioSpy = {
      obtener: vi.fn().mockReturnValue(of({ headers: [], body: [], rows: [], items: [], total: 0, kpis: {}, estadoRenovacion: { categorias: [], series: [] }, antiguedadCliente: { categorias: [], series: [] }, cards: [], table: [] })),
    };

    TestBed.configureTestingModule({
      imports: [MovimientoClientesComponent],
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
        { provide: MovimientoClientesService, useValue: servicioSpy },
      ],
    });
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(MovimientoClientesComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('cargar() vuelve a pedir el reporte', () => {
    const cmp = TestBed.createComponent(MovimientoClientesComponent).componentInstance;
    expect(servicioSpy['obtener']).toHaveBeenCalledTimes(1);

    cmp['cargar']();

    expect(servicioSpy['obtener']).toHaveBeenCalledTimes(2);
    expect(cmp['cargando']()).toBe(false);
  });

});

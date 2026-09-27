import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { DetalleReasignadoComponent } from './detalle-reasignado.component';




describe('DetalleReasignadoComponent', () => {

  

  beforeEach(() => {
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

import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { GestionCarteraReasignadaComponent } from './gestion-cartera-reasignada.component';



describe('GestionCarteraReasignadaComponent', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GestionCarteraReasignadaComponent],
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
    const fixture = TestBed.createComponent(GestionCarteraReasignadaComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

});

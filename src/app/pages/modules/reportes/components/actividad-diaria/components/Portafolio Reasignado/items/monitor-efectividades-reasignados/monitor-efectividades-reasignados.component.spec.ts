import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { MonitorEfectividadesReasignadosComponent } from './monitor-efectividades-reasignados.component';



describe('MonitorEfectividadesReasignadosComponent', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MonitorEfectividadesReasignadosComponent],
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
    const fixture = TestBed.createComponent(MonitorEfectividadesReasignadosComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

});

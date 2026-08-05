import { TestBed } from '@angular/core/testing';
import { MessageService } from 'primeng/api';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;
  let messages: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MessageService] });
    service = TestBed.inject(ToastService);
    messages = TestBed.inject(MessageService);
  });

  it('exito() publica un mensaje "success" con la duración por defecto', () => {
    const spy = vi.spyOn(messages, 'add');

    service.exito('Filtros aplicados');

    expect(spy).toHaveBeenCalledWith({ severity: 'success', summary: 'Filtros aplicados', detail: undefined, life: 4500 });
  });

  it('error() publica un mensaje "error" con el detalle dado', () => {
    const spy = vi.spyOn(messages, 'add');

    service.error('No se pudo guardar', 'Verifica tu conexión.');

    expect(spy).toHaveBeenCalledWith({ severity: 'error', summary: 'No se pudo guardar', detail: 'Verifica tu conexión.', life: 4500 });
  });

  it('info() publica un mensaje "info"', () => {
    const spy = vi.spyOn(messages, 'add');

    service.info('Sesión por expirar');

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info', summary: 'Sesión por expirar' }));
  });

  it('advertencia() publica un mensaje "warn"', () => {
    const spy = vi.spyOn(messages, 'add');

    service.advertencia('Acceso denegado', 'Tu rol no permite entrar aquí.');

    expect(spy).toHaveBeenCalledWith({ severity: 'warn', summary: 'Acceso denegado', detail: 'Tu rol no permite entrar aquí.', life: 4500 });
  });
});

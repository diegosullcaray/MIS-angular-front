import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MessageService as PrimeNgMessageService } from 'primeng/api';
import { ClientesReprogramadosComponent } from './clientes-reprogramados.component';
import { ClientesReprogramadosService } from '../../../services/analista/clientes-reprogramados.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type { AsesorSec } from '../../../models/analista/asesor-sec.model';
import type { TablaReporteResultado, FilaReporte } from '../../../models/tabla-reporte.model';

const ASESOR: AsesorSec = { nombre: 'Juan Pérez', dni: '12345678' };
const CLIENTE: FilaReporte = { nom_cli: 'María López', num_doc: '87654321' };

function tabla(overrides: Partial<TablaReporteResultado> = {}): TablaReporteResultado {
  return { headers: [], body: [], additional: {}, ...overrides };
}

describe('ClientesReprogramadosComponent', () => {
  let servicioFalso: {
    obtenerAsesores: ReturnType<typeof vi.fn>;
    obtenerClientes: ReturnType<typeof vi.fn>;
    guardar: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    servicioFalso = {
      obtenerAsesores: vi.fn().mockReturnValue(of([ASESOR])),
      obtenerClientes: vi.fn().mockReturnValue(of(tabla({ body: [CLIENTE] }))),
      guardar: vi.fn().mockReturnValue(of({})),
    };
    TestBed.configureTestingModule({
      imports: [ClientesReprogramadosComponent],
      providers: [{ provide: ClientesReprogramadosService, useValue: servicioFalso }, ToastService, PrimeNgMessageService],
    });
  });

  function crear() {
    const fixture = TestBed.createComponent(ClientesReprogramadosComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('al crearse, carga la lista de asesores', () => {
    crear();
    expect(servicioFalso.obtenerAsesores).toHaveBeenCalled();
  });

  it('onAsesorSeleccionado() carga la cartera de clientes del asesor elegido', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);

    expect(servicioFalso.obtenerClientes).toHaveBeenCalledWith({ tip_cod: 2, cod_rel: ASESOR.dni });
    expect(fixture.componentInstance['tablaClientes']().body).toEqual([CLIENTE]);
  });

  it('onClienteSeleccionado() arranca en blanco si el cliente no tiene respuestas previas', () => {
    const fixture = crear();
    fixture.componentInstance['onClienteSeleccionado'](CLIENTE);

    expect(fixture.componentInstance['clienteSeleccionado']()).toEqual(CLIENTE);
    expect(fixture.componentInstance['tabActiva']()).toBe('encuesta');
    expect(fixture.componentInstance['model']()).toEqual({ preg_01: '', preg_02: '', preg_03: null, preg_04: '' });
  });

  it('onClienteSeleccionado() precarga las respuestas si el cliente ya las tenía (columnas sueltas, no anidadas)', () => {
    const fixture = crear();
    const clienteConRespuestas: FilaReporte = {
      ...CLIENTE,
      preg_01: 'SI',
      preg_02: 'Parcial',
      preg_03: 0.3,
      preg_04: 'En evaluación',
    };

    fixture.componentInstance['onClienteSeleccionado'](clienteConRespuestas);

    expect(fixture.componentInstance['model']()).toEqual({ preg_01: 'SI', preg_02: 'Parcial', preg_03: 0.3, preg_04: 'En evaluación' });
  });

  it('onGuardar() guarda, vuelve a "lista" y recarga la cartera', () => {
    const fixture = crear();
    fixture.componentInstance['onAsesorSeleccionado'](ASESOR);
    fixture.componentInstance['clienteSeleccionado'].set(CLIENTE);
    fixture.componentInstance['tabActiva'].set('encuesta');
    fixture.componentInstance['model'].set({ preg_01: 'SI', preg_02: 'Total', preg_03: 0.5, preg_04: 'Si Acepta Masiva' });
    servicioFalso.obtenerClientes.mockClear();

    fixture.componentInstance['onGuardar']();

    expect(servicioFalso.guardar).toHaveBeenCalledWith(CLIENTE, fixture.componentInstance['model']());
    expect(fixture.componentInstance['tabActiva']()).toBe('lista');
    expect(fixture.componentInstance['clienteSeleccionado']()).toBeNull();
    expect(servicioFalso.obtenerClientes).toHaveBeenCalled();
  });

  it('onGuardar() ante un error del backend muestra un toast y no bloquea el botón', () => {
    servicioFalso.guardar.mockReturnValue(throwError(() => new Error('falló')));
    const fixture = crear();
    const toastSpy = vi.spyOn(TestBed.inject(ToastService), 'error');
    fixture.componentInstance['clienteSeleccionado'].set(CLIENTE);

    fixture.componentInstance['onGuardar']();

    expect(toastSpy).toHaveBeenCalled();
    expect(fixture.componentInstance['guardando']()).toBe(false);
  });
});
